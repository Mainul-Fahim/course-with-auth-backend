import { Schema, model } from "mongoose";
import { ICategory } from "./category.interface";

const categorySchema = new Schema<ICategory>({
        name: {type: String, required:true, unique: true },
        createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
},{ versionKey: false,timestamps: true  })

export const Category = model<ICategory>('Category', categorySchema)