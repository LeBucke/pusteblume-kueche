import { NextResponse, type NextRequest } from "next/server";
import { copyCookies, updateSession } from "@/lib/supabase/proxy";

/** Routen, die ohne Anmeldung erreichbar sind. Alles andere verlangt eine Sitzung. */
const PUBLIC_PATHS = ["/login", "/auth/callback"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { response, signedIn } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!signedIn && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return copyCookies(response(), NextResponse.redirect(url));
  }

  if (signedIn && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return copyCookies(response(), NextResponse.redirect(url));
  }

  return response();
}

export const config = {
  // Alles außer statischen Dateien und Bildern.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|svg|gif|webp|ico|webmanifest)$).*)"],
};
