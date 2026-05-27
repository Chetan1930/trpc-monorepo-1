import { inferAsyncReturnType } from "@trpc/server";

/** Minimal shape of an Express-compatible request used by this context */
interface IncomingRequest {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

export async function createContext({ req }: { req: IncomingRequest }) {
  const getBearerToken = () => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!header) return null;
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) return null;
    return token;
  };

  // Extract client IP — respects X-Forwarded-For set by reverse proxies
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const ip = forwarded?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? "unknown";

  const userAgentHeader = req.headers["user-agent"];
  const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader ?? "unknown";

  return {
    bearerToken: getBearerToken(),
    ip,
    userAgent,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
