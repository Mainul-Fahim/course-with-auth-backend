import { Schema, model } from "mongoose";
import bcrypt from 'bcrypt';
import { IUser, PasswordHistory, UserModel } from "./user.interface";
import config from "../../config";

const PasswordHistorySchema = new Schema<PasswordHistory>({
    password: { type: String, required: true },
    changedAt: { type: Date, required: true }
})

const userSchema = new Schema<IUser,UserModel>(
    {

        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            select: 0,
            validate(value: string) {
                if (!isValidPassword(value)) {
                    throw new Error(
                        'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)'
                    );
                }
            },
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        passwordHistory: {
            type: [PasswordHistorySchema],
          }
    },
    {
        timestamps: true,
        versionKey: false
    },
);

userSchema.pre('save', async function (next) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const user = this; // doc
    // hashing password and save into DB

    user.password = await bcrypt.hash(
        user.password,
        Number(config.bcrypt_salt_rounds),
    );

    // user.passwordHistory = [{password: user.password, changedAt: new Date()}];

    next();
});

// set '' after saving password
userSchema.post('save', function (doc, next) {
    doc.password = '';
    next();
});

userSchema.statics.isUserExistsByCustomId = async function (_id: string) {
    return await User.findOne({ _id }).select('+password');
  };

  userSchema.statics.isUserExistsByName = async function (username: string) {
    return await User.findOne({ username }).select('+password');
  };

  userSchema.statics.isPasswordMatched = async function (
    plainTextPassword,
    hashedPassword,
  ) {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  };
  

export function isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
}

export const User = model<IUser,UserModel>('User', userSchema);