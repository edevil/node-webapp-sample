import * as OAuth2Server from "oauth2-server";
import { getConnection, getRepository } from "typeorm";
import { OAuthAccessToken } from "./entities/oauth-access-token";
import { OAuthAuthorizationCode } from "./entities/oauth-auth-code";
import { OAuthClient } from "./entities/oauth-client";
import { OAuthRefreshToken } from "./entities/oauth-refresh-token";
import { User } from "./entities/user";

const ALLOWED_GRANTS = ["authorization_code", "refresh_token"];

const model: OAuth2Server.AuthorizationCodeModel & OAuth2Server.RefreshTokenModel = {
  async verifyScope(token, scope) {
    if (!token.scope) {
      return false;
    }
    const requestedScopes = (scope as string).split(" ");
    const authorizedScopes = (token.scope as string).split(" ");
    return requestedScopes.every((s) => authorizedScopes.includes(s));
  },
  async validateScope(user, client, scope) {
    if (!(scope as string).split(" ").every((s) => client.scopes.includes(s))) {
      return false;
    }
    return scope;
  },
  async getClient(clientId, clientSecret) {
    const repository = getRepository(OAuthClient);
    const client = await repository.findOne(clientId);

    if (!client) {
      return false;
    } else if (clientSecret && clientSecret !== client.secret) {
      return false;
    } else {
      return client;
    }
  },
  async saveToken(token, client, user) {
    const accessToken = new OAuthAccessToken();
    accessToken.accessToken = token.accessToken;
    accessToken.accessTokenExpiresAt = token.accessTokenExpiresAt;
    accessToken.scope = token.scope as string;
    accessToken.client = client as OAuthClient;
    accessToken.user = user as User;

    const refreshToken = new OAuthRefreshToken();
    refreshToken.refreshToken = token.refreshToken;
    refreshToken.refreshTokenExpiresAt = token.refreshTokenExpiresAt;
    refreshToken.scope = token.scope as string;
    refreshToken.client = client as OAuthClient;
    refreshToken.user = user as User;

    await getConnection().manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(accessToken);
      await transactionalEntityManager.save(refreshToken);
    });

    return {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      client,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      scope: token.scope,
      user,
    };
  },
  async saveAuthorizationCode(code, client, user) {
    const authCode = new OAuthAuthorizationCode();
    authCode.authorizationCode = code.authorizationCode;
    authCode.expiresAt = code.expiresAt;
    authCode.redirectUri = code.redirectUri;
    authCode.scope = code.scope as string;
    authCode.client = client as OAuthClient;
    authCode.user = user as User;

    const repository = getRepository(OAuthAuthorizationCode);
    await repository.save(authCode);

    return authCode;
  },
  async getAuthorizationCode(authorizationCode) {
    const repository = getRepository(OAuthAuthorizationCode);
    return repository.findOne(authorizationCode, { relations: ["user", "client"] });
  },
  async revokeToken(token) {
    const repository = getRepository(OAuthRefreshToken);
    const result = await repository
      .createQueryBuilder()
      .delete()
      .where("id = :id", { id: token.id })
      .returning("*")
      .execute();
    return !!result.raw;
  },
  async revokeAuthorizationCode(code) {
    const repository = getRepository(OAuthAuthorizationCode);
    const result = await repository
      .createQueryBuilder()
      .delete()
      .where("authorizationCode = :authorizationCode", { authorizationCode: code.authorizationCode })
      .returning("*")
      .execute();
    return !!result.raw;
  },
  async getAccessToken(accessToken) {
    const repository = getRepository(OAuthAccessToken);
    return repository.findOne(accessToken, { relations: ["user", "client"] });
  },
  async getRefreshToken(refreshToken) {
    const repository = getRepository(OAuthRefreshToken);
    return repository.findOne(refreshToken, { relations: ["user", "client"] });
  },
};

const options: OAuth2Server.ServerOptions = {
  model,
};

export const oauth = new OAuth2Server(options);
