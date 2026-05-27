import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { formService } from "../../services";

const TAGS = ["Form Fields"];

export const fieldRouter = router({
  // Get fields for a form
  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/fields", tags: TAGS } })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      const form = await formService.getFormById(input.formId);
      if (form.creatorId !== ctx.userId) throw new Error("Unauthorized");
      return formService.getFields(input.formId);
    }),

  // Add a field
  add: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/fields", tags: TAGS } })
    .input(
      z.object({
        formId: z.string().uuid(),
        type: z.enum([
          "short_text",
          "long_text",
          "email",
          "number",
          "single_select",
          "multi_select",
          "checkbox",
          "dropdown",
          "rating",
          "date",
        ]),
        label: z.string().min(1).max(255),
        placeholder: z.string().optional(),
        helpText: z.string().optional(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
        validation: z.any().optional(),
        showIf: z.any().optional(),
      }),
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.addField(input.formId, ctx.userId, input);
    }),

  // Update a field
  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/fields/{id}", tags: TAGS } })
    .input(
      z.object({
        id: z.string().uuid(),
        label: z.string().min(1).max(255).optional(),
        placeholder: z.string().optional(),
        helpText: z.string().optional(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
        validation: z.any().optional(),
        showIf: z.any().optional(),
        order: z.number().optional(),
      }),
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.updateField(input.id, ctx.userId, input);
    }),

  // Delete a field
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/fields/{id}", tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.deleteField(input.id, ctx.userId);
    }),

  // Reorder fields
  reorder: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/fields/reorder", tags: TAGS } })
    .input(
      z.object({
        formId: z.string().uuid(),
        fieldIds: z.array(z.string().uuid()),
      }),
    )
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return formService.reorderFields(input.formId, ctx.userId, input.fieldIds);
    }),
});
