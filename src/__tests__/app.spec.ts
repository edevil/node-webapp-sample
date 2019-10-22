import { AuthenticationError } from "apollo-server-koa";
import * as CSRF from "csrf";
import * as request from "supertest";
import { Connection, createConnection, getConnectionOptions, getRepository } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../app";
import { config } from "../config";
import { CreateUser } from "../dtos/create-user";
import { Card } from "../entities/card";
import { User } from "../entities/user";
import { cardsResolver } from "../graphql/resolvers/cards";
import { userProfileResolver } from "../graphql/resolvers/user-profile";
import { shutdownSubscriptions } from "../initializers/graphql";
import { closeRedis, initRedis } from "../initializers/redis";
import { logger } from "../logger";
import { router } from "../routes";
import { createUser } from "../service";
import { getGQLContext } from "../utils";

let conn: Connection;
beforeAll(async () => {
  const connectionOptions = Object.assign(await getConnectionOptions(), {
    database: `${config.dbName}_test`,
  });
  try {
    conn = await createConnection(connectionOptions);
  } catch (err) {
    logger.error("Could not create connection", { error: err });
    throw err;
  }
  initRedis();
});

afterAll(async () => {
  await conn.close();
  closeRedis();
  shutdownSubscriptions();
});

beforeEach(async () => {
  await conn.dropDatabase();
  await conn.runMigrations({ transaction: "all" });
});

describe("GET / - simple test", () => {
  it("Hello API request", async () => {
    const result = await request(app.callback()).get(router.url("index"));
    expect(result.text).toContain("Sample node app");
    expect(result.status).toEqual(200);
  });
});

describe("User registration tests", () => {
  it("GET user registration page", async () => {
    const result = await request(app.callback()).get(router.url("auth-register"));
    expect(result.text).toContain("Sample node app");
    expect(result.status).toEqual(200);
  });

  it("POST successful user registration", async () => {
    CSRF.prototype.verify = jest.fn(() => true);
    const email = "teste1@example.com";
    const password = "teste12345";
    const result = await request(app.callback())
      .post(router.url("auth-register"))
      .type("form")
      .send({ email, password, passwordConfirmation: password })
      .set("csrf-token", "test");

    expect(result.status).toEqual(302);
    expect(result.header.location).toEqual(router.url("index"));

    const repository = getRepository(User);
    const user = await repository.findOne({ email });
    expect(user).toBeDefined();
  });
});

describe("User login/logout tests", () => {
  it("GET user login page", async () => {
    const result = await request(app.callback()).get(router.url("auth-login"));
    expect(result.text).toContain("Sample node app");
    expect(result.status).toEqual(200);
  });

  it("successful login/logout dance", async () => {
    CSRF.prototype.verify = jest.fn(() => true);
    const agent = request.agent(app.callback());

    // GET logout, ensure redirect
    const rLogoutRedir = await agent.get(router.url("auth-logout"));
    expect(rLogoutRedir.header.location).toEqual(router.url("auth-login"));
    expect(rLogoutRedir.status).toEqual(302);

    // manually create user
    const email = "teste1@example.com";
    const password = "teste12345";
    const createReq: CreateUser = new CreateUser();
    createReq.email = email;
    createReq.password = password;
    const user = await createUser(createReq, getRepository(User));

    // POST login
    const rLogin = await agent
      .post(router.url("auth-login"))
      .type("form")
      .send({ email, password })
      .set("csrf-token", "test");

    expect(rLogin.status).toEqual(302);
    expect(rLogin.header.location).toEqual(router.url("auth-logout"));

    // ensure GET logout is successful
    const rLogout = await agent.get(router.url("auth-logout"));
    expect(rLogout.text).toContain("Sample node app");
    expect(rLogout.status).toEqual(200);

    // POST logout
    const rLogoutPost = await agent.post(router.url("auth-logout-post")).set("csrf-token", "test");

    expect(rLogoutPost.status).toEqual(302);
    expect(rLogoutPost.header.location).toEqual(router.url("index"));

    // GET logout -> redir
    const rLogoutRedir2 = await agent.get(router.url("auth-logout"));
    expect(rLogoutRedir2.header.location).toEqual(router.url("auth-login"));
    expect(rLogoutRedir2.status).toEqual(302);
  });
});

describe("GraphQL resolvers tests", () => {
  it("cards() resolver", async () => {
    const context = getGQLContext(null);
    const noCards = await cardsResolver.cards(null, null, context, null);
    expect(noCards).toBeInstanceOf(Array);
    expect(noCards.length).toBe(0);

    const repository = getRepository(Card);
    const card = {
      description: "description",
      id: uuid(),
      title: "title",
    };
    await repository.insert(card);

    const oneCard = await cardsResolver.cards(null, null, context, null);
    expect(oneCard).toBeInstanceOf(Array);
    expect(oneCard.length).toBe(1);
    expect(oneCard[0].description).toBe(card.description);
  });

  it("userProfile() resolver", async () => {
    const noAuthContext = getGQLContext(null);
    const noAuth = async () => userProfileResolver.userProfile(null, null, noAuthContext, null);

    await expect(noAuth()).rejects.toThrow(AuthenticationError);

    const email = "teste1@example.com";
    const password = "teste12345";
    const createReq: CreateUser = new CreateUser();
    createReq.email = email;
    createReq.password = password;
    const user = await createUser(createReq, getRepository(User));
    const authContext = getGQLContext(user);
    const profile = await userProfileResolver.userProfile(null, null, authContext, null);
    expect(profile).toBe(user);
  });
});
