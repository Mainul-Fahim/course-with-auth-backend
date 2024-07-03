import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { reviewController } from './review.controller';
import { createReviewValidationSchema } from './review.validation';
import { USER_ROLE } from '../user/user.constant';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/reviews',auth(USER_ROLE.user),validateRequest(createReviewValidationSchema),reviewController.createReview);

export const reviewRoutes = router