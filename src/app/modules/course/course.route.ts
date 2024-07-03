import express from 'express';
import { courseController } from './course.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createCourseValidationSchema, updateCourseValidationSchema } from './course.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';

const router = express.Router();

router.post('/course',auth(USER_ROLE.admin),validateRequest(createCourseValidationSchema),courseController.createCourse);
router.put('/courses/:courseId',auth(USER_ROLE.admin),validateRequest(updateCourseValidationSchema),courseController.updateCourse);
router.get('/courses',courseController.getAllCourses);
router.get('/courses/:courseId/reviews',courseController.getCourseWithReview);
router.get('/course/best',courseController.getBestCourse);

export const courseRoutes = router