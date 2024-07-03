/* eslint-disable no-unused-vars */

import { Model } from "mongoose";
import { USER_ROLE } from "./user.constant";

export interface PasswordHistory {
    password: string;
    changedAt: Date;
}

export interface IUser {
    _id: string;
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin'
    passwordHistory: [PasswordHistory]
}

export interface UserModel extends Model<IUser> {
    //instance methods for checking if the user exist
    isUserExistsByCustomId(id: string): Promise<IUser>;
    isUserExistsByName(username: string): Promise<IUser>;
    //instance methods for checking if passwords are matched
    isPasswordMatched(
      plainTextPassword: string,
      hashedPassword: string,
    ): Promise<boolean>;
  }

  export type IUserRole = keyof typeof USER_ROLE;