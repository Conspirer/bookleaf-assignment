import { NextResponse } from "next/server";

import type { AuthUser } from "@/lib/portal";

export const SESSION_COOKIE = "bookleaf_session";

export function getSessionValueFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));

  if (!sessionCookie) {
    return null;
  }

  const encoded = decodeURIComponent(sessionCookie.slice(SESSION_COOKIE.length + 1));
  try {
    return JSON.parse(encoded) as AuthUser;
  } catch {
    return null;
  }
}

export function getSessionCookieHeader(user: AuthUser) {
  const encoded = encodeURIComponent(JSON.stringify(user));
  return `${SESSION_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

export function withSessionCookie(response: NextResponse, user: AuthUser) {
  response.headers.set("Set-Cookie", getSessionCookieHeader(user));
  return response;
}
