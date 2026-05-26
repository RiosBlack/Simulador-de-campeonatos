import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import prisma from "@/_lib/prisma";
import { getAppBaseUrl } from "@/_lib/app-url";
import type { CredentialTokenPurpose } from "@/generated/prisma/client";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_EMAIL_DOMAIN = "pending.copa-resenha.local";

export function pendingUserEmail(userId: string): string {
  return `${userId}@${PENDING_EMAIL_DOMAIN}`;
}

export function isPendingEmail(email: string): boolean {
  return email.endsWith(`@${PENDING_EMAIL_DOMAIN}`);
}

function hashToken(plainToken: string): string {
  return createHash("sha256").update(plainToken).digest("hex");
}

function generatePlainToken(): string {
  return randomBytes(32).toString("base64url");
}

export function buildSetupUrl(plainToken: string): string {
  return `${getAppBaseUrl()}/cadastro/${plainToken}`;
}

export type TokenValidationResult =
  | { status: "valid"; userId: string; userName: string; purpose: CredentialTokenPurpose }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "used" };

async function revokeActiveTokens(userId: string) {
  await prisma.userCredentialToken.deleteMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

export async function createCredentialToken(
  userId: string,
  purpose: CredentialTokenPurpose,
): Promise<{ plainToken: string; setupUrl: string }> {
  await revokeActiveTokens(userId);

  const plainToken = generatePlainToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.userCredentialToken.create({
    data: {
      tokenHash: hashToken(plainToken),
      userId,
      purpose,
      expiresAt,
    },
  });

  return { plainToken, setupUrl: buildSetupUrl(plainToken) };
}

export async function validateToken(
  plainToken: string,
): Promise<TokenValidationResult> {
  const record = await prisma.userCredentialToken.findUnique({
    where: { tokenHash: hashToken(plainToken) },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!record) {
    return { status: "invalid" };
  }

  if (record.usedAt) {
    return { status: "used" };
  }

  if (record.expiresAt < new Date()) {
    return { status: "expired" };
  }

  return {
    status: "valid",
    userId: record.userId,
    userName: record.user.name,
    purpose: record.purpose,
  };
}

export async function completeCredentialSetup(
  plainToken: string,
  input: { email: string; password: string },
): Promise<{ userId: string; email: string }> {
  const validation = await validateToken(plainToken);
  if (validation.status !== "valid") {
    const messages: Record<Exclude<TokenValidationResult["status"], "valid">, string> =
      {
        invalid: "Link inválido.",
        expired: "Este link expirou. Peça um novo link ao administrador.",
        used: "Este link já foi utilizado. Peça um novo link ao administrador.",
      };
    throw new Error(messages[validation.status]);
  }

  const emailTaken = await prisma.user.findFirst({
    where: {
      email: input.email,
      id: { not: validation.userId },
    },
  });

  if (emailTaken) {
    throw new Error("Este e-mail já está em uso.");
  }

  const hashed = await hashPassword(input.password);
  const tokenHash = hashToken(plainToken);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const tokenRecord = await tx.userCredentialToken.findUnique({
      where: { tokenHash },
    });

    if (
      !tokenRecord ||
      tokenRecord.usedAt ||
      tokenRecord.expiresAt < now ||
      tokenRecord.userId !== validation.userId
    ) {
      throw new Error("Link inválido ou expirado.");
    }

    await tx.user.update({
      where: { id: validation.userId },
      data: {
        email: input.email,
        emailVerified: true,
        credentialSetupComplete: true,
      },
    });

    const credentialAccount = await tx.account.findFirst({
      where: {
        userId: validation.userId,
        providerId: "credential",
      },
    });

    if (credentialAccount) {
      await tx.account.update({
        where: { id: credentialAccount.id },
        data: { password: hashed },
      });
    } else {
      await tx.account.create({
        data: {
          id: crypto.randomUUID(),
          accountId: validation.userId,
          providerId: "credential",
          userId: validation.userId,
          password: hashed,
        },
      });
    }

    await tx.userCredentialToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: now },
    });

    await tx.userCredentialToken.deleteMany({
      where: {
        userId: validation.userId,
        usedAt: null,
        id: { not: tokenRecord.id },
      },
    });
  });

  return { userId: validation.userId, email: input.email };
}

export async function createPendingUser(input: {
  name: string;
  role: "ADMIN" | "MEMBER";
}): Promise<{ userId: string; setupUrl: string }> {
  const userId = crypto.randomUUID();
  const email = pendingUserEmail(userId);

  await prisma.user.create({
    data: {
      id: userId,
      name: input.name,
      email,
      role: input.role,
      credentialSetupComplete: false,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: "credential",
        },
      },
    },
  });

  const { setupUrl } = await createCredentialToken(userId, "INITIAL_SETUP");
  return { userId, setupUrl };
}
