import { JwtPayload } from "jsonwebtoken";
import { IReview } from "./review.interface";
import { Review } from "./review.model";

const createReviewIntoDB = async (payload: IReview, userData: JwtPayload) => {
    const { _id } = userData;
    payload.createdBy = _id
    
    const result = (await Review.create(payload));
    const populatedReview = await result.populate({
        path: 'createdBy',
        select: { _id: 1, username: 1, email: 1, role: 1 }  
      });
    return populatedReview;
}


export const reviewServices = {
    createReviewIntoDB
}