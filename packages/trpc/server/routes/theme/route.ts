import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { themeService } from "../../services";

const TAGS = ["Themes"];

export const themeRouter = router({
  // Public: Get all available themes
  list: publicProcedure
    .meta({ openapi: { method: "GET", path: "/themes", tags: TAGS } })
    .input(z.void())
    .output(z.any())
    .query(async () => {
      return themeService.getPublicThemes();
    }),

  // Public: Get theme by ID
  getById: publicProcedure
    .meta({ openapi: { method: "GET", path: "/themes/{id}", tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .query(async ({ input }) => {
      return themeService.getThemeById(input.id);
    }),
});
