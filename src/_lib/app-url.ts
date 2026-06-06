/** Base URL da app no browser (mesma origem) ou no servidor (env). */
export function getAppBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3005"
  );
}

export const trustedAppOrigins = [
  "http://localhost:3005",
  "http://127.0.0.1:3005",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
].filter((value): value is string => Boolean(value));
