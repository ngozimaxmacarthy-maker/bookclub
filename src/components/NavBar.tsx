"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/books", label: "Books" },
  { href: "/nominations", label: "Vote" },
  { href: "/meetings", label: "Meetings" },
  { href: "/history", label: "History" },
  { href: "/hosts", label: "Hosts" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [memberName, setMemberName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setMemberName(data.name);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMemberName(null);
    router.push("/");
  };

  return (
    <nav
      style={{
        background: "var(--primary)",
        borderBottom: "3px solid var(--accent)",
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-white text-xl font-bold tracking-wide font-serif"
        >
          Book Club
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {memberName ? (
            <>
              <span className="text-white/80 text-sm">Hi, {memberName}</span>
              <button
                onClick={handleLogout}
                className="text-white/80 hover:text-white text-sm underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="text-white/80 hover:text-white text-sm underline"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === link.href
                  ? "bg-white/20 text-white"
                  : "text-white/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-white/20">
            {memberName ? (
              <>
                <p className="text-white/70 text-sm px-3">Hi, {memberName}</p>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="text-white/80 text-sm px-3 underline"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="text-white/80 text-sm px-3 underline"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
