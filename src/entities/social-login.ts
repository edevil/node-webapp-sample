import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from "typeorm";
import { User } from "@app/entities/user";

export enum SocialType {
  Google,
  Twitter,
}

@Entity()
@Index(["type", "clientId"], { unique: true })
export class SocialLogin {
  @PrimaryColumn("enum", {
    enum: SocialType,
  })
  type: SocialType;

  @ManyToOne(type => User, user => user.socialLogins, {
    primary: true,
  })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column("text")
  clientId: string;
}
