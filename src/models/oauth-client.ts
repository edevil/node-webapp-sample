import { Model, RelationMappings } from "objection";
import { User } from "./user";

export class OAuthClient extends Model {
  public static tableName = "o_auth_client";
  public static modelPaths = [__dirname];
  public static relationMappings: RelationMappings = {
    oauthAccessTokens: {
      join: {
        from: "o_auth_client.id",
        to: "o_auth_access_token.clientId",
      },
      modelClass: "oauth-access-token",
      relation: Model.HasManyRelation,
    },
    oauthAuthorizationCodes: {
      join: {
        from: "o_auth_client.id",
        to: "o_auth_authorization_code.clientId",
      },
      modelClass: "oauth-auth-code",
      relation: Model.HasManyRelation,
    },
    oauthRefreshTokens: {
      join: {
        from: "o_auth_client.id",
        to: "o_auth_refresh_token.clientId",
      },
      modelClass: "oauth-refresh-token",
      relation: Model.HasManyRelation,
    },
    user: {
      join: {
        from: "o_auth_client.userId",
        to: "user.id",
      },
      modelClass: "user",
      relation: Model.BelongsToOneRelation,
    },
  };

  public id: string;
  public user: User;
  public secret: string;
  public grants: string[];
  public scopes: string[];
  public redirectUris: string[];
  public createdAt: Date;
  public updatedAt: Date;

  public $beforeUpdate() {
    this.updatedAt = new Date();
  }
}