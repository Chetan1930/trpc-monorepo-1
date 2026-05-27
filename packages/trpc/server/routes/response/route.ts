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
      const ipAddress = (ctx as any).ip || "unknown";
      const userAgent = (ctx as any).headers?.["user-agent"] || "unknown";
      return responseService.submitResponse(input.formId, {
        formData: input.formData,
        respondentEmail: input.respondentEmail,
        respondentName: input.respondentName,
        ipAddress,
        userAgent,
        timeToComplete: input.timeToComplete,
      });
    }),

  // Protected: List responses for a form
  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/responses/{formId}", tags: TAGS } })
    .input(
      z.object({
        formId: z.string().uuid(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }),
    )
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return responseService.getResponses(input.formId, ctx.userId, input.limit, input.offset);
    }),

  // Protected: Get response count
  count: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return responseService.getResponseCount(input.formId, ctx.userId);
    }),

  // Protected: Get analytics
  analytics: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.any())
    .query(async ({ ctx, input }) => {
      return responseService.getAnalytics(input.formId, ctx.userId);
    }),

  // Protected: Delete a response
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.any())
    .mutation(async ({ ctx, input }) => {
      return responseService.deleteResponse(input.id, ctx.userId);
    }),

  // Protected: Export responses as CSV
  exportCSV: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.string())
    .query(async ({ ctx, input }) => {
      return responseService.exportResponsesCSV(input.formId, ctx.userId);
    }),
});
