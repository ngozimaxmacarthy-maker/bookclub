"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  coverUrl: string | null;
  description: string | null;
  status: "CURRENT" | "UPCOMING" | "COMPLETED";
  ratings: { rating: number }[];
  _count: { discussionQuestions: number };
}

function avgRating(ratings: { rating: number }[]) {
  if (!ratings.length) return null;
  return ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
}

function Stars({ val }: { val: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(val) ? "var(--accent)" : "#d1c4b0" }}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs" style={{ color: "var(--muted)" }}>
        {val.toFixed(1)}
      </span>
    </span>
  );
}

const TABS = ["ALL", "CURRENT", "UPCOMING", "COMPLETED"] as const;
type Tab = (typeof TABS)[number];

const BADGE_MAP: Record<string, string> = {
  CURRENT: "badge-current",
  UPCOMING: "badge-upcoming",
  COMPLETED: "badge-completed",
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [tab, setTab] = useState<Tab>("ALL");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: "",
    description: "",
    coverUrl: "",
    status: "UPCOMING",
    libbySUrl: "",
    kindleUrl: "",
    amazonUrl: "",
    bookshopUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [memberName, setMemberName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.authenticated && setMemberName(d.name));
    loadBooks();
  }, []);

  const loadBooks = () => {
    setLoading(true);
    fetch("/api/books")
      .then((r) => r.json())
      .then((data) => {
        setBooks(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  const filtered =
    tab === "ALL" ? books : books.filter((b) => b.status === tab);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({
      title: "",
      author: "",
      genre: "",
      description: "",
      coverUrl: "",
      status: "UPCOMING",
      libbySUrl: "",
      kindleUrl: "",
      amazonUrl: "",
      bookshopUrl: "",
    });
    loadBooks();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: "var(--primary)" }}>
          Books
        </h1>
        {memberName && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "+ Add Book"}
          </button>
        )}
      </div>

      {/* Add Book Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--primary)" }}>
            Add a Book
          </h2>
          <form onSubmit={handleAddBook} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Author *</label>
              <input
                className="input"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Genre</label>
              <input
                className="input"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
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
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Cover Image URL</label>
              <input
                className="input"
                type="url"
                value={form.coverUrl}
                onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Libby URL</label>
              <input
                className="input"
                type="url"
                value={form.libbySUrl}
                onChange={(e) => setForm({ ...form, libbySUrl: e.target.value })}
                placeholder="https://libbyapp.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Amazon URL</label>
              <input
                className="input"
                type="url"
                value={form.amazonUrl}
                onChange={(e) => setForm({ ...form, amazonUrl: e.target.value })}
                placeholder="https://amazon.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Kindle URL</label>
              <input
                className="input"
                type="url"
                value={form.kindleUrl}
                onChange={(e) => setForm({ ...form, kindleUrl: e.target.value })}
                placeholder="https://amazon.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Bookshop.org URL</label>
              <input
                className="input"
                type="url"
                value={form.bookshopUrl}
                onChange={(e) => setForm({ ...form, bookshopUrl: e.target.value })}
                placeholder="https://bookshop.org/..."
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Add Book"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-current font-bold"
                : "border-transparent hover:opacity-70"
            }`}
            style={{
              color: tab === t ? "var(--primary)" : "var(--muted)",
              borderBottomColor: tab === t ? "var(--primary)" : "transparent",
            }}
          >
            {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            <span
              className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
              style={{ background: "var(--border)" }}
            >
              {t === "ALL"
                ? books.length
                : books.filter((b) => b.status === t).length}
            </span>
          </button>
        ))}
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="text-center py-10" style={{ color: "var(--muted)" }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10" style={{ color: "var(--muted)" }}>
          No books here yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => {
            const avg = avgRating(book.ratings);
            return (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="card hover:shadow-md transition-shadow flex flex-col gap-2"
              >
                <div className="flex gap-3">
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-14 h-20 object-cover rounded shadow flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-14 h-20 rounded flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: "var(--border)" }}
                    >
                      📖
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3
                        className="font-bold leading-tight text-base"
                        style={{ color: "var(--primary)" }}
                      >
                        {book.title}
                      </h3>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      by {book.author}
                    </p>
                    <span className={`badge ${BADGE_MAP[book.status]} mt-1`}>
                      {book.status.charAt(0) + book.status.slice(1).toLowerCase()}
                    </span>
                    {avg !== null && (
                      <div className="mt-1 text-sm">
                        <Stars val={avg} />
                      </div>
                    )}
                  </div>
                </div>
                {book.genre && (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {book.genre}
                  </p>
                )}
                {book._count.discussionQuestions > 0 && (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    💬 {book._count.discussionQuestions} discussion question
                    {book._count.discussionQuestions !== 1 ? "s" : ""}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
