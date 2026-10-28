import { NextResponse } from "next/server";
import { z } from "zod";

import { getAiSuggestions } from "@/lib/ai";

const suggestionSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  bookTitle: z.string().trim().max(160).optional(),
  authorName: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = suggestionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid suggestion request.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const suggestion = await getAiSuggestions(parsed.data);
    return NextResponse.json({ suggestion }, { status: 200 });
  } catch (error) {
    console.error("AI suggestion endpoint failed:", error);
    return NextResponse.json(
      { error: "Unable to generate a suggestion right now." },
      { status: 500 }
    );
  }
}
