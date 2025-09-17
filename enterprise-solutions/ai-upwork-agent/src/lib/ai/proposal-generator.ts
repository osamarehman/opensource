import OpenAI from 'openai';
import { createTenantDB } from '@/lib/db';
import { proposalHistory, savedJobs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface JobContext {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  skills: string[];
  clientInfo: Record<string, any>;
  url: string;
  aiScore: number | null;
}

interface ProposalGenerationResult {
  proposal: string;
  confidence: number;
  reasoning: string;
  patterns: string[];
  wordCount: number;
}

interface WinningPattern {
  structure: string;
  keyPhrases: string[];
  length: number;
  tone: string;
  successRate: number;
}

export class ProposalGenerator {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  // Main method to generate a proposal for a job
  async generateProposal(
    jobContext: JobContext,
    userId: string,
    customInstructions?: string
  ): Promise<ProposalGenerationResult> {
    try {
      // 1. Analyze past winning proposals to identify patterns
      const winningPatterns = await this.analyzeWinningProposals(userId);

      // 2. Create dynamic prompt based on job context and patterns
      const prompt = await this.createDynamicPrompt(jobContext, winningPatterns, customInstructions);

      // 3. Generate proposal using OpenAI
      const proposal = await this.generateWithOpenAI(prompt);

      // 4. Validate and optimize the proposal
      const optimizedProposal = await this.optimizeProposal(proposal, jobContext);

      // 5. Calculate confidence score
      const confidence = this.calculateConfidenceScore(optimizedProposal, winningPatterns, jobContext);

      return {
        proposal: optimizedProposal,
        confidence,
        reasoning: `Generated based on ${winningPatterns.length} winning proposal patterns. Job score: ${jobContext.aiScore}%`,
        patterns: winningPatterns.map(p => p.structure),
        wordCount: optimizedProposal.split(' ').length,
      };

    } catch (error) {
      console.error('Proposal generation error:', error);
      throw new Error(`Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analyze past winning proposals to identify patterns
  private async analyzeWinningProposals(userId: string): Promise<WinningPattern[]> {
    const tenantDB = createTenantDB(this.tenantId);
    const db = await tenantDB.getDB();

    try {
      // Get all accepted proposals for pattern analysis
      const winningProposals = await db
        .select()
        .from(proposalHistory)
        .where(
          and(
            eq(proposalHistory.tenantId, this.tenantId),
            eq(proposalHistory.userId, userId),
            eq(proposalHistory.status, 'accepted')
          )
        )
        .orderBy(desc(proposalHistory.createdAt))
        .limit(50); // Analyze last 50 winning proposals

      const patterns: WinningPattern[] = [];

      if (winningProposals.length > 0) {
        // Analyze structure patterns
        const structureAnalysis = this.analyzeProposalStructures(winningProposals);
        patterns.push(...structureAnalysis);

        // Analyze key phrases
        const phraseAnalysis = this.analyzeKeyPhrases(winningProposals);
        patterns.push(...phraseAnalysis);

        // Analyze length patterns
        const lengthAnalysis = this.analyzeLengthPatterns(winningProposals);
        patterns.push(...lengthAnalysis);
      }

      // If no winning proposals, use default successful patterns
      if (patterns.length === 0) {
        patterns.push(...this.getDefaultPatterns());
      }

      await tenantDB.close();
      return patterns;

    } catch (error) {
      await tenantDB.close();
      throw error;
    }
  }

  // Analyze proposal structures to identify winning patterns
  private analyzeProposalStructures(proposals: any[]): WinningPattern[] {
    const patterns: WinningPattern[] = [];

    // Common winning structures
    const structures = {
      'Problem-Solution-Results': 0,
      'Experience-Approach-Timeline': 0,
      'Understanding-Expertise-Value': 0,
      'Question-Solution-CTA': 0,
    };

    proposals.forEach(proposal => {
      const content = proposal.content.toLowerCase();

      // Detect Problem-Solution-Results pattern
      if (content.includes('understand') && content.includes('solution') && content.includes('result')) {
        structures['Problem-Solution-Results']++;
      }

      // Detect Experience-Approach-Timeline pattern
      if (content.includes('experience') && content.includes('approach') && content.includes('deliver')) {
        structures['Experience-Approach-Timeline']++;
      }

      // Add more pattern detection logic...
    });

    // Convert to patterns with success rates
    Object.entries(structures).forEach(([structure, count]) => {
      if (count > 0) {
        patterns.push({
          structure,
          keyPhrases: [],
          length: 0,
          tone: 'professional',
          successRate: (count / proposals.length) * 100,
        });
      }
    });

    return patterns;
  }

  // Analyze key phrases that appear in winning proposals
  private analyzeKeyPhrases(proposals: any[]): WinningPattern[] {
    const phrases = new Map<string, number>();

    proposals.forEach(proposal => {
      const content = proposal.content.toLowerCase();

      // Extract potential key phrases (2-4 words)
      const words = content.split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        for (let len = 2; len <= 4 && i + len <= words.length; len++) {
          const phrase = words.slice(i, i + len).join(' ');
          if (phrase.length > 10 && !phrase.includes('the') && !phrase.includes('and')) {
            phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
          }
        }
      }
    });

    // Get top phrases
    const topPhrases = Array.from(phrases.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);

    return [{
      structure: 'Key Phrases',
      keyPhrases: topPhrases,
      length: 0,
      tone: 'engaging',
      successRate: 85,
    }];
  }

  // Analyze optimal length patterns
  private analyzeLengthPatterns(proposals: any[]): WinningPattern[] {
    const lengths = proposals.map(p => p.content.split(' ').length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

    return [{
      structure: 'Optimal Length',
      keyPhrases: [],
      length: Math.round(avgLength),
      tone: 'concise',
      successRate: 90,
    }];
  }

  // Default patterns for new users
  private getDefaultPatterns(): WinningPattern[] {
    return [
      {
        structure: 'Problem-Solution-Results',
        keyPhrases: [
          'understand your needs',
          'proven experience',
          'deliver high-quality',
          'on-time delivery',
          'exceed expectations',
        ],
        length: 150,
        tone: 'professional',
        successRate: 75,
      },
      {
        structure: 'Experience-Approach-Timeline',
        keyPhrases: [
          'years of experience',
          'similar projects',
          'best practices',
          'clear communication',
          'project timeline',
        ],
        length: 180,
        tone: 'confident',
        successRate: 70,
      },
    ];
  }

  // Create dynamic prompt based on job context and winning patterns
  private async createDynamicPrompt(
    jobContext: JobContext,
    patterns: WinningPattern[],
    customInstructions?: string
  ): Promise<string> {
    const topPattern = patterns.sort((a, b) => b.successRate - a.successRate)[0];
    const targetLength = topPattern?.length || 150;
    const keyPhrases = patterns.flatMap(p => p.keyPhrases).slice(0, 8);

    return `You are an expert Upwork proposal writer. Generate a compelling cover letter for this job posting.

JOB DETAILS:
Title: ${jobContext.title}
Description: ${jobContext.description.substring(0, 1000)}...
Budget: ${jobContext.budget || 'Not specified'}
Required Skills: ${jobContext.skills.join(', ')}
Client Rating: ${jobContext.clientInfo.rating || 'Unknown'}

WINNING PATTERNS TO FOLLOW:
- Structure: ${topPattern?.structure || 'Problem-Solution-Results'}
- Successful phrases to incorporate: ${keyPhrases.join(', ')}
- Target length: ${targetLength} words (MAX 300 words, under 5000 characters)
- Tone: Professional, confident, and personalized

REQUIREMENTS:
1. Address the specific job requirements mentioned
2. Highlight relevant experience and skills
3. Include a clear call-to-action
4. Keep under 5000 characters total
5. Be specific about deliverables and timeline
6. Show understanding of the client's needs

${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ''}

Generate a professional, engaging cover letter that follows the winning patterns:`;
  }

  // Generate proposal using OpenAI
  private async generateWithOpenAI(prompt: string): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert freelance proposal writer with a 95% success rate on Upwork. Write compelling, personalized proposals that win projects.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  }

  // Optimize the generated proposal
  private async optimizeProposal(proposal: string, jobContext: JobContext): Promise<string> {
    // Ensure it's under 5000 characters
    if (proposal.length > 4800) {
      proposal = proposal.substring(0, 4700) + '...';
    }

    // Add job-specific optimizations
    // TODO: Add more optimization logic

    return proposal;
  }

  // Calculate confidence score for the generated proposal
  private calculateConfidenceScore(
    proposal: string,
    patterns: WinningPattern[],
    jobContext: JobContext
  ): number {
    let score = 60; // Base score

    // Length optimization
    const wordCount = proposal.split(' ').length;
    if (wordCount >= 100 && wordCount <= 300) score += 15;

    // Pattern matching
    const topPattern = patterns[0];
    if (topPattern) {
      const patternMatches = topPattern.keyPhrases.filter(phrase =>
        proposal.toLowerCase().includes(phrase.toLowerCase())
      ).length;
      score += (patternMatches / topPattern.keyPhrases.length) * 20;
    }

    // Job relevance
    const skillMatches = jobContext.skills.filter(skill =>
      proposal.toLowerCase().includes(skill.toLowerCase())
    ).length;
    score += (skillMatches / Math.max(jobContext.skills.length, 1)) * 15;

    // Job score influence
    if (jobContext.aiScore) {
      score += (jobContext.aiScore / 100) * 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}