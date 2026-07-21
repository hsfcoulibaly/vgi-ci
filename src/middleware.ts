export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!login|api/auth|api/seed|_next/static|_next/image|favicon.ico|logo-vgi.png).*)",
  ],
};
