import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();

  const books = await sql`
    SELECT b.*,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS rating_count
    FROM books b
    LEFT JOIN ratings r ON r.book_id = b.id
    WHERE b.id = ${id}
    GROUP BY b.id
  `;

  if (!books.length) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const questions = await sql`
    SELECT * FROM discussion_questions WHERE book_id = ${id} ORDER BY created_at ASC
  `;

  const ratings = await sql`
    SELECT * FROM ratings WHERE book_id = ${id} ORDER BY created_at DESC
  `;

  return NextResponse.json({ ...books[0], questions, ratings });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { title, author, genre, status, coverUrl, libbyUrl, amazonUrl, kindleUrl, bookshopUrl } = body;
  const sql = getDb();

  const rows = await sql`
    UPDATE books SET
      title = COALESCE(${title || null}, title),
      author = COALESCE(${author || null}, author),
      genre = COALESCE(${genre || null}, genre),
      status = COALESCE(${status || null}, status),
      cover_url = COALESCE(${coverUrl || null}, cover_url),
      libby_url = COALESCE(${libbyUrl || null}, libby_url),
      amazon_url = COALESCE(${amazonUrl || null}, amazon_url),
      kindle_url = COALESCE(${kindleUrl || null}, kindle_url),
      bookshop_url = COALESCE(${bookshopUrl || null}, bookshop_url)
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();
  await sql`DELETE FROM books WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
