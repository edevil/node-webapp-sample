import { Model, RelationMappings } from "objection";
import { OAuthClient } from "./oauth-client";
import { User } from "./user";

export class OAuthAuthorizationCode extends Model {
  public static tableName = "o_auth_authorization_code";
  public static idColumn = "authorizationCode";
  public static modelPaths = [__dirname];
  public static relationMappings: RelationMappings = {
    client: {
      join: {
        from: "o_auth_authorization_code.clientId",
        to: "o_auth_client.id",
      },
      modelClass: "oauth-client",
      relation: Model.BelongsToOneRelation,
    },
    user: {
      join: {
        from: "o_auth_authorization_code.userId",
        to: "user.id",
      },
      modelClass: "user",
      relation: Model.BelongsToOneRelation,
    },
  };

  public userId: number;
  public user: User;
  public clientId: string;
  public client: OAuthClient;

  public authorizationCode: string;
  public scope: string;
  public redirectUri: string;

  public expiresAt: Date;
  public createdAt: Date;
  public updatedAt: Date;

  public $beforeUpdate() {
    this.updatedAt = new Date();
  }
}
