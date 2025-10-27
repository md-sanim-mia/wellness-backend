// category.controller.ts
import { Request, response, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { categoryServices } from './Category.services';
import sendResponse from '../../utils/sendResponse';
import status from 'http-status';

const createCategory=catchAsync(async(req,res)=>{

    const result=await categoryServices.createCategory(req.body)

  return  sendResponse(res,{
        statusCode:status.CREATED,
        message:"caregory success fully created done",
        data :result
    })


})
// 📋 GET ALL CATEGORIES
const getAllCategories = catchAsync(async (req: Request, res: Response) => {

  const result = await categoryServices.getAllCategories(req.query);

  return sendResponse(res, {
    statusCode: status.OK,
    message: "Categories retrieved successfully",
    data: result.categories,
    meta:result.pagination
    
  });
});

// 🔍 GET SINGLE CATEGORY
const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryServices.getSingleCategory(id);

  return sendResponse(res, {
    statusCode: status.OK,
    message: "Category retrieved successfully",
    data: result
  });
});

// ✏️ UPDATE CATEGORY
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryServices.updateCategory(id, req.body);

  return sendResponse(res, {
    statusCode: status.OK,
    message: "Category updated successfully",
    data: result
  });
});

// 🗑️ DELETE CATEGORY
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryServices.deleteCategory(id);

  return sendResponse(res, {
    statusCode: status.OK,
    message: "Category deleted successfully",
    data: result
  });
});

// // 📊 GET CATEGORIES BY TYPE
// const getCategoriesByType = catchAsync(async (req: Request, res: Response) => {
//   const { type } = req.params;
//   const result = await categoryServices.getCategoriesByType(type);

//   return sendResponse(res, {
//     statusCode: status.OK,
//     message: "Categories by type retrieved successfully",
//     data: result
//   });
// });

export const categoryController = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};