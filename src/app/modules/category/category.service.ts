import { PasswordHistory } from './../user/user.interface';
import { JwtPayload } from "jsonwebtoken";
import { ICategory } from "./category.interface";
import { Category } from "./category.model";

const createCategoryIntoDB = async (payload: ICategory, userData: JwtPayload) => {
    const { _id } = userData;
    payload.createdBy = _id
    const result = await Category.create(payload);
    return result;
}

const getAllCategoriesFromDB = async () => {
  
    const aggregationPipeline = [
        {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy'
        }
      },
      { $unwind: "$createdBy" }, 
      {
        $project: {
          _id: 1,
          name: 1,
          // Include the 'createdBy' document as a nested object
          createdBy: {
            _id: "$createdBy._id",
            username: "$createdBy.username",
            email: "$createdBy.email",
            role: "$createdBy.role",
            // ...other fields
          },
          createdAt: 1,
          updatedAt: 1,
        }
      }
      ];

      const response = await Category.aggregate(aggregationPipeline);

    const result = {
        categories: response
    }
    return result;
}

export const categoryServices = {
    createCategoryIntoDB,
    getAllCategoriesFromDB
}