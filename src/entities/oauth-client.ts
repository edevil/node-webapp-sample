import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { OAuthAccessToken } from "./oauth-access-token";
import { OAuthAuthorizationCode } from "./oauth-auth-code";
import { OAuthRefreshToken } from "./oauth-refresh-token";
import { User } from "./user";

@Entity()
export class OAuthClient {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column("text")
  public secret: string;

  @ManyToOne(
    type => User,
    user => user.oauthClients,
    {
      onDelete: "CASCADE",
    },
  )
  public user: User;

  @OneToMany(
    type => OAuthAccessToken,
    token => token.user,
  )
  public oauthAccessTokens: OAuthAccessToken[];

  @OneToMany(
    type => OAuthRefreshToken,
    token => token.user,
  )
  public oauthRefreshTokens: OAuthRefreshToken[];

  @OneToMany(
    type => OAuthAuthorizationCode,
    code => code.user,
  )
  public oauthAuthorizationCodes: OAuthAuthorizationCode[];

  @Column("text", {
    array: true,
  })
  public redirectUris: string[];

  @Column("text", {
    array: true,
  })
  public grants: string[];

  @Column("text", {
    array: true,
  })
  public scopes: string[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
