import status from "http-status";
import config from "../../config";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import { User, UserRole } from "@prisma/client";
import { sendEmail } from "../../utils/sendEmail";
import QueryBuilder from "../../builder/QueryBuilder";
import { jwtHelpers } from "./../../helpers/jwtHelpers";
import { hashPassword } from "../../helpers/hashPassword";

const createUserIntoDB = async (payload: User) => {
  // Check if user exists by email
  const isUserExistByEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExistByEmail) {
    throw new ApiError(
      status.BAD_REQUEST,
      `User with this email: ${payload.email} already exists!`
    );
  }

  const hashedPassword = await hashPassword(payload.password);

  const userData = {
    ...payload,
    password: hashedPassword,
    isVerified: false,
  };

  const jwtPayload = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    role: UserRole.USER,
    profilePic: payload?.profilePic || "",
    isVerified: false,
  };

  const accessToken = jwtHelpers.createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string
  );

  const confirmedLink = `${config.verify.email}?token=${accessToken}`;

  await prisma.user.create({ data: userData });
  await sendEmail(payload.email, undefined, confirmedLink);

  return {
    message:
      "We have sent a confirmation email to your email address. Please check your inbox.",
  };
};

const getAllUserFromDB = async (query: Record<string, unknown>) => {
const result=await prisma.user.findMany({include:{Profile:true}})

  if (!result.length) {
    throw new ApiError(status.NOT_FOUND, "No users found!");
  }

  // Remove password from each user
  const data = result.map((user: User) => {
    const { password, ...rest } = user;
    return rest;
  });

  return {
    data,
  };
};

const updateUserIntoDB = async (userId: string, payload: Partial<User>) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!payload.profilePic && isUserExist.profilePic) {
    payload.profilePic = isUserExist.profilePic;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      profilePic: payload.profilePic 
    },
    select: {
      id: true,
      firstName: true,
      lastName:true,
      email: true,
      profilePic: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const updateUserProfileIntoDB = async (userId: string, payload: Partial<any>) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  // Dynamically build update data
  const userUpdateData: any = {};
  if (payload?.fullName) userUpdateData.fullName = payload.fullName;
  if (payload?.profilePic) userUpdateData.profilePic = payload.profilePic;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: userUpdateData,
    select: {
      id: true,
      firstName: true,
      lastName:true,
      email: true,
      profilePic: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      Profile: true,
    },
  });

 
  

  return updatedUser;
};

const getSingleUserByIdFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include:{
      Profile:true
    }
  })

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const { password, ...rest } = user;

  return rest;
};

const deleteUserFromDB = async (userId: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return null;
};

export const UserService = {
  createUserIntoDB,
  getAllUserFromDB,
  updateUserIntoDB,
  deleteUserFromDB,
  getSingleUserByIdFromDB,
  updateUserProfileIntoDB,
};
