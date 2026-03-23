import { PrismaClient } from "@prisma/client";

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

const shouldInitPrisma = Boolean(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  (shouldInitPrisma
    ? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      })
    : null);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const prismaWithTimeout = async <T,>(
  operation: Promise<T>,
  timeoutMs = 1500,
  label = "Prisma operation"
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isPrismaConnectivityError = (error: unknown) => {
  const message = String((error as any)?.message || "").toLowerCase();
  const code = String((error as any)?.code || "").toUpperCase();

  return (
    code === "P1001" ||
    code === "P1002" ||
    code === "P2024" ||
    message.includes("timed out") ||
    message.includes("connection") ||
    message.includes("connect") ||
    message.includes("pool")
  );
};

export const prismaReadWithRetry = async <T,>(
  operationFactory: () => Promise<T>,
  options?: {
    timeoutMs?: number;
    retries?: number;
    backoffMs?: number;
    label?: string;
  }
): Promise<T> => {
  const timeoutMs = options?.timeoutMs ?? 1500;
  const retries = options?.retries ?? 1;
  const backoffMs = options?.backoffMs ?? 150;
  const label = options?.label ?? "Prisma read";

  let attempt = 0;
  while (true) {
    try {
      return await prismaWithTimeout(operationFactory(), timeoutMs, `${label} (attempt ${attempt + 1})`);
    } catch (error) {
      const canRetry = attempt < retries && isPrismaConnectivityError(error);
      if (!canRetry) {
        throw error;
      }

      attempt += 1;
      await sleep(backoffMs * attempt);
    }
  }
};

export const getPrismaHealth = async () => {
  if (!prisma) {
    return {
      enabled: false,
      ok: false,
      mode: "fallback",
      message: "Prisma not configured",
    };
  }

  try {
    await prismaWithTimeout(prisma.$queryRaw`SELECT 1`, 1200, "Prisma health check");
    return {
      enabled: true,
      ok: true,
      mode: "prisma",
      message: "Database reachable",
    };
  } catch (error: any) {
    return {
      enabled: true,
      ok: false,
      mode: "prisma",
      message: error?.message || "Database unreachable",
    };
  }
};
