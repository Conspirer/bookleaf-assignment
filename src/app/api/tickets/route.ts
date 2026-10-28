import { NextResponse } from "next/server";
import { z } from "zod";

import { createTicket, getAuthorById, listTickets } from "@/lib/portal";
import { getSessionValueFromRequest } from "@/lib/session";

const ticketSchema = z.object({
  authorId: z.string().min(1),
  bookId: z.string().nullable().optional(),
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  category: z
    .enum([
      "Royalty & Payments",
      "ISBN & Metadata Issues",
      "Printing & Quality",
      "Distribution & Availability",
      "Book Status & Production Updates",
      "General Inquiry",
    ])
    .optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
});

export async function GET(request: Request) {
  try {
    const sessionUser = getSessionValueFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const authorIdParam = searchParams.get("authorId");
    const role = searchParams.get("role");

    if (sessionUser.role === "author" && sessionUser.id !== authorIdParam) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const authorId = authorIdParam ?? (sessionUser.role === "author" ? sessionUser.id : undefined);
    const tickets = listTickets(authorId).filter((ticket) => {
      if (sessionUser.role === "admin" || role !== "author") {
        return true;
      }
      return ticket.authorId === sessionUser.id;
    });

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    console.error("Ticket GET route failed:", error);
    return NextResponse.json(
      { error: "Unable to load tickets." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = getSessionValueFromRequest(request);
    if (!sessionUser || sessionUser.role !== "author") {
      return NextResponse.json({ error: "Author access required." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ticketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid ticket details.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const author = getAuthorById(input.authorId);
    if (!author) {
      return NextResponse.json({ error: "Author not found." }, { status: 404 });
    }

    if (sessionUser.id !== input.authorId) {
      return NextResponse.json({ error: "You can only create tickets for your own account." }, { status: 403 });
    }

    if (input.bookId) {
      const isAuthorBook = author.books.some((book) => book.book_id === input.bookId);
      if (!isAuthorBook) {
        return NextResponse.json(
          { error: "The selected book does not belong to this author." },
          { status: 400 }
        );
      }
    }

    const ticket = createTicket({
      authorId: input.authorId,
      bookId: input.bookId ?? null,
      subject: input.subject,
      description: input.description,
    });

    if (input.category) {
      ticket.category = input.category;
    }

    if (input.priority) {
      ticket.priority = input.priority;
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Ticket create route failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create ticket." },
      { status: 500 }
    );
  }
}
