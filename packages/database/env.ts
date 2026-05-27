import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters")
    .default("super-secret-jwt-key-change-in-production"),
  NODE_ENV: z.enum(["development", "prod"]).default("development"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) {
    throw new Error(`Invalid environment variables:\n${safeParseResult.error.message}`);
  }

  const data = safeParseResult.data;

  // Warn in production if using the default JWT_SECRET
  if (data.NODE_ENV === "prod" && data.JWT_SECRET === "super-secret-jwt-key-change-in-production") {
    throw new Error("SECURITY ERROR: JWT_SECRET must be changed in production!");
  }

  return data;
}

export const env = createEnv(process.env);
