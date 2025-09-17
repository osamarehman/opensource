import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TenantError } from "@/types";

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  organizationId: string;
}

/**
 * Get tenant context from Clerk authentication
 * This should be called in API routes and Server Actions
 */
export async function getTenantContext(): Promise<TenantContext> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new TenantError("User not authenticated");
  }

  if (!orgId) {
    throw new TenantError("No organization selected");
  }

  // Find tenant by Clerk organization ID
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkOrgId, orgId))
    .limit(1);

  if (tenant.length === 0) {
    throw new TenantError("Tenant not found");
  }

  // Find user in tenant
  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .where(eq(users.tenantId, tenant[0].id))
    .limit(1);

  if (user.length === 0) {
    throw new TenantError("User not found in tenant");
  }

  return {
    tenantId: tenant[0].id,
    userId: user[0].id,
    role: user[0].role,
    organizationId: orgId,
  };
}

/**
 * Set tenant context for database queries
 * This enables Row-Level Security policies
 */
export async function setTenantContext(
  tenantId: string,
  userId: string
): Promise<void> {
  await db.execute(`SET app.current_tenant_id = '${tenantId}'`);
  await db.execute(`SET app.current_user_id = '${userId}'`);
}

/**
 * Execute a function with tenant context
 */
export async function withTenantContext<T>(
  context: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  await setTenantContext(context.tenantId, context.userId);
  try {
    return await fn();
  } finally {
    // Clear the context
    await db.execute(`SET app.current_tenant_id = ''`);
    await db.execute(`SET app.current_user_id = ''`);
  }
}

/**
 * Check if user has required permission for a resource
 */
export function hasPermission(
  userRole: string,
  requiredRole: "owner" | "admin" | "member" | "viewer"
): boolean {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Create a new tenant (called when Clerk organization is created)
 */
export async function createTenant(
  clerkOrgId: string,
  name: string,
  ownerClerkUserId: string,
  ownerEmail: string,
  ownerFirstName?: string,
  ownerLastName?: string
) {
  const newTenant = await db
    .insert(tenants)
    .values({
      name,
      clerkOrgId,
      settings: {},
    })
    .returning();

  const tenant = newTenant[0];

  // Create the owner user
  await db.insert(users).values({
    clerkUserId: ownerClerkUserId,
    tenantId: tenant.id,
    email: ownerEmail,
    firstName: ownerFirstName,
    lastName: ownerLastName,
    role: "owner",
    settings: {},
  });

  return tenant;
}

/**
 * Add user to tenant (called when user joins organization)
 */
export async function addUserToTenant(
  clerkUserId: string,
  tenantId: string,
  email: string,
  role: "admin" | "member" | "viewer" = "member",
  firstName?: string,
  lastName?: string
) {
  const newUser = await db
    .insert(users)
    .values({
      clerkUserId,
      tenantId,
      email,
      firstName,
      lastName,
      role,
      settings: {},
    })
    .returning();

  return newUser[0];
}

/**
 * Remove user from tenant
 */
export async function removeUserFromTenant(
  clerkUserId: string,
  tenantId: string
) {
  await db
    .delete(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .where(eq(users.tenantId, tenantId));
}

/**
 * Update user role in tenant
 */
export async function updateUserRole(
  clerkUserId: string,
  tenantId: string,
  newRole: "owner" | "admin" | "member" | "viewer"
) {
  const updatedUser = await db
    .update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.clerkUserId, clerkUserId))
    .where(eq(users.tenantId, tenantId))
    .returning();

  return updatedUser[0];
}