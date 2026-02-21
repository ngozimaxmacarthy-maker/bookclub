import NavBar from "@/components/NavBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
