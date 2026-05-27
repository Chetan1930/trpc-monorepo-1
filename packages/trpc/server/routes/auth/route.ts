import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { authService } from "../../services";

const TAGS = ["Authentication"];

export const authRouter = router({
  register: publicProcedure
    .meta({ openapi: { method: "POST", path: "/auth/register", tags: TAGS } })
    .input(
      z.object({
        fullName: z.string().min(1).max(80),
        email: z.string().email(),
        password: z.string().min(6).max(100),
      }),
    )
    .output(z.any())
    .mutation(async ({ input }) => {
      return authService.register(input.fullName, input.email, input.password);
    }),

  login: publicProcedure
    .meta({ openapi: { method: "POST", path: "/auth/login", tags: TAGS } })
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .output(z.any())
    .mutation(async ({ input }) => {
      return authService.login(input.email, input.password);
    }),

  me: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/auth/me", tags: TAGS } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
      return authService.getMe(ctx.userId);
    }),
});
