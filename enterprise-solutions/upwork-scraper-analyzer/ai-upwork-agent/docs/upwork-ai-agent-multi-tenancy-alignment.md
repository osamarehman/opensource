# Aligning Multi-Tenancy With Upwork Account Controls

This addendum explains how the tenant model described in **`upwork-ai-agent-multi-tenancy.md`** maps directly to Upwork’s own concept of **Companies, Teams, and Permissions** so that data pulled from the Upwork API stays perfectly isolated per tenant.

---

## 1  Upwork Hierarchy Refresher

| Upwork Object | Description | Equivalent Tenant Concept |
|---------------|-------------|---------------------------|
| **Company** (`parent_team`) | Top-level billing entity for a client or an agency[8][124] | **Tenant** (`tenants.id`) |
| **Team** | Sub-unit inside a company (e.g., Marketing Team)[124][126] | **Sub-tenant** (`tenant_teams.id`) |
| **Member Role** | Permission set within a team (Admin, Hiring Manager, Finance)[125][127] | **Role** (`membership.role`) |

---

## 2  Database Extensions

### 2.1  New Tables

```typescript
// src/lib/db/schema.ts (extract)

export const tenantTeams = pgTable('tenant_teams', {
  id: text('id').primaryKey(),            // Upwork team_id (string)
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  upworkReference: integer('reference'),  // numeric reference from Upwork API
});

export const memberships = pgTable('memberships', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tenantTeamId: text('tenant_team_id').references(() => tenantTeams.id).notNull(),
  role: text('role').notNull(), // "ADMIN" | "MANAGER" | "MEMBER"
});
```

### 2.2  Revised RLS Policy (Team-Aware)

```sql
CREATE POLICY team_isolation_jobs ON jobs
USING (
  tenant_id = current_setting('app.tenant_id')::uuid
  AND tenant_team_id = current_setting('app.team_id')::text
);
```

---

## 3  Tenant Context Resolution Flow

1. **Clerk Session** → contains `org_id` (Upwork Company ID) and custom `org_team_id` claim.
2. **Middleware** extracts both IDs and writes to secure cookies: `tenant-id`, `tenant-team-id`.
3. **Database Connection Hook** sets session variables:
   ```sql
   SELECT set_tenant(:tenantId);
   SELECT set_config('app.team_id', :tenantTeamId, false);
   ```
4. **RLS** enforces isolation at both company and team levels.

---

## 4  Upwork API Scoping

Use these **GraphQL scopes** when requesting an API key:

| Scope | Reason |
|-------|--------|
| `organization:read` | Resolve company & team IDs[127] |
| `team:read` | Fetch teams under a company[8] |
| `message:read` | Tenant-scoped messaging data |
| `contract:read` | Contracts within tenant teams |

Upwork enforces **team-level permissions** automatically[125], so aligning tenant IDs with `team_id` guarantees that users never fetch data outside their tenant boundary.

---

## 5  UI Implications

* **Organization Switcher**: Use Clerk `<OrganizationSwitcher />`; extends to team dropdown.
* **Subdomain Routing**: `:companySlug.:teamSlug.yourapp.com` → resolves both IDs.
* **Breadcrumbs**: `Company › Team › Job › Proposal` for clear context.

---

## 6  Sync Script — Companies & Teams

Create a **nightly CRON** to sync company/team metadata:

```typescript
import { upworkClient } from '@/lib/upwork/client';

export async function syncUpworkTenants() {
  const companies = await upworkClient.companies.get_list();
  for (const c of companies) {
    await upsertTenant({ id: c.id, name: c.name });
    const teams = await upworkClient.companies.get_specific(c.id);
    for (const t of teams) {
      await upsertTenantTeam({ id: t.id, tenantId: c.id, name: t.name, reference: t.reference });
    }
  }
}
```

---

### Your multi-tenancy layer now mirrors Upwork’s own account hierarchy **one-to-one**, ensuring seamless permission alignment and safer data isolation.
