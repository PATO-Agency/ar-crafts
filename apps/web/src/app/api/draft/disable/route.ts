import { NextResponse } from "next/server";
import { privateHeaders } from "../../../../lib/preview-security";
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), {
    headers: privateHeaders,
  });
  const expired =
    "__prerender_bypass=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly";
  const production = process.env.NODE_ENV === "production";
  response.headers.append(
    "Set-Cookie",
    `${expired}; SameSite=${production ? "None" : "Lax"}${production ? "; Secure" : ""}`,
  );
  if (production)
    response.headers.append(
      "Set-Cookie",
      `${expired}; SameSite=None; Secure; Partitioned`,
    );
  // Partitioned and ordinary cookies have distinct storage keys. Avoid the Next
  // mutable cookie jar here: its name-keyed merge would collapse these expiries.
  return response;
}
