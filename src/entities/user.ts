import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OAuthAccessToken } from "./oauth-access-token";
import { OAuthAuthorizationCode } from "./oauth-auth-code";
import { OAuthClient } from "./oauth-client";
import { OAuthRefreshToken } from "./oauth-refresh-token";
import { SocialLogin } from "./social-login";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @Column("text", {
    nullable: true,
    unique: true,
  })
  public username: string;

  @Column("text", {
    nullable: true,
  })
  public password: string;

  @Column("text", {
    unique: true,
  })
  public email: string;

  @OneToMany(
    type => SocialLogin,
    login => login.user,
  )
  public socialLogins: SocialLogin[];

  @OneToMany(
    type => OAuthClient,
    client => client.user,
  )
  public oauthClients: OAuthClient[];

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
}
