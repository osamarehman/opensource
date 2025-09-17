import { OrganizationSwitcher, CreateOrganization } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OrganizationSelectionPage() {
  const { userId, orgId } = await auth();

  // If user is not authenticated, redirect to sign in
  if (!userId) {
    redirect("/sign-in");
  }

  // If user already has an organization, redirect to dashboard
  if (orgId) {
    redirect("/jobs");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Your Organization
          </h1>
          <p className="text-gray-600 mb-6">
            Choose an existing organization or create a new one to get started
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Switch Organization
            </h2>
            <OrganizationSwitcher
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger: "w-full justify-start",
                },
              }}
              hidePersonal
            />
          </div>

          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Organization
            </h2>
            <CreateOrganization
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0",
                },
              }}
            />
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Organizations help you manage teams and share resources securely
          </p>
        </div>
      </div>
    </div>
  );
}