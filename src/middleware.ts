import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(":");
      const expectedUser = process.env.AUTH_USER || "admin";
      const expectedPass = process.env.AUTH_PASSWORD;

      if (expectedPass && user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    }
  }

  // If no AUTH_PASSWORD is set, skip protection (dev convenience)
  if (!process.env.AUTH_PASSWORD) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Telvia CRM"',
    },
  });
}
