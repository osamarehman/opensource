import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected and public routes
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/jobs(.*)",
  "/proposals(.*)",
  "/clients(.*)",
  "/analytics(.*)",
  "/settings(.*)",
  "/api/jobs(.*)",
  "/api/proposals(.*)",
  "/api/clients(.*)",
  "/api/analytics(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/organization-selection(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, orgId } = await auth();
  const url = req.nextUrl.clone();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    // Ensure user is authenticated
    if (!userId) {
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }

    // For organization-required routes, ensure user has an organization
    if (!orgId && req.nextUrl.pathname.startsWith("/jobs")) {
      // Redirect to organization selection if no org is selected
      url.pathname = "/organization-selection";
      return NextResponse.redirect(url);
    }

    // Set tenant context in headers for database queries
    const response = NextResponse.next();
    if (orgId) {
      response.headers.set("x-tenant-id", orgId);
    }
    return response;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};