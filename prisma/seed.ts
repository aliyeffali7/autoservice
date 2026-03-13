import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

import path from "path";
const dbPath = path.resolve(__dirname, "../dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({ where: { phone: "+994501234567" } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const owner = await prisma.user.create({
      data: {
        name: "Admin",
        surname: "Sahibkar",
        phone: "+994501234567",
        password: hashedPassword,
        role: "OWNER",
      },
    });
    console.log("Sahibkar hesabı yaradıldı:", owner.phone);
  } else {
    console.log("Sahibkar hesabı artıq mövcuddur:", existing.phone);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
