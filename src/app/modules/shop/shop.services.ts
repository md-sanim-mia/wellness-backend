import { shopStatus, StoreStatus } from "@prisma/client";
import prisma from "../../utils/prisma";

// 🆕 CREATE STORE WITH MULTIPLE CATEGORIES
const createStore = async (userId: string, payload: any) => {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error("User not found!");
    }

    // Required field validation
    if (!payload.name || payload.name.trim() === "") {
      throw new Error("Store name is required!");
    }
    if (!payload.categoryIds || !Array.isArray(payload.categoryIds) || payload.categoryIds.length === 0) {
      throw new Error("At least one category is required!");
    }

    // Phone number validation
    if (payload.phone) {
      const phoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
      if (!phoneRegex.test(payload.phone)) {
        throw new Error("Invalid Bangladeshi phone number!");
      }
    }

    // Email validation
    if (payload.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payload.email)) {
        throw new Error("Invalid email format!");
      }
    }

    // Duplicate store check for same user
    const existingStore = await prisma.store.findFirst({
      where: { userId },
    });
    if (existingStore) {
      throw new Error("User already has a store!");
    }

    // Verify all categories exist
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: payload.categoryIds
        }
      }
    });

    if (categories.length !== payload.categoryIds.length) {
      throw new Error("One or more categories not found!");
    }

    // Create new store with multiple categories using StoreCategory
    const store = await prisma.store.create({
      data: {
        userId,
        name: payload.name.trim(),
        location: payload.location || "",
        tags: payload.tags || [],
        description: payload.description || "",
        logo: payload.logo || "",
        banner: payload.banner || "",
        phone: payload.phone || "",
        email: payload.email || "",
        facebookUrl: payload.facebookUrl || "",
        instagramUrl: payload.instagramUrl || "",
        youtubeUrl: payload.youtubeUrl || "",
       shopStatus: shopStatus.PENDING,
        status: payload.status,
        // Connect multiple categories through StoreCategory join table
        storeCategories: {
          create: payload.categoryIds.map((categoryId: string) => ({
            categoryId: categoryId
          }))
        }
      },
      include: {
        storeCategories: {
          include: {
            category: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    return store;
};

// 📋 GET ALL STORES
const getAllStores = async (filters: {
  page?: number;
  limit?: number;
  shopStatus?: shopStatus;
  status?: StoreStatus;
  categoryId?: string;
  search?: string;
} = {}) => {
  const {
    page = 1,
    limit = 10,
    shopStatus,
    status,
    categoryId,
    search
  } = filters;

  const skip = (page - 1) * limit;

  // Build where condition
  const where: any = {};
  
  if (shopStatus) where.shopStatus = shopStatus;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Filter by category if provided
  if (categoryId) {
    where.storeCategories = {
      some: {
        categoryId: categoryId
      }
    };
  }

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: limit,
      include: {
        storeCategories: {
          include: {
            category: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            products: true,
            services: true,
            specialists: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.store.count({ where })
  ]);

  return {
    stores,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// 🔍 GET SINGLE STORE
const getSingleStore = async (storeId: string) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      storeCategories: {
        include: {
          category: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      },
      products: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      },
      services: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      },
      specialists: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          products: true,
          services: true,
          specialists: true,
          consultations: true,
        }
      }
    }
  });

  if (!store) {
    throw new Error("Store not found!");
  }

  return store;
};

// ✅ APPROVE STORE
const approveStore = async (storeId: string) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId }
  });

  if (!store) {
    throw new Error("Store not found!");
  }

  const updatedStore = await prisma.store.update({
    where: { id: storeId },
    data: { 
      shopStatus: shopStatus.APPROVED
    },
    include: {
      storeCategories: {
        include: {
          category: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    }
  });

  return updatedStore;
};

// ❌ REJECT STORE
const rejectStore = async (storeId: string) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId }
  });

  if (!store) {
    throw new Error("Store not found!");
  }

  const updatedStore = await prisma.store.update({
    where: { id: storeId },
    data: { 
      shopStatus: shopStatus.REJECTED,
      status: StoreStatus.OFFLINE
    },
    include: {
      storeCategories: {
        include: {
          category: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    }
  });

  return updatedStore;
};

// 🏪 GET MY STORE
const getMyStore = async (userId: string) => {
  const store = await prisma.store.findFirst({
    where: { userId },
    include: {
      storeCategories: {
        include: {
          category: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      },
      products: {
        orderBy: { createdAt: 'desc' }
      },
      services: {
        orderBy: { createdAt: 'desc' }
      },
      specialists: {
        orderBy: { createdAt: 'desc' }
      },
      coupons: {
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          products: true,
          services: true,
          specialists: true,
          consultations: true,
          coupons: true,
        }
      }
    }
  });

  if (!store) {
    throw new Error("No store found for this user!");
  }

  return store;
};

// 🟢 SET STORE ONLINE
const setStoreOnline = async (storeId: string, userId: string) => {
  const store = await prisma.store.findFirst({
    where: { 
      id: storeId,
      userId
    }
  });

  if (!store) {
    throw new Error("Store not found or you don't have permission!");
  }

  if (store.shopStatus !== shopStatus.APPROVED) {
    throw new Error("Only approved stores can be set online!");
  }

  const updatedStore = await prisma.store.update({
    where: { id: storeId },
    data: { 
      status: StoreStatus.ONLINE
    },
    include: {
      storeCategories: {
        include: {
          category: true
        }
      }
    }
  });

  return updatedStore;
};

// 🔴 SET STORE OFFLINE
const setStoreOffline = async (storeId: string, userId: string) => {
  const store = await prisma.store.findFirst({
    where: { 
      id: storeId,
      userId
    }
  });

  if (!store) {
    throw new Error("Store not found or you don't have permission!");
  }

  const updatedStore = await prisma.store.update({
    where: { id: storeId },
    data: { 
      status: StoreStatus.OFFLINE
    },
    include: {
      storeCategories: {
        include: {
          category: true
        }
      }
    }
  });

  return updatedStore;
};

// ✏️ UPDATE STORE CATEGORIES
const updateStoreCategories = async (storeId: string, categoryIds: string[]) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId }
  });

  if (!store) {
    throw new Error("Store not found!");
  }

  // Verify all categories exist
  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: categoryIds
      }
    }
  });

  if (categories.length !== categoryIds.length) {
    throw new Error("One or more categories not found!");
  }

  // Update categories using StoreCategory join table
  const updatedStore = await prisma.store.update({
    where: { id: storeId },
    data: {
      storeCategories: {
        deleteMany: {}, // Remove all existing categories
        create: categoryIds.map((categoryId: string) => ({
          categoryId: categoryId
        }))
      }
    },
    include: {
      storeCategories: {
        include: {
          category: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    }
  });

  return updatedStore;
};

// 📊 GET STORES BY CATEGORY
const getStoresByCategory = async (categoryId: string, filters: {
  page?: number;
  limit?: number;
} = {}) => {
  const {
    page = 1,
    limit = 10,
  } = filters;

  const skip = (page - 1) * limit;

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where: {
        storeCategories: {
          some: {
            categoryId: categoryId
          }
        },
        shopStatus: shopStatus.APPROVED // Only show approved stores
      },
      skip,
      take: limit,
      include: {
        storeCategories: {
          include: {
            category: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            products: true,
            services: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.store.count({
      where: {
        storeCategories: {
          some: {
            categoryId: categoryId
          }
        },
        shopStatus: shopStatus.APPROVED
      }
    })
  ]);

  return {
    stores,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const storeServices = {
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