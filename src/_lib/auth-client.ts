"use client";

import { createAuthClient } from "better-auth/react";
import { getAppBaseUrl } from "@/_lib/app-url";

/** Cliente criado sob demanda para usar a origem real do browser (evita localhost vs 127.0.0.1). */
export function getAuthClient() {
  return createAuthClient({
    baseURL: getAppBaseUrl(),
  });
}
