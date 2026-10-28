
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase URL or secret key in .env.local");
}

const supabase = createClient(url, key);
const data = JSON.parse(
  fs.readFileSync("src/data/bookleaf_sample_data.json", "utf8")
);

async function seed() {
  const authors = data.authors.map(({ books, ...author }) => author);
  const books = data.authors.flatMap((author) =>
    author.books.map((book) => ({
      ...book,
      author_id: author.author_id,
    }))
  );

  const { error: authorError } = await supabase
    .from("authors")
    .upsert(authors, { onConflict: "author_id" });

  if (authorError) throw authorError;

  const { error: bookError } = await supabase
    .from("books")
    .upsert(books, { onConflict: "book_id" });

  if (bookError) throw bookError;

  console.log(`Imported ${authors.length} authors and ${books.length} books.`);
}

seed().catch((error) => {
  console.error("Import failed:", error.message);
  process.exit(1);
});
