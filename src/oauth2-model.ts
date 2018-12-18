import * as OAuth2Server from "oauth2-server";
import { transaction } from "objection";
import { OAuthAccessToken } from "./models/oauth-access-token";
import { OAuthAuthorizationCode } from "./models/oauth-auth-code";
import { OAuthClient } from "./models/oauth-client";
import { OAuthRefreshToken } from "./models/oauth-refresh-token";
import { User } from "./models/user";

const ALLOWED_GRANTS = ["authorization_code", "refresh_token"];

const model: OAuth2Server.AuthorizationCodeModel & OAuth2Server.RefreshTokenModel = {
  async verifyScope(token, scope) {
    if (!token.scope) {
      return false;
    }
    const requestedScopes = (scope as string).split(" ");
    const authorizedScopes = (token.scope as string).split(" ");
    return requestedScopes.every(s => authorizedScopes.includes(s));
  },
  async validateScope(user, client, scope) {
    if (!(scope as string).split(" ").every(s => client.scopes.includes(s))) {
      return false;
    }
    return scope;
  },
  async getClient(clientId, clientSecret) {
    const client = await OAuthClient.query().findOne("id", clientId);

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
    accessToken.clientId = client.id;
    accessToken.userId = user.id;

    const refreshToken = new OAuthRefreshToken();
    refreshToken.refreshToken = token.refreshToken;
    refreshToken.refreshTokenExpiresAt = token.refreshTokenExpiresAt;
    refreshToken.scope = token.scope as string;
    refreshToken.clientId = client.id;
    refreshToken.userId = user.id;

    await transaction(OAuthAccessToken.knex(), async trx => {
      await OAuthAccessToken.query(trx).insert(accessToken);
      await OAuthRefreshToken.query(trx).insert(refreshToken);
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
    authCode.clientId = client.id;
    authCode.userId = user.id;

    return OAuthAuthorizationCode.query().insert(authCode);
  },
  async getAuthorizationCode(authorizationCode) {
    return OAuthAuthorizationCode.query()
      .eagerAlgorithm(OAuthAuthorizationCode.JoinEagerAlgorithm)
      .eager("[user, client]")
      .findOne("authorizationCode", authorizationCode);
  },
  async revokeToken(token) {
    const deleted = await OAuthRefreshToken.query()
      .delete()
      .where("refreshToken", token.refreshToken);
    return deleted === 1;
  },
  async revokeAuthorizationCode(code) {
    const deleted = await OAuthAuthorizationCode.query()
      .delete()
      .where("authorizationCode", code.authorizationCode);
    return deleted === 1;
  },
  async getAccessToken(accessToken) {
    return OAuthAccessToken.query()
      .eagerAlgorithm(OAuthAccessToken.JoinEagerAlgorithm)
      .eager("[user, client]")
      .findOne("accessToken", accessToken);
  },
  async getRefreshToken(refreshToken) {
    return OAuthRefreshToken.query()
      .eagerAlgorithm(OAuthRefreshToken.JoinEagerAlgorithm)
      .eager("[user, client]")
      .findOne("refreshToken", refreshToken);
  },
};

const options: OAuth2Server.ServerOptions = {
  model,
};

export const oauth = new OAuth2Server(options);
