import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { responseService } from "../../services";

const TAGS = ["Responses"];

export const responseRouter = router({
  // Public: Submit a form response (no auth required)
  submit: publicProcedure
    .meta({ openapi: { method: "POST", path: "/responses", tags: TAGS } })
    .input(
      z.object({
        formId: z.string().uuid(),
        formData: z.record(z.string(), z.unknown()),
        respondentEmail: z.string().email().optional(),
        respondentName: z.string().optional(),
        timeToComplete: z.number().optional(),
      }),
    )
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      return responseService.submitResponse(input.formId, {
        formData: input.formData,
        respondentEmail: input.respondentEmail,
        respondentName: input.respondentName,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        timeToComplete: input.timeToComplete,
      });
    }),

  // Protected: List responses for a form
  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/responses/{formId}", tags: TAGS } })
    .input(
      z.object({
        formId: z.string().uuid(),
        limit: z.coerce.number().optional().default(50),
        offset: z.coerce.number().optional().default(0),
      }),
    )
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return responseService.getResponses(input.formId, ctx.userId, input.limit, input.offset);
    }),

  // Protected: Get response count
  count: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/responses/{formId}/count", tags: TAGS } })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return responseService.getResponseCount(input.formId, ctx.userId);
    }),

  // Protected: Get analytics
  analytics: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/responses/{formId}/analytics", tags: TAGS } })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return responseService.getAnalytics(input.formId, ctx.userId);
    }),

  // Protected: Delete a response
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/responses/{id}", tags: TAGS } })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return responseService.deleteResponse(input.id, ctx.userId);
    }),

  // Protected: Export responses as CSV
  exportCSV: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/responses/{formId}/export", tags: TAGS } })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.string())
    .query(async ({ ctx, input }) => {
      return responseService.exportResponsesCSV(input.formId, ctx.userId);
    }),
});
