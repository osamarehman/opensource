import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { JobsList } from "@/components/dashboard/jobs-list";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Discovery</h1>
          <p className="text-gray-600 mt-1">
            AI-powered job discovery and intelligent matching
          </p>
        </div>
        <Button>
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
      </div>

      {/* Jobs List */}
      <JobsList />
    </div>
  );
}