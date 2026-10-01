export type OpportunityType = 'hackathon' | 'internship' | 'fellowship' | 'grant' | 'competition' | 'other';

export interface RawOpportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  description: string;
  deadline?: string;
  location?: string;
  eligibility?: string;
  rewardOrFunding?: string;
  url: string;
  tags?: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: string;
  deadline: string;
  eligibility: string;
  location: string;
  summary: string;
  why_relevant: string;
  url: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface SearchRequirement {
  location?: string | null;
  experience?: string | null;
  interests: string[];
  opportunity_types: string[];
  keywords: string[];
}

export interface RadarResponse {
  success: boolean;
  requirements?: SearchRequirement;
  opportunities?: Opportunity[];
  rawCount?: number;
  model?: string;
  error?: string;
}
