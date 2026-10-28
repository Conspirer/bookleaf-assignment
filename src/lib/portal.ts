import sampleData from "@/data/bookleaf_sample_data.json";

export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "Critical" | "High" | "Medium" | "Low";
export type TicketCategory =
  | "Royalty & Payments"
  | "ISBN & Metadata Issues"
  | "Printing & Quality"
  | "Distribution & Availability"
  | "Book Status & Production Updates"
  | "General Inquiry";

export type Author = {
  author_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joined_date: string;
  books: Array<{
    book_id: string;
    title: string;
    isbn: string;
    genre: string;
    publication_date: string;
    status: string;
    mrp: number;
    author_royalty_per_copy: number;
    total_copies_sold: number;
    total_royalty_earned: number;
    royalty_paid: number;
    royalty_pending: number;
    last_royalty_payout_date: string | null;
    print_partner: string;
    available_on: string[];
  }>;
};

export type TicketMessage = {
  id: string;
  senderRole: "author" | "admin";
  message: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  authorId: string;
  bookId?: string | null;
  bookTitle: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string | null;
  internalNote?: string | null;
  messages: TicketMessage[];
};

export type AuthUser = {
  id: string;
  role: "admin" | "author";
  name: string;
  email: string;
};

export const authors = sampleData.authors as Author[];

export const ticketCategories: TicketCategory[] = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

export const knowledgeBase = {
  company: "BookLeaf Publishing is a self-publishing company operating in India and the US.",
  pricing: "We offer Standard Free and Bestseller Breakthrough premium packages.",
  royaltyRule: "BookLeaf follows an 80/20 royalty split: 80% of net profit goes to the author, 20% to BookLeaf.",
  netProfit: "Net profit = MRP minus printing cost, platform commission, and shipping charges.",
  paymentCycle: "Royalties are calculated quarterly and paid within 45 days of the quarter ending.",
  minThreshold: "The minimum payment threshold is ₹1,000; smaller balances roll over to the next quarter.",
  isbnPolicy: "Every book gets a unique ISBN assigned by BookLeaf; ISBNs are registered under BookLeaf’s publisher imprint.",
  printingPolicy: "In-house printing handles most orders; overflow goes to Repro India or Epitome Books.",
  productionStages: "Production stages: Manuscript Received → Editing → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.",
  communicationTone:
    "We communicate with empathy, acknowledge the concern first, provide specific timelines, and end with a clear next step.",
};

const ticketStore: SupportTicket[] = [
  {
    id: "BL-1001",
    authorId: "AUTH003",
    bookId: "BK005",
    bookTitle: "Between Two Temples",
    subject: "Royalty payout clarification",
    description: "I have not received my accumulated royalties. Could you please check my payout?",
    category: "Royalty & Payments",
    priority: "High",
    status: "Open",
    createdAt: "2026-10-27",
    updatedAt: "2026-10-27",
    assignedTo: null,
    internalNote: null,
    messages: [
      {
        id: "MSG-1001",
        senderRole: "author",
        message: "I have not received my accumulated royalties. Could you please check my payout?",
        createdAt: "2026-10-27T09:15:00.000Z",
      },
    ],
  },
  {
    id: "BL-1002",
    authorId: "AUTH007",
    bookId: "BK011",
    bookTitle: "The Algorithm of Love",
    subject: "Book unavailable on Amazon",
    description: "My book is showing as unavailable on the platform.",
    category: "Distribution & Availability",
    priority: "Medium",
    status: "In Progress",
    createdAt: "2026-10-26",
    updatedAt: "2026-10-26",
    assignedTo: "ops-team",
    internalNote: "Likely stock sync issue; re-sync requested.",
    messages: [
      {
        id: "MSG-1002",
        senderRole: "author",
        message: "My book is showing as unavailable on the platform.",
        createdAt: "2026-10-26T08:05:00.000Z",
      },
    ],
  },
  {
    id: "BL-1003",
    authorId: "AUTH001",
    bookId: "BK001",
    bookTitle: "Whispers of the Ganges",
    subject: "Update book description",
    description: "I would like to update my book description on the listing.",
    category: "General Inquiry",
    priority: "Low",
    status: "Resolved",
    createdAt: "2026-10-24",
    updatedAt: "2026-10-24",
    assignedTo: "ops-team",
    internalNote: null,
    messages: [
      {
        id: "MSG-1003",
        senderRole: "author",
        message: "I would like to update my book description on the listing.",
        createdAt: "2026-10-24T11:45:00.000Z",
      },
      {
        id: "MSG-1004",
        senderRole: "admin",
        message: "You can submit metadata changes through the dashboard. Updates typically reflect within 3–5 business days.",
        createdAt: "2026-10-24T12:15:00.000Z",
      },
    ],
  },
  {
    id: "BL-1004",
    authorId: "AUTH002",
    bookId: "BK004",
    bookTitle: "Startup Sutra",
    subject: "Royalty amount looks too low",
    description: "I sold 200 copies but only received ₹3,000. Can you explain why?",
    category: "Royalty & Payments",
    priority: "High",
    status: "Open",
    createdAt: "2026-10-20",
    updatedAt: "2026-10-20",
    assignedTo: null,
    internalNote: null,
    messages: [
      {
        id: "MSG-1005",
        senderRole: "author",
        message: "I sold 200 copies but only received ₹3,000. Can you explain why?",
        createdAt: "2026-10-20T07:30:00.000Z",
      },
    ],
  },
];

export function getAuthorByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return authors.find((author) => author.email.toLowerCase() === normalized);
}

export function getAuthorById(authorId: string) {
  return authors.find((author) => author.author_id === authorId);
}

export function getBooksForAuthor(authorId: string) {
  const author = getAuthorById(authorId);
  return author ? author.books : [];
}

export function listTickets(authorId?: string) {
  const next = [...ticketStore].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (!authorId) {
    return next;
  }

  return next.filter((ticket) => ticket.authorId === authorId);
}

export function findTicket(ticketId: string) {
  return ticketStore.find((ticket) => ticket.id === ticketId);
}

export function classifyTicket(description: string, subject: string) {
  const text = `${subject} ${description}`.toLowerCase();

  if (/(royalty|payout|payment|commission|invoice|paid|royalties)/.test(text)) {
    return "Royalty & Payments" as const;
  }
  if (/(isbn|metadata|amazon.*isbn|wrong isbn|duplicate isbn|wrong.*book)/.test(text)) {
    return "ISBN & Metadata Issues" as const;
  }
  if (/(print|quality|misprint|binding|blurry|reprint|color|pages|misaligned)/.test(text)) {
    return "Printing & Quality" as const;
  }
  if (/(unavailable|distribution|stock sync|flipkart|amazon.*unavailable|listing|platform)/.test(text)) {
    return "Distribution & Availability" as const;
  }
  if (/(production|typesetting|proofreading|cover|editing|publishing|status|delay)/.test(text)) {
    return "Book Status & Production Updates" as const;
  }

  return "General Inquiry" as const;
}

export function scorePriority(description: string, category: TicketCategory) {
  const text = description.toLowerCase();

  if (
    /six months|not received.*royalty|no royalty|overdue|duplicate isbn|wrong isbn|serious|urgent|critical/i.test(text) ||
    category === "ISBN & Metadata Issues"
  ) {
    return "Critical" as const;
  }

  if (
    /(royalty|payout|payment|unavailable|print quality|misprint|blurry|binding|delay|typesetting)/i.test(text) ||
    category === "Royalty & Payments" ||
    category === "Printing & Quality"
  ) {
    return "High" as const;
  }

  if (/(description|update|metadata|status|proof|platform)/i.test(text)) {
    return "Medium" as const;
  }

  return "Low" as const;
}

export function buildDraftResponse(ticket: Pick<SupportTicket, "subject" | "description" | "category">) {
  const authorName = "Author";
  const category = ticket.category;
  const description = ticket.description;

  if (category === "Royalty & Payments") {
    return `Hi ${authorName}, thank you for raising this. I understand the concern around your royalty payout and appreciate your patience. BookLeaf calculates royalties quarterly and pays within 45 days of the quarter ending, with a minimum payout threshold of ₹1,000. If your earnings are below this threshold, the balance rolls over to the next cycle. I’ll review the payout status and bank details linked to your account, and if this is a genuine delay we will escalate it within 48 hours. Please keep an eye on your dashboard for the next royalty update, and our team will share the detailed breakdown as soon as the review is complete.`;
  }

  if (category === "ISBN & Metadata Issues") {
    return `Hi ${authorName}, thanks for flagging this. A mismatch in ISBN or metadata is a serious publishing issue, and I’m escalating it to our production team immediately. BookLeaf assigns the ISBN for each title and we treat duplicate or wrong ISBN issues as high-priority production defects. Our team will review the record and confirm a resolution timeline within 48 hours. Please share any screenshots or proof points you have, and we’ll keep the issue moving until it is corrected.`;
  }

  if (category === "Printing & Quality") {
    return `Hi ${authorName}, I’m sorry to hear about the print quality issue. We take defects like misprints, blurry images, or binding problems seriously. Please share photos of the defective copies so our team can verify the issue and arrange a free reprint if needed. Our standard turnaround for reprints is 5–7 business days once the issue is confirmed. We appreciate your patience and will guide you through the next step as soon as we receive the images.`;
  }

  if (category === "Distribution & Availability") {
    return `Hi ${authorName}, thanks for flagging this. A book showing as unavailable on a marketplace is usually caused by a stock sync issue, and our distribution team can typically re-sync it within 24–48 hours. We’ll trigger a re-sync and check whether the listing needs a refresh on the platform. Please allow the next 24–48 hours for the listing to update, and we’ll keep you posted if any further action is needed.`;
  }

  if (category === "Book Status & Production Updates") {
    return `Hi ${authorName}, thank you for your patience. I can see that the issue involves the production timeline for your title. The production flow includes Manuscript Received, Editing, Cover Design, Typesetting, Proofreading, ISBN Assignment, Printing, and Distribution Setup. If there is a delay, we will confirm the current stage and expected next milestone rather than leaving you uncertain. We’ll review the status with the production team and follow up with the estimated timeline within 48 hours.`;
  }

  return `Hi ${authorName}, thank you for reaching out. I’ve reviewed your query and I can help guide you through the next step. As part of our standard support process, we’ll review the specific account or metadata need and confirm what action is required. If the issue requires a platform update, book record change, or escalation, we will communicate the exact timeline and next action with you. Please share any screenshots or references you have so we can resolve this efficiently.`;
}

export function createTicket(args: {
  authorId: string;
  bookId?: string | null;
  subject: string;
  description: string;
}) {
  const author = getAuthorById(args.authorId);
  if (!author) {
    throw new Error("Author not found.");
  }

  const category = classifyTicket(args.description, args.subject);
  const priority = scorePriority(args.description, category);
  const book = args.bookId ? author.books.find((entry) => entry.book_id === args.bookId) : undefined;
  const now = new Date().toISOString();

  const ticket: SupportTicket = {
    id: `BL-${Math.floor(Math.random() * 9000) + 1000}`,
    authorId: author.author_id,
    bookId: args.bookId ?? null,
    bookTitle: book?.title ?? "General / Account Level",
    subject: args.subject.trim(),
    description: args.description.trim(),
    category,
    priority,
    status: "Open",
    createdAt: now.slice(0, 10),
    updatedAt: now,
    assignedTo: null,
    internalNote: null,
    messages: [
      {
        id: `MSG-${Math.floor(Math.random() * 9000) + 1000}`,
        senderRole: "author",
        message: args.description.trim(),
        createdAt: now,
      },
    ],
  };

  ticketStore.unshift(ticket);
  return ticket;
}

export function updateTicket(ticketId: string, updates: Partial<SupportTicket>) {
  const ticket = findTicket(ticketId);
  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  Object.assign(ticket, updates, { updatedAt: new Date().toISOString() });
  return ticket;
}

export function addTicketMessage(ticketId: string, senderRole: "author" | "admin", message: string) {
  const ticket = findTicket(ticketId);
  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  const nextMessage: TicketMessage = {
    id: `MSG-${Math.floor(Math.random() * 90000) + 1000}`,
    senderRole,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  ticket.messages.push(nextMessage);
  ticket.updatedAt = new Date().toISOString();
  if (senderRole === "admin" && ticket.status === "Open") {
    ticket.status = "In Progress";
  }

  return nextMessage;
}

export function authenticateUser(role: "admin" | "author", email: string, password: string) {
  if (role === "admin") {
    const valid = email.toLowerCase() === "ops@bookleaf.com" && password === "bookleaf-admin";
    if (!valid) return null;
    return {
      id: "admin-ops",
      role: "admin",
      name: "Operations Team",
      email,
    } satisfies AuthUser;
  }

  const author = getAuthorByEmail(email);
  const valid = !!author && password === "bookleaf123";
  if (!valid) return null;

  return {
    id: author.author_id,
    role: "author",
    name: author.name,
    email: author.email,
  } satisfies AuthUser;
}
