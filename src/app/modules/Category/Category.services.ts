// category.services.ts
import { Category, CategoryType } from "@prisma/client";
import prisma from "../../utils/prisma";

// 🆕 CREATE CATEGORY
const createCategory = async (payload: {
  name: string;
  description?: string;
  type: CategoryType;
  comment?: string;
}) => {
  // 🧩 1. Required field validation
  if (!payload.name || payload.name.trim() === "") {
    throw new Error("Category name is required!");
  }

  if (!payload.type) {
    throw new Error("Category type is required!");
  }

  // 🧩 2. Check for duplicate category name
  const existingCategory = await prisma.category.findFirst({
    where: { 
      name: payload.name.trim(),
      type: payload.type
    },
  });

  if (existingCategory) {
    throw new Error("Category with this name and type already exists!");
  }

  // 🧩 3. Create new category
  const category = await prisma.category.create({
    data: {
      name: payload.name.trim(),
      description: payload.description || "",
      type: payload.type,
      comment: payload.comment || "",
    },
  });

  return category;
};

// 📋 GET ALL CATEGORIES
const getAllCategories = async (filters: {
  page?: number;
  limit?: number;
  type?: CategoryType;
  search?: string;
} = {}) => {
  const {
    page = 1,
    limit = 10,
    type,
    search
  } = filters;

  const skip = (page - 1) * limit;

  // Build where condition
  const where: any = {};
  
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            storeCategories: true,
            products: true,
            services: true,
            consultations: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.category.count({ where })
  ]);

  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit)
    }
  };
};

// 🔍 GET SINGLE CATEGORY
const getSingleCategory = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      storeCategories: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      products: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      services: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      consultations: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          storeCategories: true,
          products: true,
          services: true,
          consultations: true,
        }
      }
    }
  });

  if (!category) {
    throw new Error("Category not found!");
  }

  return category;
};

// ✏️ UPDATE CATEGORY
const updateCategory = async (categoryId: string, payload: {
  name?: string;
  description?: string;
  type?: CategoryType;
  comment?: string;
}) => {
  // 🧩 1. Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  if (!existingCategory) {
    throw new Error("Category not found!");
  }

  // 🧩 2. Check for duplicate category name if name is being updated
  if (payload.name && payload.name.trim() !== existingCategory.name) {
    const duplicateCategory = await prisma.category.findFirst({
      where: { 
        name: payload.name.trim(),
        type: payload.type || existingCategory.type
      },
    });

    if (duplicateCategory) {
      throw new Error("Category with this name and type already exists!");
    }
  }

  // 🧩 3. Update category
  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.description !== undefined && { description: payload.description }),
      ...(payload.type && { type: payload.type }),
      ...(payload.comment !== undefined && { comment: payload.comment }),
    },
  });

  return updatedCategory;
};

// 🗑️ DELETE CATEGORY
const deleteCategory = async (categoryId: string) => {
  // 🧩 1. Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: {
          storeCategories: true,
          products: true,
          services: true,
          consultations: true,
        }
      }
    }
  });

  if (!existingCategory) {
    throw new Error("Category not found!");
  }

  // 🧩 2. Check if category has associated data
  const hasAssociations = 
    existingCategory._count.storeCategories > 0 ||
    existingCategory._count.products > 0 ||
    existingCategory._count.services > 0 ||
    existingCategory._count.consultations > 0;

  if (hasAssociations) {
    throw new Error("Cannot delete category with associated stores, products, services, or consultations!");
  }

  // 🧩 3. Delete category
  const deletedCategory = await prisma.category.delete({
    where: { id: categoryId }
  });

  return deletedCategory;
};

// 📊 GET CATEGORIES BY TYPE
const getCategoriesByType = async (type: CategoryType) => {
  const categories = await prisma.category.findMany({
    where: { type },
    include: {
      _count: {
        select: {
          storeCategories: true,
          products: true,
          services: true,
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return categories;
};

export const categoryServices = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByType
};