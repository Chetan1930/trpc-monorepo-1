import { inferAsyncReturnType } from "@trpc/server";

export async function createContext({ req }: { req: { headers: Record<string, string | string[] | undefined> } }) {
  const getBearerToken = () => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (!header) return null;
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) return null;
    return token;
  };

  return {
    bearerToken: getBearerToken(),
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
