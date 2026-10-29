import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEMO_COOKIE, verifyDemo } from "@/lib/demoSession";

/**
 * Guards /admin/* (except the login page) and /api/admin/*.
 * Supabase mode: refreshes the session cookie and requires a signed-in user (the allow-list check runs in
 * the admin layout and API routes). Demo mode: requires a valid signed demo cookie.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";
  const isApi = pathname.startsWith("/api/admin");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabase = !!(url && anon && process.env.SUPABASE_SERVICE_ROLE_KEY);

  let res = NextResponse.next({ request: req });
  let signedIn = false;

  if (hasSupabase) {
    const sb = createServerClient(url!, anon!, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await sb.auth.getUser();
    signedIn = !!data.user;
  } else {
    signedIn = !!(await verifyDemo(req.cookies.get(DEMO_COOKIE)?.value));
  }

  if (!signedIn && !isLogin) {
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const to = req.nextUrl.clone();
    to.pathname = "/admin/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
