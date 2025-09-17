import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { createTenantDB } from '@/lib/db';

export interface AuthContext {
  userId: string;
  orgId: string;
  tenantId: string;
  db: Awaited<ReturnType<ReturnType<typeof createTenantDB>['getDB']>>;
}

// Get authenticated user context with tenant database
export async function getAuthContext(): Promise<AuthContext> {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized: User must be authenticated and part of an organization');
  }

  // Use organization ID as tenant ID
  const tenantId = orgId;

  // Create tenant-aware database connection
  const tenantDB = createTenantDB(tenantId);
  const db = await tenantDB.getDB();

  return {
    userId,
    orgId,
    tenantId,
    db,
  };
}

// Wrapper for API routes with authentication
export function withAuth<T>(
  handler: (context: AuthContext, request: NextRequest) => Promise<T>
) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const context = await getAuthContext();
      return await handler(context, request);
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
}

// Response helpers
export function createApiResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function createErrorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Validate request body with Zod schema
export async function validateRequestBody<T>(request: NextRequest, schema: any): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    throw new Error(`Invalid request body: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}