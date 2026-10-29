import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Guard ligero para dashboard y admin.
 *
 * El JWT vive en localStorage, así que el middleware no puede leerlo todavía.
 * Por eso no redirigimos: solo marcamos la petición y comprobamos si existe la
 * cookie `access_token` (preparada para la sesión HttpOnly). Cuando el login
 * escriba esa cookie, aquí se podrá validar y redirigir a /login sin romper SSR.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-guard", "token-required");

  const cookieToken = req.cookies.get("access_token")?.value?.trim();

  if (!cookieToken) {
    res.headers.set("x-auth-cookie", "absent");
  } else if (cookieToken.length < 20) {
    res.headers.set("x-auth-cookie", "invalid");
  } else {
    res.headers.set("x-auth-cookie", "present");
  }

  return res;
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
