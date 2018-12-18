import { Model, RelationMappings } from "objection";
import { OAuthClient } from "./oauth-client";
import { User } from "./user";

export class OAuthRefreshToken extends Model {
  public static tableName = "o_auth_refresh_token";
  public static idColumn = "refreshToken";
  public static modelPaths = [__dirname];
  public static relationMappings: RelationMappings = {
    client: {
      join: {
        from: "o_auth_refresh_token.clientId",
        to: "o_auth_client.id",
      },
      modelClass: "oauth-client",
      relation: Model.BelongsToOneRelation,
    },
    user: {
      join: {
        from: "o_auth_refresh_token.userId",
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

  public refreshToken: string;
  public scope: string;

  public refreshTokenExpiresAt: Date;
  public createdAt: Date;
  public updatedAt: Date;

  public $beforeUpdate() {
    this.updatedAt = new Date();
  }
}
