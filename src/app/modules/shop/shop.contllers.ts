// store.controller.ts
import { Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { StoreStatus } from '@prisma/client';
import { storeServices } from './shop.services';

// 🆕 CREATE STORE
const createStore = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await storeServices.createStore(userId, req.body);

  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Store created successfully",
    data: result
  });
});

// 📋 GET ALL STORES
const getAllStores = catchAsync(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '10',
    shopStatus,
    status,
    categoryId,
    search
  } = req.query;

  // Parse and validate query parameters
  const filters = {
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 10,
    shopStatus: shopStatus as StoreStatus,
    status: status as StoreStatus,
    categoryId: categoryId as string,
    search: search as string
  };

  const result = await storeServices.getAllStores(req.query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Stores retrieved successfully",
    data: result
  });
});

// 🔍 GET SINGLE STORE
const getSingleStore = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await storeServices.getSingleStore(id);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Store retrieved successfully",
    data: result
  });
});

// ✅ APPROVE STORE
const approveStore = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await storeServices.approveStore(id);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Store approved successfully",
    data: result
  });
});

// ❌ REJECT STORE
const rejectStore = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await storeServices.rejectStore(id);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Store rejected successfully",
    data: result
  });
});

// 🏪 GET MY STORE
const getMyStore = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await storeServices.getMyStore(userId);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "My store retrieved successfully",
    data: result
  });
});



// 🟢 SET STORE ONLINE
const setStoreOnline = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const result = await storeServices.setStoreOnline(id, userId);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Store set to online successfully",
    data: result
  });
});

// 🔴 SET STORE OFFLINE
const setStoreOffline = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const result = await storeServices.setStoreOffline(id, userId);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Store set to offline successfully",
    data: result
  });
});

// ✏️ UPDATE STORE CATEGORIES
const updateStoreCategories = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { categoryIds } = req.body;
  const result = await storeServices.updateStoreCategories(id, categoryIds);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Store categories updated successfully",
    data: result
  });
});

// 📊 GET STORES BY CATEGORY
const getStoresByCategory = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const {
    page = '1',
    limit = '10',
  } = req.query;

  const filters = {
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 10,
  };

  const result = await storeServices.getStoresByCategory(categoryId, filters);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Stores by category retrieved successfully",
    data: result
  });
});

export const storeController = {
  createStore,
  getAllStores,
  getSingleStore,
  approveStore,
  rejectStore,
  getMyStore,
  setStoreOnline,
  setStoreOffline,
  updateStoreCategories,
  getStoresByCategory
};