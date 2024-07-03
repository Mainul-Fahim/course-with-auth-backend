import express from 'express';
import validateRequest from "../../middlewares/validateRequest";
import { createCategoryValidationSchema } from './category.validation';
import { categoryController } from './category.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';

const router = express.Router();

router.post('/categories',auth(USER_ROLE.admin),validateRequest(createCategoryValidationSchema),categoryController.createCategory);
router.get('/categories',categoryController.getAllCategories);

export const categoryRoutes = router