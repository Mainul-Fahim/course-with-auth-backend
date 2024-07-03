/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import bcrypt from 'bcrypt';
import { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import AppError from "../../errors/AppError";
import { IUser } from "../user/user.interface";
import { User, isValidPassword } from "../user/user.model";
import { ILoginUser } from "./auth.interface";
import { createToken } from "./auth.utils";

const registerUser = async (payload: IUser) => {
  if (await User.isUserExistsByName(payload.username)) {
    throw new Error('User already exists!');
  }

  const res = await User.create(payload);

  const { password, passwordHistory, ...userPayload } = res.toObject();
  console.log(res)
  const result = userPayload
  return result;
}


const loginUser = async (payload: ILoginUser) => {
  // checking if the user is exist
  const user = await User.isUserExistsByName(payload.username);
  console.log(user);

  if (!user) {
    throw new AppError(404, 'This user is not found !');
  }

  //checking if the password is correct

  if (!(await User.isPasswordMatched(payload?.password, user?.password)))
    throw new AppError(403, 'Password do not matched');
 // @ts-ignore
  const { password, passwordHistory, createdAt, updatedAt, ...userPayload } = user.toObject();


  //create token and sent to the  client

  const jwtPayload = {
    _id: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return {
    userPayload,
    accessToken,
  };
};

const changePassword = async (
  userData: JwtPayload,
  payload: { currentPassword: string; newPassword: string },
) => {
  // Checking if the user exists
  const user = await User.isUserExistsByCustomId(userData._id);
  console.log(user);
  if (!user) {
    throw new AppError(404, 'This user is not found!');
  }
  console.log(payload.currentPassword, payload.newPassword);
  // Check if the current password matches
  if (!(await User.isPasswordMatched(payload.currentPassword, user?.password))) {
    throw new AppError(403, 'Password do not match');
  }

  if ((await User.isPasswordMatched(payload.newPassword, user?.password))) {
    throw new Error('Password change failed. Ensure the new password is unique and not among the last 2 used (last used on 2023-01-01 at 12:00 PM).');
  }
  console.log(user);

  const isMatchedPasswords = []

  if (user.passwordHistory.length > 0) {
    let isPasswordMatched = false;
    for (const historyEntry of user.passwordHistory) {
      if (await bcrypt.compare(payload.newPassword, historyEntry.password)) {
        isPasswordMatched = true;
        isMatchedPasswords.push(1);
        break; 
      }
    }
  }

  console.log(isMatchedPasswords);
  if (isMatchedPasswords?.length > 0) {
    throw new Error('Cannot reuse passwords from the last 2 changes.');
  }

  if (!isValidPassword(payload.newPassword)) {
    throw new Error(
      'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)'
    );
  }

  
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  
  const newPasswordHistoryEntry = {
    password: newHashedPassword,
    changedAt: new Date(),
  };

 
  await User.updateOne(
    { _id: userData._id },
    {
      password: newHashedPassword,
      $push: { passwordHistory: { $each: [newPasswordHistoryEntry], $slice: -2 } },
    },
  );

  // @ts-ignore
  const { password, passwordHistory, ...userPayload } = user.toObject();

  return userPayload;

}
export const authServices = {
  loginUser,
  registerUser,
  changePassword
};