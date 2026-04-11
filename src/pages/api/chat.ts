export const prerender = false;

import type { APIRoute } from 'astro';

const PAGE_SCHEMAS: Record<string, string> = {
  'h1b': `
Page: H1B Sponsors Database (2,200+ companies)
Available filter fields in your JSON "filters" object:
- search: string (company name or sector keyword)
- likelihood: array from ["Very High","High","Medium","Low"]
- sectors: array of sector names (e.g. ["Fintech","Enterprise Software","Healthcare"])
- fortune500: boolean
- analystsPick: boolean
- publiclyTraded: boolean
- pageSize: 10 | 15 | 25
`,
  'private-markets': `
Page: Private Markets (4,200+ privately listed companies)
Available filter fields in your JSON "filters" object:
- search: string (company name or sector keyword)
- sectors: array of sector names (e.g. ["Enterprise Software","Consumer","Fintech"])
- rounds: array of funding rounds (e.g. ["Series A","Series B","Series C","Series Seed"])
- pageSize: 10 | 15 | 25
`,
  'vc-portfolios': `
Page: VC and Accelerator Directory
Available filter fields in your JSON "filters" object:
- search: string (firm name)
- type: "VC" | "accelerator" | "all"
`,
  'home': `
Page: Home (overview). Suggest the user visit a specific section.
No filter fields available on this page.
`,
  'resources': `
Page: Resources (jobseeker tools). No dynamic filtering on this page.
Suggest relevant resource categories.
`,
};

const SYSTEM_PROMPT = (pageSchema: string) => `You are CareerNext AI, a smart assistant built into a career intelligence platform for jobseekers.

${pageSchema}

Instructions:
- Parse the user's natural language request and return ONLY a valid JSON object.
- Include a "response" key with a short, friendly message (no em-dashes, no asterisks).
- Include a "filters" key with any filter values to apply (omit keys that should not change).
- If the user asks a general career question, answer helpfully in "response" and use an empty "filters" object.
- Keep responses concise and direct.

Response format (JSON only, no markdown):
{
  "response": "...",
  "filters": { ... }
}`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { messages, page } = body as {
      messages: Array<{ role: string; content: string }>;
      page: string;
    };

    const apiKey = import.meta.env.DEEPSEEK_API_KEY;
    const baseUrl = import.meta.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const model = import.meta.env.DEEPSEEK_MODEL || 'deepseek-chat';

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const schema = PAGE_SCHEMAS[page] ?? PAGE_SCHEMAS['home'];

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT(schema) },
          ...messages,
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 512,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('DeepSeek error:', errText);
      return new Response(
        JSON.stringify({ error: 'AI service unavailable. Please try again.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';

    let parsed: { response?: string; filters?: Record<string, unknown> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { response: raw, filters: {} };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
