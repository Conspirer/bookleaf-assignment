import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";


function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase server configuration missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  try {
    const db = getDb();
    const { data, error } = await db
      .from("tickets")
      .select("*, authors(name,email), books(title), ticket_messages(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load tickets" },
      { status: 500 },
    );
  }
}

const ticketSchema = z.object({
  author_id: z.string().min(1),
  book_id: z.string().nullable().optional(),
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(5000),
  category: z.enum([
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry",
  ]).default("General Inquiry"),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).default("Medium"),
});

export async function POST(request: Request) {
  try {
    const parsed = ticketSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid ticket details", details: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const input = parsed.data;

    const { data: author, error: authorError } = await db
      .from("authors")
      .select("author_id")
      .eq("author_id", input.author_id)
      .maybeSingle();

    if (authorError || !author) {
      return NextResponse.json({ error: "Author not found" }, { status: 400 });
    }

    const { data, error } = await db
      .from("tickets")
      .insert(input)
      .select()
      .single();

    if (error) throw error;

    const { error: messageError } = await db.from("ticket_messages").insert({
      ticket_id: data.id,
      sender_role: "author",
      message: input.description,
    });

    if (messageError) throw messageError;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create ticket" },
      { status: 500 },
    );
  }
}