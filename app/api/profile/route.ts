import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.memberName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();
  const name = session.memberName;

  // My ratings with book info
  const myRatings = await sql`
    SELECT r.rating, r.review, r.created_at,
           b.id AS book_id, b.title, b.author, b.genre, b.cover_url
    FROM ratings r
    JOIN books b ON b.id = r.book_id
    WHERE r.member_name = ${name}
    ORDER BY r.created_at DESC
  `;

  // Past meetings I hosted or attended (all completed meetings with book info)
  const pastMeetings = await sql`
    SELECT m.id, m.scheduled_date, m.host_name, m.location, m.status,
           b.title AS book_title, b.author AS book_author, b.id AS book_id,
           (SELECT r.rating FROM ratings r WHERE r.book_id = m.book_id AND r.member_name = ${name}) AS my_rating
    FROM meetings m
    LEFT JOIN books b ON b.id = m.book_id
    ORDER BY m.scheduled_date DESC
  `;

  // Next hosting date
  const nextHosting = await sql`
    SELECT hr.member_name, hr.last_hosted_at, hr.sort_order, hr.opt_out
    FROM host_rotations hr
    WHERE hr.member_name = ${name}
    LIMIT 1
  `;

  // How many books I've rated
  const ratingStats = await sql`
    SELECT COUNT(*)::int AS total_rated,
           COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating
    FROM ratings
    WHERE member_name = ${name}
  `;

  // My nominations count
  const nomStats = await sql`
    SELECT COUNT(*)::int AS total_nominated
    FROM book_nominations
    WHERE nominated_by = ${name}
  `;

  return NextResponse.json({
    memberName: name,
    stats: {
      totalRated: ratingStats[0]?.total_rated || 0,
      avgRating: Number(ratingStats[0]?.avg_rating || 0),
      totalNominated: nomStats[0]?.total_nominated || 0,
    },
    myRatings,
    pastMeetings,
    nextHosting: nextHosting[0] || null,
  });
}
