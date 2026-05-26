import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@copa.local";
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";

  const hashed = await hashPassword(password);

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN" },
    });
    const credential = existing.accounts.find(
      (a) => a.providerId === "credential",
    );
    if (credential) {
      await prisma.account.update({
        where: { id: credential.id },
        data: { password: hashed },
      });
    } else {
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          accountId: existing.id,
          providerId: "credential",
          userId: existing.id,
          password: hashed,
        },
      });
    }
    console.log(`Admin atualizado (senha resetada): ${email}`);
    return;
  }

  const userId = crypto.randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      name: "Administrador",
      email,
      emailVerified: true,
      role: "ADMIN",
    },
  });

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashed,
    },
  });

  console.log(`Admin criado: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
