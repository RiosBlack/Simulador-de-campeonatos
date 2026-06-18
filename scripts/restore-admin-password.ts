import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`${name} não definida no .env`);
    process.exit(1);
  }
  return value;
}

const email = process.env.ADMIN_EMAIL ?? "admin@copa.local";
const password = requireEnv("ADMIN_PASSWORD", process.env.ADMIN_PASSWORD);
const databaseUrl = requireEnv("DATABASE_URL", process.env.DATABASE_URL);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (!user) {
    console.error(`Usuário não encontrado: ${email}`);
    console.error("Execute pnpm db:seed para criar o admin.");
    process.exit(1);
  }

  const hashed = await hashPassword(password);
  const credential = user.accounts.find((a) => a.providerId === "credential");

  if (credential) {
    await prisma.account.update({
      where: { id: credential.id },
      data: { password: hashed },
    });
  } else {
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashed,
      },
    });
  }

  console.log(`Senha restaurada para ${email} (valor de ADMIN_PASSWORD no .env).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
