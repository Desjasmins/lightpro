import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  COOKIE_NAME,
  COOKIE_OPTIONS,
  issueGateCookie,
  verifyGateCookie,
} from "./lib/gate/cookie";

const intlMiddleware = createMiddleware(routing);

/**
 * Next.js 16 root middleware.
 *
 * 1. Delegates locale routing to next-intl (the only behavior the project
 *    needed previously).
 * 2. Refreshes the gate access cookie on visits to /[locale]/estimation/tool
 *    so the 30-day sliding TTL works. Server Components in Next.js 16 cannot
 *    mutate cookies, so this must happen here.
 */
export default function proxy(request: NextRequest): NextResponse {
  const response = intlMiddleware(request);

  const path = request.nextUrl.pathname;
  if (isToolPath(path)) {
    const existing = request.cookies.get(COOKIE_NAME)?.value;
    const payload = verifyGateCookie(existing);
    if (payload) {
      const refreshed = issueGateCookie(payload.e, {
        name: payload.n,
        organization: payload.o,
      });
      response.cookies.set({
        name: COOKIE_NAME,
        value: refreshed.value,
        maxAge: refreshed.maxAge,
        ...COOKIE_OPTIONS,
      });
    }
  }

  return response;
}

function isToolPath(path: string): boolean {
  return /^\/(fr|en)\/estimation\/tool(\/|$)/.test(path);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
