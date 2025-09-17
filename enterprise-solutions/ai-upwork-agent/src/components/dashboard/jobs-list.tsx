"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Bookmark, ExternalLink, Plus, Briefcase } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  upworkJobId: string;
  budget: string | null;
  skills: string[];
  clientInfo: Record<string, any>;
  url: string;
  aiScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) {
          params.set('search', searchQuery);
        }

        const response = await fetch(`/api/jobs?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const data: JobsResponse = await response.json();
        setJobs(data.jobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [searchQuery]);

  const handleSearch = () => {
    setSearchQuery(search);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-64 bg-gray-200 rounded" />
                  <div className="h-4 w-96 bg-gray-200 rounded" />
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-6 w-16 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-gray-200 rounded" />
                  <div className="h-8 w-32 bg-gray-200 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600">Error loading jobs: {error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs by title, skills, or keywords..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="space-y-4">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {job.description.length > 200
                        ? job.description.substring(0, 200) + "..."
                        : job.description}
                    </CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{job.budget || 'Budget not specified'}</span>
                      <span>•</span>
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.aiScore && (
                      <div className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        AI Score: {job.aiScore}%
                      </div>
                    )}
                    <Button variant="ghost" size="sm">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{job.skills.length - 6} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(job.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Upwork
                    </Button>
                    <Button size="sm">
                      Generate Proposal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Briefcase className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? `No jobs match your search "${searchQuery}"`
                    : "Start by adding some job opportunities to track"}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Load More */}
      {jobs.length > 0 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Jobs
          </Button>
        </div>
      )}
    </div>
  );
}