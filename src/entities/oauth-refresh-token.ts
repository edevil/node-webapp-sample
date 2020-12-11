import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { OAuthClient } from "./oauth-client";
import { User } from "./user";

@Entity()
export class OAuthRefreshToken {
  @PrimaryColumn()
  public refreshToken: string;

  @ManyToOne((type) => User, (user) => user.oauthRefreshTokens, {
    onDelete: "CASCADE",
  })
  public user: User;

  @ManyToOne((type) => OAuthClient, (client) => client.oauthRefreshTokens, {
    onDelete: "CASCADE",
  })
  public client: OAuthClient;

  @Column("text")
  public scope: string;

  @Column("timestamp")
  public refreshTokenExpiresAt: Date;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
