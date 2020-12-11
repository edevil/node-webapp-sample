import { genSaltSync, hashSync } from "bcryptjs";
import { EntityManager, Repository } from "typeorm";
import { CreateGoogleUser } from "./dtos/create-google-user";
import { CreateUser } from "./dtos/create-user";
import { SocialLogin, SocialType } from "./entities/social-login";
import { User } from "./entities/user";

export async function createUser(createReq: CreateUser, repository: Repository<User>): Promise<User> {
  const salt = genSaltSync();
  const hash = hashSync(createReq.password, salt);
  const user = new User();
  user.email = createReq.email;
  user.password = hash;
  await repository.insert(user);
  return user;
}

export async function createUserFromGoogle(createReq: CreateGoogleUser, manager: EntityManager): Promise<User> {
  const user = new User();
  user.email = createReq.email;
  const socialLogin = new SocialLogin();
  socialLogin.clientId = createReq.username;
  socialLogin.type = SocialType.Google;
  socialLogin.user = user;
  await manager.transaction(async (transactionalEntityManager) => {
    await transactionalEntityManager.insert(User, user);
    await transactionalEntityManager.insert(SocialLogin, socialLogin);
  });
  return user;
}
