import { NextResponse } from "next/server";

import { authors } from "@/lib/portal";

export async function GET() {
  const books = authors.flatMap((author) =>
    author.books.map((book) => ({
      ...book,
      authorName: author.name,
      authorId: author.author_id,
    }))
  );

  return NextResponse.json({ books }, { status: 200 });
}
