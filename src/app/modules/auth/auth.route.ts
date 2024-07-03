import express from 'express';

import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from './auth.validation';
import { authController } from './auth.controller';
import { USER_ROLE } from '../user/user.constant';
import auth from '../../middlewares/auth';


const router = express.Router();

router.post(
    '/auth/register',
    validateRequest(authValidation.registerValidationSchema),
    authController.userRegister,
);


router.post(
    '/auth/login',
    validateRequest(authValidation.loginValidationSchema),
    authController.loginUser,
);

router.post(
    '/auth/change-password',
    auth(USER_ROLE.admin,USER_ROLE.user),
    validateRequest(authValidation.changePasswordValidationSchema),
    authController.changePassword,
  );

export const authRoutes = router;