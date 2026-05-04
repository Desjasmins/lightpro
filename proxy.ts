import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (Next internals)
  // - _vercel (Vercel internals)
  // - files in the root with an extension (favicon, robots, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
