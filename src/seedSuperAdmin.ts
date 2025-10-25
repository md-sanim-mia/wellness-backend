import config from "./app/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./app/helpers/hashPassword";

const prisma = new PrismaClient();

export const seedSuperAdmin = async () => {
  const email = config.superAdmin.email!;
  const password = config.superAdmin.password!;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // console.log("⚠️  Super Admin already exists!");
    return;
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.create({
    data: {
      firstName: "Super",
      lastName:"Admin",
      age:"",
      hobbies:"",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isVerified: true,
    },
  });

  console.log("✅ Super Admin seeded successfully.");
};
