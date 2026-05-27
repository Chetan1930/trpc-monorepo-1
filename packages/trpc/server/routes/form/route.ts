import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { formService, themeService } from "../../services";

const TAGS = ["Forms"];

export const formRouter = router({
  // Protected: Create a new form
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/forms", tags: TAGS } })
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        visibility: z.enum(["public", "unlisted"]).optional(),
        themeId: z.string().uuid().optional(),
      }),
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.createForm(ctx.userId, input);
    }),

  // Protected: Get all forms for current user
  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/forms", tags: TAGS } })
    .input(z.void())
    .output(z.any())
    .query(async ({ ctx }) => {
      return formService.getFormsByUser(ctx.userId);
    }),

  // Protected: Get a single form
  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/forms/{id}", tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      const form = await formService.getFormById(input.id);
      if (form.creatorId !== ctx.userId) throw new Error("Unauthorized");
      return form;
    }),

  // Protected: Update form
  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/forms/{id}", tags: TAGS } })
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        visibility: z.enum(["public", "unlisted"]).optional(),
        themeId: z.string().uuid().nullable().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        expiryDate: z.string().nullable().optional(),
        responseLimit: z.string().nullable().optional(),
      }),
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return formService.updateForm(id, ctx.userId, data);
    }),

  // Protected: Delete form
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/forms/{id}", tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.deleteForm(input.id, ctx.userId);
    }),

  // Protected: Publish form
  publish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.publishForm(input.id, ctx.userId);
    }),

  // Protected: Unpublish form
  unpublish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.unpublishForm(input.id, ctx.userId);
    }),

  // Protected: Clone form
  clone: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.cloneForm(input.id, ctx.userId);
    }),

  // Public: Get form by slug (for filling)
  getBySlug: publicProcedure
    .meta({ openapi: { method: "GET", path: "/forms/public/{slug}", tags: TAGS } })
    .input(z.object({ slug: z.string() }))
    .output(z.any())
    .query(async ({ input }) => {
      const form = await formService.getFormBySlug(input.slug);
      if (!form) throw new Error("Form not found");
      if (form.status !== "published") throw new Error("Form is not available");
      const fields = await formService.getFields(form.id);
      const theme = form.themeId ? await themeService.getThemeById(form.themeId) : null;
      return { ...form, fields, theme };
    }),

  // Public: Get public forms for explore page
  explore: publicProcedure
    .meta({ openapi: { method: "GET", path: "/forms/explore", tags: TAGS } })
    .input(
      z.object({
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      }),
    )
    .output(z.any())
    .query(async ({ input }) => {
      return formService.getPublicForms(input.limit, input.offset);
    }),
});
