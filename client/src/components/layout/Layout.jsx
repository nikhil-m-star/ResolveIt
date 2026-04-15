import { Navbar } from "./Navbar";

export function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />
      <main className="pt-[72px] h-[calc(100vh)]">
        {children}
      </main>
    </div>
  );
}
