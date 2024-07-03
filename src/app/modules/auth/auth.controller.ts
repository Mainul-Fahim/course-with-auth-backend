import catchAsync from "../../utills/catchAsync";
import sendResponse from "../../utills/sendResponse";
import { authServices } from "./auth.service";

const userRegister = catchAsync(async (req, res) => {
    const result = await authServices.registerUser(req.body);
  
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  });

  const loginUser = catchAsync(async (req, res) => {
    const result = await authServices.loginUser(req.body);
    const {  accessToken, userPayload } = result;
  
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User is logged in succesfully!',
      data: {
        user:userPayload,
        token: accessToken,
      },
    });
  });

  const changePassword = catchAsync(async (req, res) => {
    const { ...passwordData } = req.body;
  
    const result = await authServices.changePassword(req.user, passwordData);
    console.log(result);
    if(!result){
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Password change failed. Ensure the new password is unique and not among the last 2 used (last used on ${result.timestamp}).`,
        data: null,
      });
    }
    else {
      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Password is updated succesfully!',
        data: result,
      });
    }
  });

  export const authController = {
    userRegister,
    loginUser,
    changePassword
  }