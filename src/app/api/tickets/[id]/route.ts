import { NextResponse } from "next/server";
import { z } from "zod";

import { addTicketMessage, findTicket, updateTicket } from "@/lib/portal";
import { getSessionValueFromRequest } from "@/lib/session";

const patchSchema = z.object({
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]).optional(),
  assignedTo: z.string().nullable().optional(),
  internalNote: z.string().nullable().optional(),
  response: z.string().trim().min(3).max(5000).optional(),
  category: z.enum([
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry",
  ]).optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getSessionValueFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const json = await request.json();
    const parsed = patchSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid ticket update.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const ticket = findTicket(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    if (sessionUser.role === "author" && sessionUser.id !== ticket.authorId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const response = parsed.data.response;
    if (response) {
      addTicketMessage(id, "admin", response);
    }

    const updated = updateTicket(id, {
      status: parsed.data.status ?? ticket.status,
      assignedTo: parsed.data.assignedTo ?? ticket.assignedTo,
      internalNote: parsed.data.internalNote ?? ticket.internalNote,
      category: parsed.data.category ?? ticket.category,
      priority: parsed.data.priority ?? ticket.priority,
    });

    return NextResponse.json({ ticket: updated }, { status: 200 });
  } catch (error) {
    console.error("Ticket update route failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update ticket." },
      { status: 500 }
    );
  }
}
