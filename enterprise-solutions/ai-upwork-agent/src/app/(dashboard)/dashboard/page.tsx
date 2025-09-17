import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Users, TrendingUp, Plus } from "lucide-react";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to your AI-powered Upwork automation platform
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Quick Actions
        </Button>
      </div>

      {/* Dashboard Metrics */}
      <DashboardMetrics />
    </div>
  );
}