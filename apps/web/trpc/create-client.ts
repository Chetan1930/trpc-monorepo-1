import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";
import { getStoredToken } from "~/lib/api";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const baseUrl = env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const trpcUrl = `${baseUrl}/trpc`;

  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  return c({
    url: trpcUrl,
    headers() {
      const token = getStoredToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
};
