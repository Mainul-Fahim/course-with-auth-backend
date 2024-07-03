import { Types } from "mongoose";

export interface ICategory{
    name: string;
    createdBy: Types.ObjectId;
}