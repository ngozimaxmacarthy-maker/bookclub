"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface Rating {
  id: string;
  memberName: string;
  rating: number;
  review: string | null;
}

interface Question {
  id: string;
  question: string;
  submittedBy: string;
}

interface ReviewLink {
  label: string;
  url: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  coverUrl: string | null;
  description: string | null;
  status: "CURRENT" | "UPCOMING" | "COMPLETED";
  libbySUrl: string | null;
  kindleUrl: string | null;
  amazonUrl: string | null;
  bookshopUrl: string | null;
  reviewLinks: string | null;
  ratings: Rating[];
  discussionQuestions: Question[];
}

function Stars({
  value,
  onSelect,
}: {
  value: number;
  onSelect?: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="star"
          style={{
            color:
              s <= (hover || value) ? "var(--accent)" : "var(--border)",
            cursor: onSelect ? "pointer" : "default",
          }}
          onMouseEnter={() => onSelect && setHover(s)}
          onMouseLeave={() => onSelect && setHover(0)}
          onClick={() => onSelect && onSelect(s)}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rating state
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Question state
  const [newQuestion, setNewQuestion] = useState("");
  const [qSubmitting, setQSubmitting] = useState(false);

  // Review link state
  const [newReviewLabel, setNewReviewLabel] = useState("");
  const [newReviewUrl, setNewReviewUrl] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Book>>({});

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.authenticated && setMemberName(d.name));
    loadBook();
  }, [id]);

  const loadBook = () => {
    fetch(`/api/books/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setBook(data);
          const myR = data.ratings.find(
            (r: Rating) => r.memberName === memberName
          );
          if (myR) {
            setMyRating(myR.rating);
            setMyReview(myR.review ?? "");
          }
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    if (book && memberName) {
      const myR = book.ratings.find((r) => r.memberName === memberName);
      if (myR) {
        setMyRating(myR.rating);
        setMyReview(myR.review ?? "");
      }
    }
  }, [book, memberName]);

  const submitRating = async () => {
    if (!myRating) return;
    setRatingSubmitting(true);
    await fetch(`/api/books/${id}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: myRating, review: myReview }),
    });
    setRatingSubmitting(false);
    loadBook();
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setQSubmitting(true);
    await fetch(`/api/books/${id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion }),
    });
    setQSubmitting(false);
    setNewQuestion("");
    loadBook();
  };

  const deleteQuestion = async (questionId: string) => {
    await fetch(`/api/books/${id}/questions?questionId=${questionId}`, {
      method: "DELETE",
    });
    loadBook();
  };

  const addReviewLink = async () => {
    if (!newReviewLabel.trim() || !newReviewUrl.trim()) return;
    const existing = book?.reviewLinks
      ? (JSON.parse(book.reviewLinks) as ReviewLink[])
      : [];
    const updated = [...existing, { label: newReviewLabel.trim(), url: newReviewUrl.trim() }];
    await fetch(`/api/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...book, reviewLinks: updated }),
    });
    setNewReviewLabel("");
    setNewReviewUrl("");
    setShowReviewForm(false);
    loadBook();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this book?")) return;
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    router.push("/books");
  };

  const handleEditSave = async () => {
    await fetch(`/api/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditing(false);
    loadBook();
  };

  if (loading)
    return (
      <div className="text-center py-20" style={{ color: "var(--muted)" }}>
        Loading…
      </div>
    );
  if (!book)
    return (
      <div className="text-center py-20" style={{ color: "var(--muted)" }}>
        Book not found.
      </div>
    );

  const reviewLinks: ReviewLink[] = book.reviewLinks
    ? (JSON.parse(book.reviewLinks) as ReviewLink[])
    : [];

  const avgRating =
    book.ratings.length > 0
      ? book.ratings.reduce((s, r) => s + r.rating, 0) / book.ratings.length
      : null;

  const BADGE_MAP: Record<string, string> = {
    CURRENT: "badge-current",
    UPCOMING: "badge-upcoming",
    COMPLETED: "badge-completed",
  };

  if (editing) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
          Edit Book
        </h1>
        <div className="card">
          <div className="grid md:grid-cols-2 gap-4">
            {(
              [
                { key: "title", label: "Title" },
                { key: "author", label: "Author" },
                { key: "genre", label: "Genre" },
                { key: "coverUrl", label: "Cover URL" },
                { key: "libbySUrl", label: "Libby URL" },
                { key: "kindleUrl", label: "Kindle URL" },
                { key: "amazonUrl", label: "Amazon URL" },
                { key: "bookshopUrl", label: "Bookshop.org URL" },
              ] as { key: keyof Book; label: string }[]
            ).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-semibold mb-1">{label}</label>
                <input
                  className="input"
                  value={(editForm[key] as string) ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, [key]: e.target.value })
                  }
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select
                className="input"
                value={editForm.status ?? "UPCOMING"}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value as Book["status"],
                  })
                }
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="CURRENT">Current</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Description</label>
              <textarea
                className="input"
                rows={4}
                value={(editForm.description as string) ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleEditSave} className="btn-primary">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-6">
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-32 h-44 object-cover rounded shadow flex-shrink-0"
          />
        ) : (
          <div
            className="w-32 h-44 rounded shadow flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--border)" }}
          >
            <svg className="w-10 h-10" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1
                className="text-3xl font-bold leading-tight font-serif"
                style={{ color: "var(--primary)" }}
              >
                {book.title}
              </h1>
              <p className="text-lg mt-1" style={{ color: "var(--muted)" }}>
                by {book.author}
              </p>
            </div>
            {memberName && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditForm({ ...book });
                    setEditing(true);
                  }}
                  className="btn-secondary text-sm py-1"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-danger text-sm py-1"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className={`badge ${BADGE_MAP[book.status]}`}>
              {book.status.charAt(0) + book.status.slice(1).toLowerCase()}
            </span>
            {book.genre && (
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {book.genre}
              </span>
            )}
          </div>
          {avgRating !== null && (
            <div className="mt-2 flex items-center gap-2">
              <Stars value={avgRating} />
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                ({book.ratings.length} rating{book.ratings.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}
          {book.description && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {book.description}
            </p>
          )}
        </div>
      </div>

      {/* Get the Book */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--primary)" }}>
          Get This Book
        </h2>
        <div className="flex flex-wrap gap-3">
          {book.libbySUrl && (
            <a
              href={book.libbySUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              Borrow via Libby
            </a>
          )}
          {book.amazonUrl && (
            <a
              href={book.amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              Buy on Amazon
            </a>
          )}
          {book.kindleUrl && (
            <a
              href={book.kindleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              Buy on Kindle
            </a>
          )}
          {book.bookshopUrl && (
            <a
              href={book.bookshopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              Buy on Bookshop.org
            </a>
          )}
          {!book.libbySUrl && !book.amazonUrl && !book.kindleUrl && !book.bookshopUrl && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No links added yet.{" "}
              {memberName && (
                <button
                  className="underline"
                  style={{ color: "var(--primary)" }}
                  onClick={() => {
                    setEditForm({ ...book });
                    setEditing(true);
                  }}
                >
                  Add links
                </button>
              )}
            </p>
          )}
        </div>
      </div>

      {/* External Reviews */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: "var(--primary)" }}>
            External Reviews
          </h2>
          {memberName && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="btn-secondary text-sm py-1"
            >
              + Add Link
            </button>
          )}
        </div>

        {showReviewForm && (
          <div className="flex gap-2 mb-4">
            <input
              className="input flex-1"
              placeholder="Label (e.g. NPR Review)"
              value={newReviewLabel}
              onChange={(e) => setNewReviewLabel(e.target.value)}
            />
            <input
              className="input flex-1"
              type="url"
              placeholder="https://..."
              value={newReviewUrl}
              onChange={(e) => setNewReviewUrl(e.target.value)}
            />
            <button onClick={addReviewLink} className="btn-primary text-sm">
              Add
            </button>
          </div>
        )}

        {reviewLinks.length > 0 ? (
          <ul className="space-y-1">
            {reviewLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                  style={{ color: "var(--primary)" }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No review links yet.
          </p>
        )}
      </div>

      {/* Member Ratings */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--primary)" }}>
          Ratings & Reviews
        </h2>

        {/* My rating form */}
        {memberName && (
          <div className="mb-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-semibold mb-2">Your rating:</p>
            <Stars value={myRating} onSelect={setMyRating} />
            <textarea
              className="input mt-2"
              rows={2}
              placeholder="Write a short review (optional)…"
              value={myReview}
              onChange={(e) => setMyReview(e.target.value)}
            />
            <button
              onClick={submitRating}
              className="btn-primary text-sm mt-2"
              disabled={!myRating || ratingSubmitting}
            >
              {ratingSubmitting ? "Saving…" : "Save Rating"}
            </button>
          </div>
        )}

        {book.ratings.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No ratings yet. Be the first!
          </p>
        ) : (
          <div className="space-y-3">
            {book.ratings.map((r) => (
              <div
                key={r.id}
                className="flex gap-3 items-start"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: "var(--primary)" }}
                >
                  {r.memberName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{r.memberName}</span>
                    <Stars value={r.rating} />
                  </div>
                  {r.review && (
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                      {r.review}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discussion Questions */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--primary)" }}>
          Discussion Questions
        </h2>

        {memberName && (
          <form onSubmit={submitQuestion} className="flex gap-2 mb-4">
            <input
              className="input flex-1"
              placeholder="Submit a discussion question…"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary text-sm"
              disabled={qSubmitting}
            >
              {qSubmitting ? "…" : "Add"}
            </button>
          </form>
        )}

        {book.discussionQuestions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No questions yet. Add one above!
          </p>
        ) : (
          <ol className="list-decimal list-inside space-y-2">
            {book.discussionQuestions.map((q) => (
              <li key={q.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <span>{q.question}</span>
                  <span
                    className="text-xs ml-2"
                    style={{ color: "var(--muted)" }}
                  >
                    — {q.submittedBy}
                  </span>
                </div>
                {memberName === q.submittedBy && (
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-xs flex-shrink-0"
                    style={{ color: "var(--danger)" }}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
