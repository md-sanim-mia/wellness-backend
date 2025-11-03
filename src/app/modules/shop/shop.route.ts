// store.routes.ts
import { UserRole } from '@prisma/client'
import express from 'express'
import auth from '../../middlewares/auth'
import { storeController } from './shop.contllers'

const router = express.Router()

// 🆕 CREATE STORE - Authenticated users (USER, ADMIN, SUPER_ADMIN)
router.post(
  '/create-store',
  auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  storeController.createStore
)

// 📋 GET ALL STORES - Public (no auth required)
router.get('/', storeController.getAllStores)

// 🔍 GET SINGLE STORE - Public (no auth required)
router.get('/:id', storeController.getSingleStore)

// ✅ APPROVE STORE - Admin only (ADMIN, SUPER_ADMIN)
router.patch(
  '/:id/approve',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  storeController.approveStore
)

// ❌ REJECT STORE - Admin only (ADMIN, SUPER_ADMIN)
router.patch(
  '/:id/reject',
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  storeController.rejectStore
)

// 🏪 GET MY STORE - Authenticated users (USER, ADMIN, SUPER_ADMIN)
router.get(
  '/my/store',
  auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  storeController.getMyStore
)


// 🟢 SET STORE ONLINE - Store owner
router.patch(
  '/:id/online',
  auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  storeController.setStoreOnline
)

// 🔴 SET STORE OFFLINE - Store owner
router.patch(
  '/:id/offline',
  auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  storeController.setStoreOffline
)

// ✏️ UPDATE STORE CATEGORIES - Store owner
router.patch(
  '/:id/categories',
  auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  storeController.updateStoreCategories
)

// 📊 GET STORES BY CATEGORY - Public (no auth required)
router.get('/category/:categoryId', storeController.getStoresByCategory)

export default router