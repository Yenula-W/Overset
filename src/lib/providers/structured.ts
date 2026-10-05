import { z } from 'zod';

// Keep output schemas static: private page data belongs in messages, not schemas.
const string = { type: 'string' };
const number = { type: 'number' };
const boolean = { type: 'boolean' };
const choice = (...values: string[]) => ({ type: 'string', enum: values });
const array = (items: object) => ({ type: 'array', items });
const object = (properties: Record<string, object>, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const box = object({ x: number, y: number, width: number, height: number });
export const OCR_OUTPUT = object({ regions: array(object({
  id: string, bounds: box, type: choice('dialogue','thought','narration','sfx','sign','label','title','background'), text: string,
  romanization: string, confidence: number, embeddedInArtwork: boolean,
  fontCategory: choice('serif','sans','handwritten','display'), fontWeight: choice('regular','bold'),
}, ['bounds','type','text','confidence','embeddedInArtwork'])) });
export const TRANSLATION_OUTPUT = object({ literal: string, recommended: string, alternatives: array(string), confidence: number,
  ambiguityNote: string, terminologyUsed: array(object({ original: string, translation: string })), culturalNote: string, romanization: string,
}, ['literal','recommended','alternatives','confidence','terminologyUsed']);
export const PROOFREAD_OUTPUT = object({ findings: array(object({ regionId: string,
  category: choice('meaning','grammar','phrasing','voice','tone','terminology','name','continuity','missing','duplicate','overflow','mistranslation','cultural'),
  severity: choice('critical','warning','info'), message: string, suggestion: string,
}, ['regionId','category','severity','message'])) });

export class AiResponseError extends Error {
  code: string; status: number;
  constructor(code: string, message: string, status = 502) { super(message); this.code = code; this.status = status; }
}

/** Validate before any save. Retry once, including truncated tool arguments. */
export async function structuredRequest<T>(options: {
  key: string; model: string; system: string; content: unknown[]; output: object;
  schema: z.ZodType<T>; fetcher?: typeof fetch;
}) {
  const started = Date.now();
  let inputTokens = 0, outputTokens = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      response = await (options.fetcher ?? fetch)('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': options.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({ model: options.model, max_tokens: attempt ? 16384 : 8192, system: `${options.system}\n\nAlways reply by calling the save_result tool exactly once.`,
          tools: [{ name: 'save_result', description: 'Return the complete comic localization result. This tool only formats the response; it does not execute a save.', strict: true, input_schema: options.output }],
          // Current models reject a forced tool choice, so the system prompt asks for save_result
          // and the retry below catches a reply without it. Low effort keeps thinking (billed as
          // output) small; reading and translating a page doesn't need long reasoning.
          tool_choice: { type: 'auto', disable_parallel_tool_use: true },
          output_config: { effort: 'low' },
          messages: [{ role: 'user', content: [...options.content, ...(attempt ? [{ type: 'text', text: 'The previous response was incomplete or failed validation. Return a complete save_result tool call. Use percentage coordinates (0–100), valid region types and confidence from 0 to 100. Omit optional fields when unavailable. Never invent unreadable text.' }] : [])] },
          ],
        }),
      });
    } catch {
      throw new AiResponseError('provider_timeout', 'Reading or translating this page timed out. Your saved work is safe; retry this page.', 504);
    }
    if (!response.ok) throw new AiResponseError(response.status === 429 ? 'provider_busy' : 'provider_error', response.status === 429 ? 'The AI provider is busy. Retry this page shortly.' : 'The AI provider could not process this page. Check the server key and model configuration.', response.status === 429 ? 429 : 502);
    const body = await response.json().catch(() => null);
    inputTokens += body?.usage?.input_tokens ?? 0; outputTokens += body?.usage?.output_tokens ?? 0;
    if (body?.stop_reason === 'refusal') throw new AiResponseError('provider_refusal', 'The AI could not read this page. Open the editor to enter its text manually.', 422);
    if (body?.stop_reason === 'max_tokens') continue;
    const block = body?.content?.find((b: { type: string; name?: string }) => b.type === 'tool_use' && b.name === 'save_result');
    const parsed = options.schema.safeParse(block?.input);
    if (parsed.success) return { data: parsed.data, inputTokens, outputTokens, model: options.model, latencyMs: Date.now() - started };
  }
  throw new AiResponseError('invalid_ai_output', 'The AI could not finish this page after an automatic retry. Your pages and edits are saved. Retry the saved chapter or open the editor.', 502);
}
