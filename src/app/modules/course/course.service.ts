import mongoose from "mongoose";
import { Review } from "../review/review.model";
import { ICourse } from "./course.interface";
import { Course } from "./course.model";
import AppError from "../../errors/AppError";
import { JwtPayload } from "jsonwebtoken";

const createCourseIntoDB = async (payload: ICourse, userData: JwtPayload) => {
  const { _id } = userData;
  payload.createdBy = _id
  const result = await Course.create(payload);
  return result;
}

const getAllCoursesFromDB = async (query: any) => {

  const queryObj = { ...query };
  console.log(queryObj);

  // let queryFilter = {};

  const { page = 1, limit = 10, sortBy, sortOrder, minPrice, maxPrice, tags, startDate, endDate, language, provider, durationInWeeks, level } = queryObj;

  console.log(durationInWeeks, startDate, endDate);
  const matchStage: any = {};


  if (minPrice !== undefined && maxPrice !== undefined) {
    matchStage.price = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice),
    };
  }


  if (tags) {
    matchStage['tags.name'] = tags;
  }

  if (startDate && endDate) {
    matchStage.startDate = {
      $gt: new Date(startDate),
      $lt: new Date(endDate),
    };
  } else if (startDate) {
    matchStage.startDate = {
      $gt: new Date(startDate),
    };
  }

  if (language) {
    matchStage.language = language;
  }

  if (provider) {
    matchStage.provider = provider;
  }

  if (durationInWeeks) {
    matchStage.durationInWeeks = Number(durationInWeeks);
  }

  if (level) {
    matchStage['details.level'] = level;
  }
  console.log(matchStage);
  // Add other conditions similarly

  const aggregationPipeline = [
    { $match: matchStage },
    { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } },
    { $skip: (page - 1) * Number(limit) },
    { $limit: Number(limit) },
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
        title: 1,
        instructor: 1,
        categoryId: 1,
        price: 1,
        tags: 1,
        startDate: 1,
        endDate: 1,
        language: 1,
        provider: 1,
        durationInWeeks: 1,
        details: 1,
        createdBy: {
          _id: "$createdBy._id",
          username: "$createdBy.username",
          email: "$createdBy.email",
          role: "$createdBy.role",
        
        },
        createdAt: 1,
        updatedAt: 1,
      }
    } 
  ];
  // @ts-ignore
  const res = await Course.aggregate(aggregationPipeline);
  const total = await Course.countDocuments(aggregationPipeline);
  const response = {
    courses: res
  }

  const meta = {
    page: page,
    limit: limit,
    total: total
  }

  const result = {
    meta: meta,
    data: response
  }

  return result;
}

const getCourseWithReviewFromDB = async (id: string) => {
  const res = await Course.findById(id).populate({
    path: 'createdBy',
    select: { _id: 1, username: 1, email: 1, role: 1 } 
  });
  const reviews = await Review.find({ courseId: `${id}` }).populate({
    path: 'createdBy',
    select: { _id: 1, username: 1, email: 1, role: 1 }  
  })

  const result = {
    course: res,
    reviews: reviews
  }

  return result;
}

const updateCourseIntoDB = async (id: string, payload: Partial<ICourse>) => {
  const { details, tags, ...remainingCourseData } = payload;

  const modifiedUpdatedData: Record<string, unknown> = {
    ...remainingCourseData,
  };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    //step1: basic course info update
    if (details && Object.keys(details).length) {
      for (const [key, value] of Object.entries(details)) {
        modifiedUpdatedData[`details.${key}`] = value;
      }
    }

    const updatedBasicCourseInfo = await Course.findByIdAndUpdate(id, modifiedUpdatedData, {
      new: true,
      runValidators: true,
    });
    if (!updatedBasicCourseInfo) {
      throw new AppError(401, 'Failed to update course!');
    }

    // check if there is any tags to update
    if (tags && tags.length > 0) {
      // filter out the deleted fields
      const deletedTags = tags
        .filter((el) => el.name && el.isDeleted)
        .map((el) => el.name);

      const deletedCourseTags = await Course.findByIdAndUpdate(
        id,
        {
          $pull: {
            tags: { name: { $in: deletedTags } },
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!deletedCourseTags) {
        throw new AppError(400, 'Failed to update course!');
      }

      // filter out the new tag fields
      const newTags = tags?.filter(
        (el) => el.name && !el.isDeleted,
      );

      const newCourseTags = await Course.findByIdAndUpdate(
        id,
        {
          $addToSet: { tags: { $each: newTags } },
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!newCourseTags) {
        throw new AppError(400, 'Failed to update course!');
      }

    }

    await session.commitTransaction();
    await session.endSession();

    const result = await Course.findById(id).populate({
      path: 'createdBy',
      select: { _id: 1, username: 1, email: 1, role: 1 }  // Specify desired fields
    });

    return result;

  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(400, 'Failed to update course');
  }

}

const getBestCourseFromDB = async () => {

  const avgRating = await Review.aggregate([
    {
      $group: {
        _id: '$courseId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }

      },
    },
    {
      $lookup: {
        from: 'courses', // The name of the Course collection
        localField: '_id',
        foreignField: '_id',
        as: 'courseInfo'
      }
    },
    {
      $unwind: '$courseInfo'
    },
    { $lookup: {
      from: 'users',  
      localField: 'courseInfo.createdBy',
      foreignField: '_id',
      as: 'createdBy'
  }},
  {
    $unwind: '$createdBy'
  },
  {
     $project: {
      _id: 1,
      averageRating: 1,
      reviewCount: 1,
      courseInfo: {
          _id: 1,
        title: 1,
        instructor: 1,
        categoryId: 1,
        price: 1,
        tags: 1,
        startDate: 1,
        endDate: 1,
        language: 1,
        provider: 1,
        durationInWeeks: 1,
        details: 1,
        createdBy: {
          _id: "$createdBy._id",
          username: "$createdBy.username",
          email: "$createdBy.email",
          role: "$createdBy.role",
        
        },
        createdAt: 1,
        updatedAt: 1,
      }
  }
},
    {
      $sort: {
        averageRating: -1
      }
    },
    {
      $limit: 1
    }

  ])

  const result = {
    course: avgRating[0].courseInfo,
    averageRating: avgRating[0].averageRating,
    reviewCount: avgRating[0].reviewCount
  }

  return result;
}

export const courseServices = {
  createCourseIntoDB,
  getAllCoursesFromDB,
  updateCourseIntoDB,
  getCourseWithReviewFromDB,
  getBestCourseFromDB
}