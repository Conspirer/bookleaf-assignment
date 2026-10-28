
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Filter,
  Headphones,
  LayoutDashboard,
  Plus,
  Search,
  Send,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

import {
  authors,
  buildDraftResponse,
  type SupportTicket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/portal";

const money = (value: number | null) =>
  value == null ? "—" : `₹${value.toLocaleString("en-IN")}`;

const statusStyle: Record<string, string> = {
  Open: "bg-amber-50 text-amber-700",
  "In Progress": "bg-blue-50 text-blue-700",
  Resolved: "bg-emerald-50 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600",
};

const priorityStyle: Record<TicketPriority, string> = {
  Critical: "text-red-700 bg-red-50",
  High: "text-orange-700 bg-orange-50",
  Medium: "text-amber-700 bg-amber-50",
  Low: "text-slate-600 bg-slate-100",
};

type Session = {
  role: "admin" | "author";
  user: {
    id: string;
    name: string;
    email: string;
  };
};

const statusOptions: TicketStatus[] = ["Open", "In Progress", "Resolved", "Closed"];
const priorityOptions: TicketPriority[] = ["Critical", "High", "Medium", "Low"];

type BookSummary = (typeof authors)[number]["books"][number] & {
  authorName: string;
  authorId: string;
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [page, setPage] = useState("Overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    bookId: "",
  });
  const [draftReply, setDraftReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginState, setLoginState] = useState({
    role: "author" as "admin" | "author",
    email: authors[0].email,
    password: "bookleaf123",
  });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!session) return;

    const refreshTickets = async () => {
      const params = new URLSearchParams();
      if (session.role === "author") {
        params.set("authorId", session.user.id);
      }
      params.set("role", session.role);

      const response = await fetch(`/api/tickets?${params.toString()}`);
      if (!response.ok) return;

      const payload = (await response.json()) as { tickets?: SupportTicket[] };
      setTickets(payload.tickets ?? []);
    };

    void refreshTickets();
    const timer = window.setInterval(() => {
      void refreshTickets();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [session]);

  const currentAuthor = session && session.role === "author" ? authors.find((author) => author.author_id === session.user.id) : undefined;
  const authorBooks: BookSummary[] = currentAuthor
    ? currentAuthor.books.map((book) => ({
        ...book,
        authorName: currentAuthor.name,
        authorId: currentAuthor.author_id,
      }))
    : [];

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = [
        ticket.id,
        ticket.subject,
        ticket.bookTitle,
        ticket.category,
        authors.find((author) => author.author_id === ticket.authorId)?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;

      const matchesRole =
        session?.role === "admin" || ticket.authorId === session?.user.id;

      return matchesSearch && matchesStatus && matchesPriority && matchesRole;
    });
  }, [tickets, search, statusFilter, priorityFilter, session]);

  const selectedTicketData =
    tickets.find((ticket) => ticket.id === selectedTicket) ?? null;

  useEffect(() => {
    if (!selectedTicketData) {
      setDraftReply("");
      return;
    }
    setDraftReply(buildDraftResponse(selectedTicketData));
    setInternalNote(selectedTicketData.internalNote ?? "");
  }, [selectedTicketData]);

  const totalPending = authors.reduce(
    (sum, author) =>
      sum + author.books.reduce((bookTotal, book) => bookTotal + (book.royalty_pending ?? 0), 0),
    0
  );

  const publishedBooks = authors.reduce(
    (sum, author) =>
      sum + author.books.filter((book) => book.status === "Published & Live").length,
    0
  );

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "Open" || ticket.status === "In Progress"
  ).length;

  const allBooks: BookSummary[] = authors.flatMap((author) =>
    author.books.map((book) => ({
      ...book,
      authorName: author.name,
      authorId: author.author_id,
    }))
  );

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: loginState.role,
          email: loginState.email,
          password: loginState.password,
        }),
      });

      const payload = (await response.json()) as { user?: Session["user"]; error?: string };
      if (!response.ok || !payload.user) {
        setLoginError(payload.error ?? "Unable to sign in.");
        return;
      }

      setSession({
        role: loginState.role,
        user: payload.user,
      });
      setPage(loginState.role === "admin" ? "Overview" : "My Tickets");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || session.role !== "author") return;

    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorId: session.user.id,
        bookId: ticketForm.bookId || null,
        subject: ticketForm.subject,
        description: ticketForm.description,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error ?? "Unable to submit ticket.");
      return;
    }

    setTicketForm({ subject: "", description: "", bookId: "" });
    setShowNewTicket(false);
    setPage("My Tickets");
    setSelectedTicket(null);
    const nextResponse = await fetch(`/api/tickets?authorId=${session.user.id}&role=author`);
    const payload = (await nextResponse.json()) as { tickets?: SupportTicket[] };
    setTickets(payload.tickets ?? []);
  }

  async function handleAdminReply() {
    if (!selectedTicketData || !draftReply.trim()) return;

    const response = await fetch(`/api/tickets/${selectedTicketData.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response: draftReply,
        internalNote: internalNote || undefined,
        status: selectedTicketData.status,
      }),
    });

    if (!response.ok) {
      alert("Unable to send the admin reply.");
      return;
    }

    const payload = (await response.json()) as { ticket?: SupportTicket };
    setTickets((current) =>
      current.map((ticket) => (ticket.id === payload.ticket?.id ? payload.ticket! : ticket))
    );
  }

  async function handleAiSuggestion() {
    if (!selectedTicketData) return;

    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedTicketData.subject,
          description: selectedTicketData.description,
          bookTitle: selectedTicketData.bookTitle,
          authorName:
            authors.find((author) => author.author_id === selectedTicketData.authorId)?.name ??
            "Author",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "AI suggestion failed.");
      }

      const payload = (await response.json()) as {
        suggestion?: { category?: string; priority?: TicketPriority; draft?: string };
      };

      if (payload.suggestion?.draft) {
        setDraftReply(payload.suggestion.draft);
      }

      if (payload.suggestion?.priority && payload.suggestion?.category) {
        setTickets((current) =>
          current.map((ticket) =>
            ticket.id === selectedTicketData.id
              ? {
                  ...ticket,
                  priority: payload.suggestion!.priority as TicketPriority,
                  category: payload.suggestion!.category as SupportTicket["category"],
                }
              : ticket
          )
        );
      }
    } catch (error) {
      console.error("AI suggestion failed:", error);
      setDraftReply(buildDraftResponse(selectedTicketData));
    } finally {
      setAiLoading(false);
    }
  }

  async function handleStatusUpdate(ticketId: string, status: TicketStatus) {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) return;

    const payload = (await response.json()) as { ticket?: SupportTicket };
    setTickets((current) =>
      current.map((ticket) => (ticket.id === payload.ticket?.id ? payload.ticket! : ticket))
    );
  }

  const navItems =
    session?.role === "admin"
      ? [
          { name: "Overview", icon: LayoutDashboard },
          { name: "Ticket Queue", icon: Ticket },
          { name: "Book Catalog", icon: BookOpen },
          { name: "Authors", icon: Users },
        ]
      : [
          { name: "Overview", icon: LayoutDashboard },
          { name: "My Books", icon: BookOpen },
          { name: "My Tickets", icon: Ticket },
        ];

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">BookLeaf</div>
              <h1 className="text-xl font-semibold">Support Portal</h1>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setLoginState((current) => ({ ...current, role: "author" }))}
                className={`rounded-md px-3 py-2 text-sm font-medium ${loginState.role === "author" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                Author
              </button>
              <button
                type="button"
                onClick={() => setLoginState((current) => ({ ...current, role: "admin", email: "ops@bookleaf.com", password: "bookleaf-admin" }))}
                className={`rounded-md px-3 py-2 text-sm font-medium ${loginState.role === "admin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                Admin
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                value={loginState.email}
                onChange={(event) => setLoginState((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder={loginState.role === "admin" ? "ops@bookleaf.com" : authors[0].email}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={loginState.password}
                onChange={(event) => setLoginState((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
                placeholder={loginState.role === "admin" ? "bookleaf-admin" : "bookleaf123"}
              />
            </div>

            {loginError ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loginError}</div>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            Demo credentials: <br />
            Admin: ops@bookleaf.com / bookleaf-admin <br />
            Author: any sample author email / bookleaf123
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800 md:flex">
      <aside className="flex w-full shrink-0 flex-col bg-[#14243b] text-white md:min-h-screen md:w-64">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">BookLeaf</div>
            <div className="text-xs text-slate-400">Author Support Portal</div>
          </div>
        </div>

        <div className="px-4 pt-5">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">
            Workspace
          </div>
          <div className="space-y-1">
            {navItems.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => {
                  setPage(name);
                  setSelectedTicket(null);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  page === name ? "bg-blue-500/20 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {name}
                {name === "Ticket Queue" && (
                  <span className="ml-auto rounded-md bg-blue-500/20 px-2 py-0.5 text-xs text-blue-200">
                    {openTickets}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-white/10 px-4 pt-5">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">
            Signed in as
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-sm font-medium">
              {session.role === "admin" ? "Operations Team" : session.user.name}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{session.user.email}</div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <div>
            <div className="text-xs text-slate-400">Workspace / {page}</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              {selectedTicketData ? selectedTicketData.subject : page}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:flex">
              <Search size={16} className="text-slate-400" />
              <input
                aria-label="Search tickets"
                placeholder="Search tickets..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-36 text-sm outline-none"
              />
            </div>
            <button
              aria-label="Notifications"
              className="relative rounded-lg border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {session.role === "admin" ? "OP" : session.user.name.split(" ").map((part) => part[0]).join("")}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8">
          {selectedTicketData ? (
            <div className="space-y-5">
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-sm font-medium text-blue-700 hover:underline"
              >
                ← Back to tickets
              </button>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400">
                      {selectedTicketData.id} · {selectedTicketData.createdAt}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold">{selectedTicketData.subject}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {authors.find((author) => author.author_id === selectedTicketData.authorId)?.name} · {selectedTicketData.bookTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle[selectedTicketData.status]}`}
                    >
                      {selectedTicketData.status}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${priorityStyle[selectedTicketData.priority]}`}
                    >
                      {selectedTicketData.priority}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Author query
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                    {selectedTicketData.description}
                  </p>
                </div>

                {selectedTicketData.messages.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {selectedTicketData.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-xl border p-4 ${
                          message.senderRole === "admin"
                            ? "border-emerald-100 bg-emerald-50/50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {message.senderRole === "admin" ? "BookLeaf team" : "Author"}
                        </div>
                        <p className="text-sm leading-6 text-slate-700">{message.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {session.role === "admin" && (
                  <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm font-medium">
                        Status
                        <select
                          value={selectedTicketData.status}
                          onChange={(event) =>
                            void handleStatusUpdate(selectedTicketData.id, event.target.value as TicketStatus)
                          }
                          className="mt-2 block w-full rounded-lg border border-slate-200 bg-white p-3"
                        >
                          {statusOptions.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm font-medium">
                        Assigned to
                        <input
                          value={selectedTicketData.assignedTo ?? ""}
                          onChange={async (event) => {
                            await fetch(`/api/tickets/${selectedTicketData.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ assignedTo: event.target.value || null }),
                            });
                          }}
                          className="mt-2 block w-full rounded-lg border border-slate-200 bg-white p-3"
                          placeholder="ops-team"
                        />
                      </label>
                    </div>

                    <label className="block text-sm font-medium">
                      Internal note
                      <textarea
                        value={internalNote}
                        onChange={(event) => setInternalNote(event.target.value)}
                        rows={3}
                        placeholder="Visible only to BookLeaf staff"
                        className="mt-2 block w-full rounded-lg border border-slate-200 bg-white p-3"
                      />
                    </label>

                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                          AI-drafted response
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleAiSuggestion()}
                          disabled={aiLoading}
                          className="rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {aiLoading ? "Generating..." : "Generate with AI"}
                        </button>
                      </div>
                      <textarea
                        value={draftReply}
                        onChange={(event) => setDraftReply(event.target.value)}
                        rows={5}
                        className="w-full rounded-lg border border-blue-200 bg-white p-3 text-sm outline-none"
                      />
                    </div>

                    <button
                      onClick={() => void handleAdminReply()}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Send size={16} />
                      Send response
                    </button>
                  </div>
                )}
              </section>
            </div>
          ) : page === "Overview" ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {session.role === "admin" ? "Good evening, Operations Team" : `Welcome back, ${session.user.name.split(" ")[0]}`}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {session.role === "admin"
                      ? "Here’s what is happening across author support today."
                      : "Here is a snapshot of your publishing account."}
                  </p>
                </div>
                {session.role === "author" && (
                  <button
                    onClick={() => setShowNewTicket(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    New support ticket
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {(session.role === "admin"
                  ? [
                      { label: "Total authors", value: authors.length.toString(), icon: Users, note: "Sample dataset" },
                      { label: "Books published", value: publishedBooks.toString(), icon: BookOpen, note: "Published & Live" },
                      { label: "Open tickets", value: openTickets.toString(), icon: Ticket, note: "Needs attention" },
                      { label: "Pending royalties", value: money(totalPending), icon: Wallet, note: "Across all titles" },
                    ]
                  : [
                      { label: "My books", value: authorBooks.length.toString(), icon: BookOpen, note: "In your catalog" },
                      { label: "Copies sold", value: authorBooks.reduce((sum, book) => sum + book.total_copies_sold, 0).toLocaleString("en-IN"), icon: TrendingUp, note: "Across your books" },
                      { label: "Royalty pending", value: money(authorBooks.reduce((sum, book) => sum + book.royalty_pending, 0)), icon: Wallet, note: "Awaiting payout" },
                      { label: "My tickets", value: tickets.filter((ticket) => ticket.authorId === session.user.id).length.toString(), icon: Ticket, note: "Support history" },
                    ]
                ).map(({ label, value, icon: Icon, note }) => (
                  <section key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{label}</span>
                      <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        <Icon size={18} />
                      </div>
                    </div>
                    <div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div>
                    <div className="mt-1 text-xs text-slate-400">{note}</div>
                  </section>
                ))}
              </div>

              {session.role === "admin" && (
                <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                  <section className="rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                      <div>
                        <h3 className="font-semibold">Recent tickets</h3>
                        <p className="mt-1 text-xs text-slate-400">Latest author support requests</p>
                      </div>
                      <button onClick={() => setPage("Ticket Queue")} className="text-sm font-medium text-blue-600">
                        View queue <ChevronRight size={15} className="inline" />
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {tickets.slice(0, 4).map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket.id)}
                          className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{ticket.subject}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {ticket.id} · {authors.find((author) => author.author_id === ticket.authorId)?.name}
                            </div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs ${statusStyle[ticket.status]}`}>
                            {ticket.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                        <Sparkles size={18} />
                      </div>
                      <h3 className="font-semibold">AI support assistant</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      The assistant classifies new tickets, estimates priority, and drafts responses grounded in the BookLeaf knowledge base.
                    </p>
                    <div className="mt-5 space-y-3 text-sm">
                      {[
                        "Automatic ticket classification",
                        "Priority recommendations",
                        "Knowledge-base response drafts",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                      AI features are implemented with graceful fallbacks and a knowledge-base prompt layer, so support work continues even when the external model is unavailable.
                    </div>
                  </section>
                </div>
              )}

              <section className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="font-semibold">{session.role === "admin" ? "Book catalog snapshot" : "My books"}</h3>
                    <p className="mt-1 text-xs text-slate-400">Loaded from the provided dataset</p>
                  </div>
                  <button onClick={() => setPage(session.role === "admin" ? "Book Catalog" : "My Books")} className="text-sm font-medium text-blue-600">
                    View all <ChevronRight size={15} className="inline" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Book title</th>
                        {session.role === "admin" && <th className="px-5 py-3 font-medium">Author</th>}
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Copies sold</th>
                        <th className="px-5 py-3 font-medium">Royalty pending</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(session.role === "admin" ? allBooks : authorBooks).slice(0, 5).map((book) => (
                        <tr key={book.book_id} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <div className="font-medium">{book.title}</div>
                            <div className="mt-1 text-xs text-slate-400">{book.genre}</div>
                          </td>
                          {session.role === "admin" && <td className="px-5 py-4 text-slate-600">{book.authorName}</td>}
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs ${book.status === "Published & Live" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                              {book.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 tabular-nums">{book.total_copies_sold.toLocaleString("en-IN")}</td>
                          <td className="px-5 py-4 tabular-nums">{money(book.royalty_pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : page === "Ticket Queue" || page === "My Tickets" ? (
            <section className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h2 className="font-semibold">{page}</h2>
                  <p className="mt-1 text-xs text-slate-400">{filteredTickets.length} tickets found</p>
                </div>
                {session.role === "author" && (
                  <button
                    onClick={() => setShowNewTicket(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
                  >
                    <Plus size={16} />
                    New ticket
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <Filter size={15} className="text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="bg-transparent outline-none"
                    >
                      {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <AlertCircle size={15} className="text-slate-400" />
                    <select
                      value={priorityFilter}
                      onChange={(event) => setPriorityFilter(event.target.value)}
                      className="bg-transparent outline-none"
                    >
                      {['All', 'Critical', 'High', 'Medium', 'Low'].map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Ticket</th>
                      <th className="px-5 py-3 font-medium">Author</th>
                      <th className="px-5 py-3 font-medium">Category</th>
                      <th className="px-5 py-3 font-medium">Priority</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket.id)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium">{ticket.subject}</div>
                          <div className="mt-1 text-xs text-slate-400">{ticket.id} · {ticket.bookTitle}</div>
                        </td>
                        <td className="px-5 py-4">
                          {authors.find((author) => author.author_id === ticket.authorId)?.name}
                        </td>
                        <td className="px-5 py-4 text-xs">{ticket.category}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2 py-1 text-xs ${priorityStyle[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2 py-1 text-xs ${statusStyle[ticket.status]}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">{ticket.createdAt}</td>
                      </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                          <Ticket className="mx-auto mb-2" size={24} />
                          No tickets match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : page === "My Books" || page === "Book Catalog" ? (
            <section className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5">
                <h2 className="font-semibold">{page}</h2>
                <p className="mt-1 text-xs text-slate-400">Book and royalty records from the dataset</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Title / ISBN</th>
                      {session.role === "admin" && <th className="px-5 py-3 font-medium">Author</th>}
                      <th className="px-5 py-3 font-medium">Genre</th>
                      <th className="px-5 py-3 font-medium">MRP</th>
                      <th className="px-5 py-3 font-medium">Sold</th>
                      <th className="px-5 py-3 font-medium">Earned</th>
                      <th className="px-5 py-3 font-medium">Paid</th>
                      <th className="px-5 py-3 font-medium">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(session.role === "admin" ? allBooks : authorBooks).map((book) => (
                      <tr key={book.book_id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div className="font-medium">{book.title}</div>
                          <div className="mt-1 text-xs text-slate-400">{book.isbn}</div>
                          <div className="mt-1 text-xs text-slate-400">{book.publication_date}</div>
                        </td>
                        {session.role === "admin" && <td className="px-5 py-4">{book.authorName}</td>}
                        <td className="px-5 py-4">{book.genre}</td>
                        <td className="px-5 py-4">{money(book.mrp)}</td>
                        <td className="px-5 py-4">{book.total_copies_sold}</td>
                        <td className="px-5 py-4">{money(book.total_royalty_earned)}</td>
                        <td className="px-5 py-4">{money(book.royalty_paid)}</td>
                        <td className="px-5 py-4 font-medium">{money(book.royalty_pending)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Headphones className="mx-auto mb-3 text-blue-600" size={30} />
              <h2 className="font-semibold">Author directory</h2>
              <p className="mt-2 text-sm text-slate-500">
                The dataset contains {authors.length} authors. Select the Book Catalog to review their records.
              </p>
            </section>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-2 pb-2 text-xs text-slate-400">
            <span>BookLeaf Publishing · Support Portal</span>
            <span>Development preview · Sample dataset</span>
          </footer>
        </div>
      </main>

      {showNewTicket && session.role === "author" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Submit a support query</h2>
              <button aria-label="Close dialog" onClick={() => setShowNewTicket(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">Tell our team how we can help.</p>

            <form onSubmit={handleCreateTicket} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">
                Book
                <select
                  value={ticketForm.bookId}
                  onChange={(event) => setTicketForm((current) => ({ ...current, bookId: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 font-normal"
                >
                  <option value="">General / Account Level</option>
                  {authorBooks.map((book) => (
                    <option key={book.book_id} value={book.book_id}>{book.title}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Subject
                <input
                  required
                  value={ticketForm.subject}
                  onChange={(event) => setTicketForm((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="Briefly describe your issue"
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3 font-normal outline-none focus:border-blue-400"
                />
              </label>

              <label className="block text-sm font-medium">
                Description
                <textarea
                  required
                  value={ticketForm.description}
                  onChange={(event) => setTicketForm((current) => ({ ...current, description: event.target.value }))}
                  rows={5}
                  placeholder="Provide details that will help our team investigate..."
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3 font-normal outline-none focus:border-blue-400"
                />
              </label>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Send size={16} />
                Submit ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

