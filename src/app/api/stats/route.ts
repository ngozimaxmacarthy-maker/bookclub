import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  const totalBooks = await sql`SELECT COUNT(*) AS count FROM books WHERE status = 'completed'`;
  const avgRating = await sql`SELECT COALESCE(AVG(score), 0) AS avg FROM ratings`;
  const totalMeetings = await sql`SELECT COUNT(*) AS count FROM meetings`;
  const genreCounts = await sql`
    SELECT genre, COUNT(*) AS count FROM books
    WHERE genre IS NOT NULL AND status = 'completed'
    GROUP BY genre ORDER BY count DESC
  `;
  const topRated = await sql`
    SELECT b.title, b.author, AVG(r.score) AS avg_rating
    FROM books b JOIN ratings r ON r.book_id = b.id
    WHERE b.status = 'completed'
    GROUP BY b.id, b.title, b.author
    HAVING COUNT(r.id) >= 1
    ORDER BY avg_rating DESC
    LIMIT 5
  `;

  return NextResponse.json({
    totalBooksRead: Number(totalBooks[0].count),
    averageRating: Number(Number(avgRating[0].avg).toFixed(1)),
    totalMeetings: Number(totalMeetings[0].count),
    genreCounts,
    topRated,
  });
}
