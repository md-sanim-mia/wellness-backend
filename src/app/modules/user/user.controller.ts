import status from "http-status";
import config from "../../config";
import { UserService } from "./user.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const createUser = catchAsync(async (req, res) => {
  
  const result = await UserService.createUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: result.message,
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const result = await UserService.getAllUserFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Users are retrieved successfully!",
   
    data: result.data,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const userId = req?.user?.id as string

  if (req.file) {
    req.body.profilePic = `${config.url.image}/uploads/${req.file.filename}`;
  }

  const result = await UserService.updateUserIntoDB(userId, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User updated successfully!",
    data: result,
  });
});
const updateUserProfile = catchAsync(async (req, res) => {
  const userId = req?.user?.id as string;
  const file = req.file;
 
  // if (!file) {
  //   throw new Error("Image file is required");
  // }

  const upload = { ...req.body, profilePic: file?.path };
  console.log(upload)
  const result = await UserService.updateUserProfileIntoDB(userId, upload);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User profile updated successfully!",
    data: result,
  });
});

const getSingleUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const result = await UserService.getSingleUserByIdFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User retrieved successfully!",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  await UserService.deleteUserFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User deleted successfully!",
  });
});

export const UserController = {
  createUser,
  getAllUser,
  updateUser,
  deleteUser,
  getSingleUserById,
  updateUserProfile
};
