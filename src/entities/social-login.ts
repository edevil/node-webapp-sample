import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user";

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
  public type: SocialType;

  @ManyToOne(
    type => User,
    user => user.socialLogins,
    {
      onDelete: "CASCADE",
      primary: true,
    },
  )
  public user: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @Column("text")
  public clientId: string;
}
