import { UserRole } from '@prisma/client'
import express from 'express'

import { categoryController } from './Category.contller'
import auth from '../../middlewares/auth'

const route=express.Router()

route.post('/create-one',auth(UserRole.ADMIN,UserRole.SUPER_ADMIN),categoryController.createCategory)

// 📋 GET ALL CATEGORIES - Public
route.get('/', auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.SUPER_ADMIN,UserRole.SELLER,UserRole.SPECIALIST), categoryController.getAllCategories)

// 🔍 GET SINGLE CATEGORY - Public
route.get('/:id', auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.SUPER_ADMIN,UserRole.SELLER,UserRole.SPECIALIST), categoryController.getSingleCategory)

// ✏️ UPDATE CATEGORY - ADMIN, SUPER_ADMIN
route.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  categoryController.updateCategory
)

// 🗑️ DELETE CATEGORY - ADMIN, SUPER_ADMIN
route.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  categoryController.deleteCategory
)

export const categoryRouter=route