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
import { OAuthRefreshToken } from "./oauth-refresh-token";
import { User } from "./user";

@Entity()
export class OAuthClient {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  public secret: string;

  @ManyToOne(type => User, user => user.oauthClients, {
    onDelete: "CASCADE",
    primary: true,
  })
  public user: User;

  @OneToMany(type => OAuthAccessToken, token => token.user)
  public oauthAccessTokens: OAuthAccessToken[];

  @OneToMany(type => OAuthRefreshToken, token => token.user)
  public oauthRefreshTokens: OAuthRefreshToken[];

  @Column("text", {
    array: true,
  })
  public redirectUris: string[];

  @Column("text", {
    array: true,
  })
  public grants: string[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
