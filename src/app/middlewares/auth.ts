import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import AppError from '../errors/AppError';
import { User } from '../modules/user/user.model';
import { IUserRole } from '../modules/user/user.interface';
import catchAsync from '../utills/catchAsync';


const auth = (...requiredRoles: IUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    // checking if the token is missing
    if (!token) {
      throw new AppError(401, 'You are not authorized!');
    }

    // checking if the given token is valid
    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as string,
    ) as JwtPayload;

    const { role, _id } = decoded;

    console.log(decoded);


    // checking if the user is exist
    const user = await User.isUserExistsByCustomId(_id);

    console.log(user);


    if (!user) {
      throw new AppError(404, 'This user is not found !');
    }

    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new AppError(
        401,
        'Unauthorized Access',
      );
      // res.status(401).json({
      //   success: false,
      //   message: "Unauthorized Access",
      //   errorMessage: "You do not have the necessary permissions to access this resource.",
      //   errorDetails: null,
      //   stack: null
      // });
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

export default auth;