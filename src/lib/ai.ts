import { buildDraftResponse, classifyTicket, scorePriority, type TicketCategory, type TicketPriority } from "@/lib/portal";

const DEFAULT_MODEL = "gpt-4o-mini";

function isTicketCategory(value: string): value is TicketCategory {
  return [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry",
  ].includes(value);
}

function isTicketPriority(value: string): value is TicketPriority {
  return ["Critical", "High", "Medium", "Low"].includes(value);
}

export async function getAiSuggestions(input: {
  subject: string;
  description: string;
  bookTitle?: string;
  authorName?: string;
}) {
  const fallbackCategory = classifyTicket(input.description, input.subject);
  const fallbackPriority = scorePriority(input.description, fallbackCategory);
  const fallbackDraft = buildDraftResponse({
    subject: input.subject,
    description: input.description,
    category: fallbackCategory,
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      category: fallbackCategory,
      priority: fallbackPriority,
      draft: fallbackDraft,
      source: "fallback",
    };
  }

  const knowledgeBase = [
    "BookLeaf Publishing is a self-publishing company operating in India and the US.",
    "We offer Standard Free and Bestseller Breakthrough premium packages.",
    "Royalties follow an 80/20 split: 80% of net profit goes to the author, 20% to BookLeaf.",
    "Net profit = MRP minus printing cost, platform commission, and shipping charges.",
    "Royalties are calculated quarterly and paid within 45 days of the quarter ending.",
    "Minimum payout threshold is ₹1,000. Smaller balances roll over to the next quarter.",
    "Every title receives a unique ISBN assigned by BookLeaf.",
    "In-house printing handles most orders; overflow goes to Repro India or Epitome Books.",
    "Production stages: Manuscript Received → Editing → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.",
    "Communication tone should be empathetic, specific, and solution-focused.",
  ].join("\n");

  const prompt = `You are a support triage assistant for BookLeaf Publishing.

BookLeaf knowledge base:
${knowledgeBase}

Ticket details:
- Subject: ${input.subject}
- Book title: ${input.bookTitle ?? "General / Account Level"}
- Author: ${input.authorName ?? "Author"}
- Description: ${input.description}

Return a JSON object with exactly these keys:
{
  "category": "Royalty & Payments" | "ISBN & Metadata Issues" | "Printing & Quality" | "Distribution & Availability" | "Book Status & Production Updates" | "General Inquiry",
  "priority": "Critical" | "High" | "Medium" | "Low",
  "draft": "A short empathetic support response matching BookLeaf tone"
}

Do not include markdown or extra fields.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a precise BookLeaf support triage assistant. Always respond with valid JSON matching the requested schema.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status})`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const parsed = JSON.parse(content) as {
      category?: string;
      priority?: string;
      draft?: string;
    };

    const category = isTicketCategory(parsed.category ?? "") ? parsed.category : fallbackCategory;
    const priority = isTicketPriority(parsed.priority ?? "") ? parsed.priority : fallbackPriority;
    const draft = typeof parsed.draft === "string" && parsed.draft.trim().length > 20
      ? parsed.draft.trim()
      : fallbackDraft;

    return { category, priority, draft, source: "ai" };
  } catch (error) {
    console.error("AI suggestion failed, using fallback logic:", error);
    return {
      category: fallbackCategory,
      priority: fallbackPriority,
      draft: fallbackDraft,
      source: "fallback",
    };
  }
}
