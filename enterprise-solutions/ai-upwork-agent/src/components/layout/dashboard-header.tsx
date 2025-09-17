"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export function DashboardHeader() {
  return (
    <header className="bg-white border-b border-gray-200 lg:pl-64">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Center content - could be breadcrumbs or page title */}
        <div className="flex-1 flex items-center justify-center lg:justify-start">
          <h1 className="text-lg font-semibold text-gray-900 lg:hidden">
            AI Upwork Agent
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Organization Switcher */}
          <OrganizationSwitcher
            appearance={{
              elements: {
                organizationSwitcherTrigger: "border border-gray-300 rounded-md px-3 py-2 text-sm",
              },
            }}
            hidePersonal
          />

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}