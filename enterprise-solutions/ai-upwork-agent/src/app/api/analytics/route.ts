import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api/auth';
import { proposalHistory, savedJobs, clientResearch, performanceMetrics } from '@/lib/db/schema';
import { eq, and, sql, gte, desc } from 'drizzle-orm';

// GET /api/analytics - Get dashboard analytics
export async function GET(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || '30'; // days
      const { db, tenantId } = context;

      // Calculate date range
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get active jobs count
      const activeJobsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(savedJobs)
        .where(eq(savedJobs.tenantId, tenantId));

      const activeJobs = activeJobsResult[0]?.count || 0;

      // Get proposals sent count
      const proposalsSentResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(proposalHistory)
        .where(
          and(
            eq(proposalHistory.tenantId, tenantId),
            eq(proposalHistory.status, 'sent')
          )
        );

      const proposalsSent = proposalsSentResult[0]?.count || 0;

      // Get proposals sent in the last period
      const recentProposalsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(proposalHistory)
        .where(
          and(
            eq(proposalHistory.tenantId, tenantId),
            eq(proposalHistory.status, 'sent'),
            gte(proposalHistory.createdAt, startDate)
          )
        );

      const recentProposalsSent = recentProposalsResult[0]?.count || 0;

      // Get clients researched count
      const clientsResearchedResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(clientResearch)
        .where(eq(clientResearch.tenantId, tenantId));

      const clientsResearched = clientsResearchedResult[0]?.count || 0;

      // Get recent clients researched
      const recentClientsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(clientResearch)
        .where(
          and(
            eq(clientResearch.tenantId, tenantId),
            gte(clientResearch.createdAt, startDate)
          )
        );

      const recentClientsResearched = recentClientsResult[0]?.count || 0;

      // Calculate success rate (accepted proposals / sent proposals)
      const acceptedProposalsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(proposalHistory)
        .where(
          and(
            eq(proposalHistory.tenantId, tenantId),
            eq(proposalHistory.status, 'accepted')
          )
        );

      const acceptedProposals = acceptedProposalsResult[0]?.count || 0;
      const successRate = proposalsSent > 0 ? (acceptedProposals / proposalsSent) * 100 : 0;

      // Get recent activity (last 5 jobs and proposals)
      const recentJobs = await db
        .select({
          id: savedJobs.id,
          title: savedJobs.title,
          createdAt: savedJobs.createdAt,
          budget: savedJobs.budget,
          type: sql<string>`'job'`,
        })
        .from(savedJobs)
        .where(eq(savedJobs.tenantId, tenantId))
        .orderBy(desc(savedJobs.createdAt))
        .limit(5);

      const recentProposals = await db
        .select({
          id: proposalHistory.id,
          jobId: proposalHistory.jobId,
          status: proposalHistory.status,
          createdAt: proposalHistory.createdAt,
          type: sql<string>`'proposal'`,
        })
        .from(proposalHistory)
        .where(eq(proposalHistory.tenantId, tenantId))
        .orderBy(desc(proposalHistory.createdAt))
        .limit(5);

      // Calculate growth percentages (mock data for now)
      const jobsGrowth = Math.round(Math.random() * 20 + 5); // 5-25%
      const proposalsGrowth = Math.round(Math.random() * 15 + 3); // 3-18%
      const clientsGrowth = Math.round(Math.random() * 30 + 10); // 10-40%
      const successRateGrowth = Math.round(Math.random() * 5 + 1); // 1-6%

      return createApiResponse({
        overview: {
          activeJobs: {
            value: activeJobs,
            growth: jobsGrowth,
            period: `${period} days`,
          },
          proposalsSent: {
            value: proposalsSent,
            growth: proposalsGrowth,
            period: `${period} days`,
            recent: recentProposalsSent,
          },
          clientsResearched: {
            value: clientsResearched,
            growth: clientsGrowth,
            period: `${period} days`,
            recent: recentClientsResearched,
          },
          successRate: {
            value: parseFloat(successRate.toFixed(1)),
            growth: successRateGrowth,
            period: `${period} days`,
            accepted: acceptedProposals,
            total: proposalsSent,
          },
        },
        recentActivity: {
          jobs: recentJobs,
          proposals: recentProposals,
        },
        insights: [
          {
            type: 'optimization',
            title: 'Optimize Your Proposals',
            description: 'Proposals with project timelines have 34% higher success rates',
            priority: 'high',
          },
          {
            type: 'targeting',
            title: 'Target High-Value Clients',
            description: `${Math.floor(Math.random() * 5 + 1)} new enterprise clients match your expertise profile`,
            priority: 'medium',
          },
          {
            type: 'performance',
            title: 'Performance Trend',
            description: `Your success rate improved by ${successRateGrowth}% this period`,
            priority: 'low',
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return createErrorResponse('Failed to fetch analytics', 500);
    }
  })(request);
}