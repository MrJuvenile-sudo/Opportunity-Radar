import { TinyFish } from '@tiny-fish/sdk';
import { SearchRequirement, RawOpportunity, OpportunityType } from '@/types/opportunity';

function normalizeOpportunityType(rawType: string): OpportunityType {
  const lower = (rawType || '').toLowerCase();
  if (lower.includes('hackathon')) return 'hackathon';
  if (lower.includes('intern')) return 'internship';
  if (lower.includes('fellow')) return 'fellowship';
  if (lower.includes('grant') || lower.includes('fund')) return 'grant';
  if (lower.includes('compet')) return 'competition';
  return 'other';
}

function extractOrgFromUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return host;
  } catch {
    return 'Web Source';
  }
}

export async function searchOpportunitiesWithTinyFish(
  requirements: SearchRequirement,
  apiKey?: string
): Promise<RawOpportunity[]> {
  const key = apiKey || process.env.TINYFISH_API_KEY;

  if (!key || key.trim() === '') {
    throw new Error('TINYFISH_API_KEY is not configured on the server.');
  }

  const tinyfish = new TinyFish({ apiKey: key });

  // 1. Build high-signal search terms from Gemini requirements
  const queryTerms = [
    ...requirements.opportunity_types,
    ...requirements.interests,
    requirements.location || '',
    requirements.experience || '',
    ...requirements.keywords.slice(0, 3),
    '2026',
  ]
    .filter(Boolean)
    .join(' ');

  const searchResults: RawOpportunity[] = [];
  const seenUrls = new Set<string>();

  // 2. Perform live web search using TinyFish Search API
  let topTargetUrl = 'https://devpost.com/hackathons';
  try {
    const searchResponse = await tinyfish.search.query({
      query: queryTerms,
      location: requirements.location || undefined,
      purpose: 'Find student and developer hackathons, internships, fellowships and grants',
    });

    if (searchResponse.results && searchResponse.results.length > 0) {
      // Pick a high-relevance directory or listing URL for the agent to navigate
      const listingUrl = searchResponse.results.find((r) =>
        r.url.includes('devpost.com') ||
        r.url.includes('unstop.com') ||
        r.url.includes('mlh.io') ||
        r.url.includes('kaggle.com') ||
        r.url.includes('grants')
      );
      if (listingUrl) {
        topTargetUrl = listingUrl.url;
      } else {
        topTargetUrl = searchResponse.results[0].url;
      }

      // Convert search hits into verified structured opportunities
      for (const item of searchResponse.results) {
        if (!item.url || seenUrls.has(item.url)) continue;
        seenUrls.add(item.url);

        const inferredType = normalizeOpportunityType(
          item.title + ' ' + (item.snippet || '')
        );

        searchResults.push({
          id: `tf-search-${searchResults.length + 1}`,
          title: item.title,
          organization: extractOrgFromUrl(item.url),
          type: inferredType,
          description: item.snippet || 'Discovered live on the web via TinyFish.',
          deadline: 'See website for deadlines',
          location: requirements.location || 'Global / Remote',
          eligibility: requirements.experience || 'Open to eligible applicants',
          url: item.url,
          tags: [
            ...requirements.interests.slice(0, 2),
            inferredType,
            requirements.location || 'Online',
          ].filter(Boolean),
        });
      }
    }
  } catch (searchError) {
    console.warn('TinyFish search error:', searchError);
  }

  // 3. Execute TinyFish Web Agent on the identified listing site with a bounded timeout
  if (topTargetUrl && (topTargetUrl.includes('devpost.com') || topTargetUrl.includes('unstop.com') || topTargetUrl.includes('mlh.io'))) {
    try {
      const agentGoal = `Find current opportunities matching these requirements: ${JSON.stringify(requirements)}. Search the web and return useful opportunities with their source URLs.
For every opportunity, try to collect:
- title
- organization
- opportunity type (hackathon, internship, fellowship, grant, or competition)
- description
- deadline
- eligibility
- location/remote status
- URL (must be exact source link found on the site)

Return as a JSON array of objects:
[{"title": string, "organization": string, "type": string, "description": string, "deadline": string, "eligibility": string, "location": string, "url": string}]`;

      const agentTimeoutMs = 12000;
      const agentPromise = tinyfish.agent.run({
        url: topTargetUrl,
        goal: agentGoal,
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), agentTimeoutMs)
      );

      const agentResponse = await Promise.race([agentPromise, timeoutPromise]);

      if (agentResponse && agentResponse.status === 'COMPLETED' && agentResponse.result) {
      const rawResult = agentResponse.result;
      const items = Array.isArray(rawResult)
        ? rawResult
        : Array.isArray((rawResult as Record<string, unknown>).result)
        ? ((rawResult as Record<string, unknown>).result as unknown[])
        : Array.isArray((rawResult as Record<string, unknown>).opportunities)
        ? ((rawResult as Record<string, unknown>).opportunities as unknown[])
        : [];

      for (const item of items) {
        if (typeof item !== 'object' || !item) continue;
        const record = item as Record<string, string>;
        const title = record.title || record.name;
        const url = record.url || record.link || topTargetUrl;

        if (title && url) {
          const type = normalizeOpportunityType(record.type || record.opportunity_type || title);
          // Prepend agent-discovered opportunities to top of results
          searchResults.unshift({
            id: `tf-agent-${searchResults.length + 1}`,
            title: String(title),
            organization: String(record.organization || extractOrgFromUrl(url)),
            type,
            description: String(record.description || `Opportunity discovered on ${topTargetUrl}`),
            deadline: record.deadline ? String(record.deadline) : 'Check website',
            eligibility: record.eligibility ? String(record.eligibility) : (requirements.experience || 'Open to applicants'),
            location: record.location ? String(record.location) : (requirements.location || 'Remote'),
            url: String(url),
            tags: [
              ...requirements.interests.slice(0, 2),
              type,
              requirements.location || 'Global',
            ].filter(Boolean),
          });
        }
      }
    }
  } catch (agentError) {
      console.warn('TinyFish agent navigation note:', agentError);
    }
  }

  return searchResults;
}
