import { createTenantDB } from '@/lib/db';
import { savedJobs, proposalHistory, users } from '@/lib/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { ProposalGenerator } from '@/lib/ai/proposal-generator';

export enum AutomationAction {
  AUTO_APPLY = 'auto_apply',
  REQUEST_APPROVAL = 'request_approval',
  SKIP = 'skip',
}

export interface AutomationDecision {
  action: AutomationAction;
  confidence: number;
  reasoning: string[];
  jobScore: number;
  riskFactors: string[];
  recommendations: string[];
  estimatedSuccessRate: number;
}

export interface AutomationSettings {
  autoApplyThreshold: number; // Job score threshold for auto-apply (default: 85)
  approvalThreshold: number; // Job score threshold for requesting approval (default: 65)
  skipThreshold: number; // Job score below this gets skipped (default: 40)
  maxDailyApplications: number; // Maximum applications per day (default: 10)
  maxBudgetRange: number; // Maximum budget to consider (default: 50000)
  minBudgetRange: number; // Minimum budget to consider (default: 500)
  preferredSkills: string[]; // Skills to prioritize
  avoidedKeywords: string[]; // Keywords to avoid in job descriptions
  clientRatingMinimum: number; // Minimum client rating (default: 4.0)
  competitionThreshold: number; // Maximum number of proposals to compete against (default: 20)
  riskTolerance: 'low' | 'medium' | 'high'; // Risk tolerance level
}

export class AutomationDecisionEngine {
  private tenantId: string;
  private userId: string;

  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
  }

  // Main decision method
  async analyzeJob(jobId: string, settings?: AutomationSettings): Promise<AutomationDecision> {
    const tenantDB = createTenantDB(this.tenantId);
    const db = await tenantDB.getDB();

    try {
      // Get job details
      const job = await db
        .select()
        .from(savedJobs)
        .where(
          and(
            eq(savedJobs.id, jobId),
            eq(savedJobs.tenantId, this.tenantId)
          )
        )
        .limit(1);

      if (job.length === 0) {
        throw new Error('Job not found');
      }

      const jobData = job[0];

      // Get user settings (use defaults if not provided)
      const automationSettings = settings || await this.getDefaultSettings();

      // Perform comprehensive job analysis
      const analysis = await this.performJobAnalysis(jobData, automationSettings);

      // Check daily limits
      const dailyLimitCheck = await this.checkDailyLimits(automationSettings);

      // Make final decision
      const decision = this.makeDecision(analysis, dailyLimitCheck, automationSettings);

      await tenantDB.close();
      return decision;

    } catch (error) {
      await tenantDB.close();
      throw error;
    }
  }

  // Perform comprehensive job analysis
  private async performJobAnalysis(jobData: any, settings: AutomationSettings) {
    const analysis = {
      jobScore: jobData.aiScore || 0,
      riskFactors: [] as string[],
      qualityIndicators: [] as string[],
      competitionLevel: 0,
      clientQuality: 0,
      budgetAlignment: 0,
      skillsMatch: 0,
    };

    // Budget analysis
    if (jobData.budget) {
      const budgetMatch = jobData.budget.match(/\$(\d+)/);
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1]);

        if (budget < settings.minBudgetRange) {
          analysis.riskFactors.push(`Budget too low: $${budget}`);
          analysis.budgetAlignment = 20;
        } else if (budget > settings.maxBudgetRange) {
          analysis.riskFactors.push(`Budget too high: $${budget} (may be unrealistic)`);
          analysis.budgetAlignment = 60;
        } else {
          analysis.qualityIndicators.push(`Good budget range: $${budget}`);
          analysis.budgetAlignment = 90;
        }
      }
    }

    // Client quality analysis
    const clientInfo = jobData.clientInfo || {};
    if (clientInfo.rating) {
      if (clientInfo.rating >= settings.clientRatingMinimum) {
        analysis.qualityIndicators.push(`High client rating: ${clientInfo.rating}/5`);
        analysis.clientQuality = Math.min(100, clientInfo.rating * 20);
      } else {
        analysis.riskFactors.push(`Low client rating: ${clientInfo.rating}/5`);
        analysis.clientQuality = clientInfo.rating * 15;
      }
    }

    if (clientInfo.totalSpent && clientInfo.totalSpent >= 10000) {
      analysis.qualityIndicators.push(`Experienced client: $${clientInfo.totalSpent} total spent`);
    }

    if (clientInfo.verificationStatus === 'verified') {
      analysis.qualityIndicators.push('Verified client');
    } else {
      analysis.riskFactors.push('Unverified client');
    }

    // Skills matching analysis
    const jobSkills = jobData.skills || [];
    const matchingSkills = jobSkills.filter((skill: string) =>
      settings.preferredSkills.some(preferred =>
        skill.toLowerCase().includes(preferred.toLowerCase())
      )
    );

    analysis.skillsMatch = (matchingSkills.length / Math.max(jobSkills.length, 1)) * 100;

    if (matchingSkills.length > 0) {
      analysis.qualityIndicators.push(`Skills match: ${matchingSkills.join(', ')}`);
    }

    // Check for avoided keywords
    const description = jobData.description.toLowerCase();
    const foundAvoidedKeywords = settings.avoidedKeywords.filter(keyword =>
      description.includes(keyword.toLowerCase())
    );

    if (foundAvoidedKeywords.length > 0) {
      analysis.riskFactors.push(`Contains avoided keywords: ${foundAvoidedKeywords.join(', ')}`);
    }

    // Competition analysis (if available)
    if (jobData.clientInfo.proposals) {
      analysis.competitionLevel = jobData.clientInfo.proposals;

      if (analysis.competitionLevel > settings.competitionThreshold) {
        analysis.riskFactors.push(`High competition: ${analysis.competitionLevel} proposals`);
      } else if (analysis.competitionLevel < 5) {
        analysis.qualityIndicators.push(`Low competition: ${analysis.competitionLevel} proposals`);
      }
    }

    return analysis;
  }

  // Check daily application limits
  private async checkDailyLimits(settings: AutomationSettings): Promise<{ canApply: boolean; todayCount: number }> {
    const tenantDB = createTenantDB(this.tenantId);
    const db = await tenantDB.getDB();

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayApplications = await db
        .select()
        .from(proposalHistory)
        .where(
          and(
            eq(proposalHistory.tenantId, this.tenantId),
            eq(proposalHistory.userId, this.userId),
            gte(proposalHistory.createdAt, today)
          )
        );

      await tenantDB.close();

      return {
        canApply: todayApplications.length < settings.maxDailyApplications,
        todayCount: todayApplications.length,
      };

    } catch (error) {
      await tenantDB.close();
      throw error;
    }
  }

  // Make final automation decision
  private makeDecision(
    analysis: any,
    dailyLimitCheck: any,
    settings: AutomationSettings
  ): AutomationDecision {
    const reasoning: string[] = [];
    const recommendations: string[] = [];
    let confidence = 50;

    // Calculate weighted score
    const weightedScore = this.calculateWeightedScore(analysis, settings);

    // Check daily limits first
    if (!dailyLimitCheck.canApply) {
      return {
        action: AutomationAction.SKIP,
        confidence: 100,
        reasoning: [`Daily application limit reached (${dailyLimitCheck.todayCount}/${settings.maxDailyApplications})`],
        jobScore: weightedScore,
        riskFactors: [],
        recommendations: ['Consider increasing daily limit or wait until tomorrow'],
        estimatedSuccessRate: 0,
      };
    }

    // Determine action based on score and risk factors
    let action: AutomationAction;

    if (weightedScore >= settings.autoApplyThreshold && analysis.riskFactors.length <= 1) {
      action = AutomationAction.AUTO_APPLY;
      confidence = Math.min(95, 70 + (weightedScore - settings.autoApplyThreshold));
      reasoning.push(`High job score: ${weightedScore}`);
      reasoning.push(`Low risk: ${analysis.riskFactors.length} risk factors`);
    } else if (weightedScore >= settings.approvalThreshold) {
      action = AutomationAction.REQUEST_APPROVAL;
      confidence = Math.min(85, 50 + (weightedScore - settings.approvalThreshold));
      reasoning.push(`Moderate job score: ${weightedScore}`);
      reasoning.push('Manual review recommended');
    } else {
      action = AutomationAction.SKIP;
      confidence = Math.min(90, 60 + (settings.skipThreshold - weightedScore));
      reasoning.push(`Low job score: ${weightedScore}`);
      reasoning.push('Below minimum threshold');
    }

    // Add quality indicators to reasoning
    analysis.qualityIndicators.forEach((indicator: string) => {
      reasoning.push(`✓ ${indicator}`);
    });

    // Generate recommendations
    if (analysis.riskFactors.length > 0) {
      recommendations.push('Review risk factors before applying');
    }

    if (analysis.skillsMatch < 50) {
      recommendations.push('Consider improving skills alignment');
    }

    if (analysis.competitionLevel > settings.competitionThreshold) {
      recommendations.push('Consider more unique value proposition due to high competition');
    }

    // Estimate success rate
    const estimatedSuccessRate = this.estimateSuccessRate(analysis, settings);

    return {
      action,
      confidence,
      reasoning,
      jobScore: weightedScore,
      riskFactors: analysis.riskFactors,
      recommendations,
      estimatedSuccessRate,
    };
  }

  // Calculate weighted job score
  private calculateWeightedScore(analysis: any, settings: AutomationSettings): number {
    const weights = {
      baseScore: 0.3,
      clientQuality: 0.25,
      budgetAlignment: 0.2,
      skillsMatch: 0.15,
      competition: 0.1,
    };

    let score = analysis.jobScore * weights.baseScore;
    score += analysis.clientQuality * weights.clientQuality;
    score += analysis.budgetAlignment * weights.budgetAlignment;
    score += analysis.skillsMatch * weights.skillsMatch;

    // Competition penalty
    if (analysis.competitionLevel > 0) {
      const competitionScore = Math.max(0, 100 - (analysis.competitionLevel * 3));
      score += competitionScore * weights.competition;
    }

    // Risk factor penalties
    score -= analysis.riskFactors.length * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Estimate success rate based on historical data and job factors
  private estimateSuccessRate(analysis: any, settings: AutomationSettings): number {
    let successRate = 15; // Base Upwork success rate

    // Quality bonuses
    if (analysis.clientQuality >= 80) successRate += 10;
    if (analysis.budgetAlignment >= 80) successRate += 8;
    if (analysis.skillsMatch >= 70) successRate += 12;
    if (analysis.competitionLevel > 0 && analysis.competitionLevel < 10) successRate += 15;

    // Risk penalties
    successRate -= analysis.riskFactors.length * 3;

    return Math.max(5, Math.min(85, successRate));
  }

  // Get default automation settings
  private async getDefaultSettings(): Promise<AutomationSettings> {
    return {
      autoApplyThreshold: 85,
      approvalThreshold: 65,
      skipThreshold: 40,
      maxDailyApplications: 10,
      maxBudgetRange: 50000,
      minBudgetRange: 500,
      preferredSkills: ['react', 'typescript', 'node.js', 'python', 'ai'],
      avoidedKeywords: ['crypto', 'gambling', 'adult', 'illegal'],
      clientRatingMinimum: 4.0,
      competitionThreshold: 20,
      riskTolerance: 'medium',
    };
  }
}