import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { SearchRequirement, Opportunity, RadarResponse } from '@/types/opportunity';
import { searchOpportunitiesWithTinyFish } from '@/lib/tinyfish';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Supported Flash-Lite models in order of preference
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];

const UNDERSTAND_SYSTEM_INSTRUCTION = `You are the requirement extraction engine for Opportunity Radar.
Your purpose is to understand the user's free-form request for opportunities (hackathons, internships, fellowships, grants, research, etc.) and convert it into a clean, structured search requirement.

Rules for extraction:
1. "location": The specific country, city, region, or "Remote" / "Global" if mentioned. If not mentioned, return null.
2. "experience": The user's stated academic standing or career stage (e.g. "2nd year student", "undergraduate", "PhD candidate", "early career", "high school"). If not mentioned, return null.
3. "interests": Specific domains, topics, or technical fields the user is interested in (e.g. ["AI"], ["Web3", "Solidity"], ["Biotechnology"]).
4. "opportunity_types": The categories of opportunities sought (e.g. ["hackathons", "internships", "grants", "fellowships"]).
5. "keywords": High-signal search keywords and relevant synonyms/expansions suitable for discovering live web opportunities (e.g. ["AI", "machine learning", "student"]).

Always output valid JSON conforming strictly to the requested schema.`;

const searchRequirementSchema = {
  type: Type.OBJECT,
  properties: {
    location: {
      type: Type.STRING,
      description: 'The target location or country (e.g. India, US, Remote) or empty if not specified',
    },
    experience: {
      type: Type.STRING,
      description: 'The educational background or experience level (e.g. 2nd year student, undergraduate)',
    },
    interests: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Domain interests, technologies, or subjects (e.g. AI, Machine Learning)',
    },
    opportunity_types: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Opportunity types requested (e.g. hackathons, internships, grants)',
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'High-signal search keywords and expanded terms for web discovery',
    },
  },
  required: ['interests', 'opportunity_types', 'keywords'],
};

const PERSONALIZE_SYSTEM_INSTRUCTION = `You are the ranking, filtering, and personalization engine for Opportunity Radar.
Your task is to take:
1. The user's original request
2. The extracted structured requirements
3. The raw opportunities discovered from the live web by TinyFish

You must:
- Remove completely irrelevant opportunities or spam.
- Remove obvious duplicates.
- Check whether each opportunity matches the user's specific background, experience level, location, and interests.
- Summarize each opportunity clearly in 1-2 concise sentences.
- Explain why it is relevant to the user ("why_relevant") specifically addressing their profile and goals.
- Identify eligibility requirements ("eligibility"). If missing from the source data, write "Not specified".
- Extract or verify the deadline ("deadline"). If a deadline is not explicitly present in the data, write "Not specified" — NEVER guess or invent deadlines.
- State location ("location"). If missing, write "Not specified".
- Preserve the exact original source URL from the TinyFish data. NEVER create fake URLs or change domain paths.
- Rank opportunities by relevance: assign "relevance" as "high", "medium", or "low", and order the output array with the highest relevance items first.

CRITICAL INTEGRITY RULES:
- Never invent opportunities, deadlines, organizations, or URLs.
- If information is missing from the TinyFish results, return "Not specified".
- Keep the original source URL for every opportunity.
- Output strict JSON matching the schema.`;

const processedOpportunitiesSchema = {
  type: Type.OBJECT,
  properties: {
    opportunities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Title or name of the opportunity' },
          organization: { type: Type.STRING, description: 'Hosting organization, company, or platform' },
          type: { type: Type.STRING, description: 'Opportunity type (e.g. hackathon, internship, fellowship, grant)' },
          deadline: { type: Type.STRING, description: 'Application deadline or "Not specified"' },
          eligibility: { type: Type.STRING, description: 'Eligibility criteria or "Not specified"' },
          location: { type: Type.STRING, description: 'Location, country, or "Remote" or "Not specified"' },
          summary: { type: Type.STRING, description: 'Concise 1-2 sentence summary of the opportunity' },
          why_relevant: { type: Type.STRING, description: 'Personalized explanation of why this matches the user request' },
          url: { type: Type.STRING, description: 'Exact source URL from TinyFish' },
          relevance: {
            type: Type.STRING,
            enum: ['high', 'medium', 'low'],
            description: 'Match tier: high, medium, or low',
          },
        },
        required: [
          'title',
          'organization',
          'type',
          'deadline',
          'eligibility',
          'location',
          'summary',
          'why_relevant',
          'url',
          'relevance',
        ],
      },
    },
  },
  required: ['opportunities'],
};

export async function POST(request: NextRequest): Promise<NextResponse<RadarResponse>> {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const tinyfishKey = process.env.TINYFISH_API_KEY;

    if (!geminiKey || geminiKey.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error:
            'GEMINI_API_KEY is not configured on the server. Please add your GEMINI_API_KEY to .env.local and restart the server.',
        },
        { status: 500 }
      );
    }

    if (!tinyfishKey || tinyfishKey.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error:
            'TINYFISH_API_KEY is not configured on the server. Please add your TINYFISH_API_KEY to .env.local and restart the server.',
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid query describing the opportunities you want to find.',
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL)];

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Gemini Flash-Lite understands and extracts requirements
    // ─────────────────────────────────────────────────────────────
    let lastError: Error | null = null;
    let structuredResult: SearchRequirement | null = null;
    let usedModel = PRIMARY_MODEL;

    for (const model of modelsToTry) {
      try {
        usedModel = model;
        const response = await ai.models.generateContent({
          model,
          contents: `User request: "${query}"`,
          config: {
            systemInstruction: UNDERSTAND_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: searchRequirementSchema,
            temperature: 0.1,
          },
        });

        const rawText = response.text?.trim() || '';
        if (rawText) {
          const parsed = JSON.parse(rawText) as SearchRequirement;
          structuredResult = {
            location: parsed.location || null,
            experience: parsed.experience || null,
            interests: Array.isArray(parsed.interests) ? parsed.interests : [],
            opportunity_types: Array.isArray(parsed.opportunity_types) ? parsed.opportunity_types : [],
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          };
          break;
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message || '';
        const isModelNotFound = errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('unsupported');
        if (!isModelNotFound) {
          break;
        }
      }
    }

    if (!structuredResult) {
      const sanitizedMessage = lastError?.message || 'Failed to extract structured requirements from Gemini.';
      return NextResponse.json(
        {
          success: false,
          error: sanitizedMessage,
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: TinyFish searches the live web with the requirements
    // ─────────────────────────────────────────────────────────────
    const rawOpportunities = await searchOpportunitiesWithTinyFish(structuredResult, tinyfishKey);

    // If no raw opportunities were found on the web, return cleanly
    if (rawOpportunities.length === 0) {
      return NextResponse.json({
        success: true,
        requirements: structuredResult,
        opportunities: [],
        rawCount: 0,
        model: usedModel,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Gemini Flash-Lite filters, summarizes & personalizes
    // ─────────────────────────────────────────────────────────────
    const synthesisPayload = {
      user_original_request: query,
      extracted_requirements: structuredResult,
      raw_web_opportunities: rawOpportunities.map((o) => ({
        title: o.title,
        organization: o.organization,
        type: o.type,
        snippet_or_description: o.description,
        source_url: o.url,
        location: o.location,
        eligibility: o.eligibility,
        deadline: o.deadline,
      })),
    };

    let processedOpportunities: Opportunity[] = [];

    try {
      const synthesisResponse = await ai.models.generateContent({
        model: usedModel,
        contents: `Process and rank these web-discovered opportunities for the user:
${JSON.stringify(synthesisPayload, null, 2)}`,
        config: {
          systemInstruction: PERSONALIZE_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: processedOpportunitiesSchema,
          temperature: 0.15,
        },
      });

      const rawSynthText = synthesisResponse.text?.trim() || '';
      if (rawSynthText) {
        const parsedSynth = JSON.parse(rawSynthText) as { opportunities?: Opportunity[] };
        if (Array.isArray(parsedSynth.opportunities)) {
          processedOpportunities = parsedSynth.opportunities.map((item, idx) => ({
            id: `radar-opp-${idx + 1}`,
            title: item.title || 'Opportunity',
            organization: item.organization || 'Web Provider',
            type: item.type || 'other',
            deadline: item.deadline || 'Not specified',
            eligibility: item.eligibility || 'Not specified',
            location: item.location || 'Not specified',
            summary: item.summary || '',
            why_relevant: item.why_relevant || '',
            url: item.url || (rawOpportunities[idx]?.url ?? '#'),
            relevance: (['high', 'medium', 'low'].includes(item.relevance) ? item.relevance : 'medium') as 'high' | 'medium' | 'low',
          }));
        }
      }
    } catch (synthesisError) {
      console.warn('Gemini personalization step note:', synthesisError);
      // Fallback: if synthesis had an error, format raw TinyFish opportunities directly
      processedOpportunities = rawOpportunities.map((raw, idx) => ({
        id: `radar-opp-${idx + 1}`,
        title: raw.title,
        organization: raw.organization,
        type: raw.type,
        deadline: raw.deadline || 'Not specified',
        eligibility: raw.eligibility || 'Not specified',
        location: raw.location || 'Not specified',
        summary: raw.description,
        why_relevant: `Matches your search for ${structuredResult?.opportunity_types.join(', ')} in ${structuredResult?.interests.join(', ')}.`,
        url: raw.url,
        relevance: 'high' as const,
      }));
    }

    return NextResponse.json({
      success: true,
      requirements: structuredResult,
      opportunities: processedOpportunities,
      rawCount: rawOpportunities.length,
      model: usedModel,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
