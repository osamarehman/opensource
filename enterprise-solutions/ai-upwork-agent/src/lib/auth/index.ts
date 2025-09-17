import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@clerk/nextjs/server";

export interface AuthenticatedUser {
  id: string;
  clerkUserId: string;
  tenantId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  tenant: {
    id: string;
    name: string;
    clerkOrgId: string;
  };
}

/**
 * Get the current authenticated user with tenant information
 * Throws error if not authenticated or no organization selected
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  if (!orgId) {
    throw new Error("No organization selected");
  }

  // Get user from database with tenant information
  const dbUser = await db
    .select({
      id: users.id,
      clerkUserId: users.clerkUserId,
      tenantId: users.tenantId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      tenant: {
        id: tenants.id,
        name: tenants.name,
        clerkOrgId: tenants.clerkOrgId,
      },
    })
    .from(users)
    .innerJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  if (!dbUser.length) {
    throw new Error("User not found in database");
  }

  return dbUser[0];
}

/**
 * Get the tenant ID from headers (set by middleware)
 */
export async function getTenantIdFromHeaders(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get("x-tenant-id");
}

/**
 * Get the current tenant context
 */
export async function getTenantContext(): Promise<{ tenantId: string; orgId: string }> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("No organization selected");
  }

  return {
    tenantId: orgId, // Using Clerk orgId as tenantId
    orgId,
  };
}

/**
 * Ensure user exists in database, create if not
 */
export async function ensureUserInDatabase(clerkUser: User, orgId: string): Promise<void> {
  if (!clerkUser.id || !clerkUser.primaryEmailAddress?.emailAddress) {
    throw new Error("Invalid user data");
  }

  // Check if tenant exists, create if not
  let tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkOrgId, orgId))
    .limit(1);

  if (!tenant.length) {
    // Create tenant
    await db.insert(tenants).values({
      name: "Organization", // We'll update this when we have proper org data
      clerkOrgId: orgId,
      settings: {},
    });

    tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkOrgId, orgId))
      .limit(1);
  }

  // Check if user exists in database
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUser.id))
    .limit(1);

  if (!existingUser.length) {
    // Create user
    await db.insert(users).values({
      clerkUserId: clerkUser.id,
      tenantId: tenant[0].id,
      email: clerkUser.primaryEmailAddress.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      role: "member", // Default role, can be updated later
      settings: {},
    });
  }
}

/**
 * Check if user has required role for action
 */
export function hasRole(
  userRole: "owner" | "admin" | "member" | "viewer",
  requiredRole: "owner" | "admin" | "member" | "viewer"
): boolean {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Require specific role, throw error if not authorized
 */
export async function requireRole(requiredRole: "owner" | "admin" | "member" | "viewer"): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!hasRole(user.role, requiredRole)) {
    throw new Error(`Insufficient permissions. Required: ${requiredRole}, Current: ${user.role}`);
  }

  return user;
}