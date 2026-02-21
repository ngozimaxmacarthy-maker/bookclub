import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const status = req.nextUrl.searchParams.get("status");

  let books;
  if (status) {
    books = await sql`
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(DISTINCT r.id) AS rating_count,
        COUNT(DISTINCT dq.id) AS question_count
      FROM books b
      LEFT JOIN ratings r ON r.book_id = b.id
      LEFT JOIN discussion_questions dq ON dq.book_id = b.id
      WHERE b.status = ${status}
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;
  } else {
    books = await sql`
      SELECT b.*,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(DISTINCT r.id) AS rating_count,
        COUNT(DISTINCT dq.id) AS question_count
      FROM books b
      LEFT JOIN ratings r ON r.book_id = b.id
      LEFT JOIN discussion_questions dq ON dq.book_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;
  }

  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { title, author, genre, coverUrl, libbyUrl, amazonUrl, kindleUrl, bookshopUrl } = body;

  if (!title || !author) {
    return NextResponse.json({ error: "Title and author required" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO books (title, author, genre, cover_url, libby_url, amazon_url, kindle_url, bookshop_url)
    VALUES (${title}, ${author}, ${genre || null}, ${coverUrl || null}, ${libbyUrl || null}, ${amazonUrl || null}, ${kindleUrl || null}, ${bookshopUrl || null})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
