import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext, Context } from "./context";
import { authService } from "./services";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({});

export const router = tRPCContext.router;

const isAuthed = tRPCContext.middleware(async ({ ctx, next }) => {
  const token = ctx.bearerToken;
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  try {
    const { userId } = authService.verifyToken(token);
    return next({
      ctx: {
        ...ctx,
        userId,
      },
    });
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
  }
});

export const publicProcedure = tRPCContext.procedure;
export const protectedProcedure = tRPCContext.procedure.use(isAuthed);
