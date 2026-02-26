"use client";

import useSWR, { mutate } from "swr";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className="star bg-transparent border-none p-0"
          style={{ color: s <= (hover || value) ? "var(--accent)" : "var(--border)" }}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          aria-label={`Rate ${s} stars`}
        >
          &#9733;
        </button>
      ))}
    </span>
  );
}

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: book, isLoading } = useSWR(id ? `/api/books/${id}` : null, fetcher);
  const { data: me } = useSWR("/api/auth/me", fetcher);

  const [newQuestion, setNewQuestion] = useState("");
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>;
  if (!book || book.error) return <div className="text-center py-12" style={{ color: "var(--danger)" }}>Book not found</div>;

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    await fetch(`/api/books/${id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion }),
    });
    setNewQuestion("");
    mutate(`/api/books/${id}`);
  }

  async function deleteQuestion(qId: string) {
    await fetch(`/api/books/${id}/questions?questionId=${qId}`, { method: "DELETE" });
    mutate(`/api/books/${id}`);
  }

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (!ratingScore) return;
    setSubmitting(true);
    await fetch(`/api/books/${id}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: ratingScore, review: ratingReview }),
    });
    setRatingScore(0);
    setRatingReview("");
    setSubmitting(false);
    mutate(`/api/books/${id}`);
  }

  async function deleteBook() {
    if (!confirm("Are you sure you want to delete this book?")) return;
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    router.push("/books");
  }

  const purchaseLinks = [
    { url: book.libby_url, label: "Borrow via Libby" },
    { url: book.amazon_url, label: "Buy on Amazon" },
    { url: book.kindle_url, label: "Buy on Kindle" },
    { url: book.bookshop_url, label: "Buy on Bookshop.org" },
  ].filter((l) => l.url);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/books" className="text-sm font-medium no-underline" style={{ color: "var(--primary)" }}>
        &larr; Back to Books
      </Link>

      {/* Book header */}
      <div className="card flex flex-col md:flex-row gap-6">
        <div
          className="w-32 h-44 rounded shadow flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: "var(--border)" }}
        >
          {book.cover_url ? (
            <img src={book.cover_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <svg className="w-10 h-10" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
            {book.title}
          </h1>
          <p className="text-lg mt-1" style={{ color: "var(--muted)" }}>by {book.author}</p>
          {book.genre && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{book.genre}</p>}
          <div className="flex items-center gap-2 mt-3">
            <span
              className="badge"
              style={{
                background: book.status === "current" ? "#ece0e6" : book.status === "completed" ? "#e4e4d2" : "#e8e8d6",
                color: book.status === "current" ? "#8f6278" : book.status === "completed" ? "#6e6f3a" : "#7a7b3f",
              }}
            >
              {book.status}
            </span>
            {Number(book.avg_rating) > 0 && (
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {Number(book.avg_rating).toFixed(1)} avg ({book.rating_count} rating{Number(book.rating_count) !== 1 ? "s" : ""})
              </span>
            )}
          </div>

          {/* Purchase links */}
          {purchaseLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {purchaseLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs no-underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          <button onClick={deleteBook} className="text-xs mt-4 bg-transparent border-none cursor-pointer underline" style={{ color: "var(--danger)" }}>
            Delete book
          </button>
        </div>
      </div>

      {/* Rate this book */}
      <div className="card">
        <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>Rate This Book</h2>
        <form onSubmit={submitRating} className="flex flex-col gap-3">
          <StarRating value={ratingScore} onChange={setRatingScore} />
          <textarea
            className="input"
            rows={2}
            placeholder="Write a short review (optional)"
            value={ratingReview}
            onChange={(e) => setRatingReview(e.target.value)}
          />
          <button type="submit" className="btn-primary text-sm self-start" disabled={submitting || !ratingScore}>
            Submit Rating
          </button>
        </form>
        {book.ratings?.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Ratings</h3>
            {book.ratings.map((r: { id: string; member_name: string; score: number; review: string }) => (
              <div key={r.id} className="p-2 rounded" style={{ background: "var(--background)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{r.member_name}</span>
                  <span className="text-xs" style={{ color: "var(--accent)" }}>
                    {"&#9733;".repeat(r.score)}
                  </span>
                </div>
                {r.review && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{r.review}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discussion questions */}
      <div className="card">
        <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>Discussion Questions</h2>
        {book.questions?.length > 0 ? (
          <ul className="flex flex-col gap-2 mb-4 list-none p-0">
            {book.questions.map((q: { id: string; question: string; submitted_by: string }) => (
              <li key={q.id} className="flex items-start justify-between gap-2 p-2 rounded" style={{ background: "var(--background)" }}>
                <div>
                  <p className="text-sm">{q.question}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>by {q.submitted_by}</p>
                </div>
                {me?.memberName === q.submitted_by && (
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-xs bg-transparent border-none cursor-pointer flex-shrink-0"
                    style={{ color: "var(--danger)" }}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>No discussion questions yet.</p>
        )}
        <form onSubmit={addQuestion} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Add a discussion question..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
          />
          <button type="submit" className="btn-primary text-sm">Add</button>
        </form>
      </div>
    </div>
  );
}
