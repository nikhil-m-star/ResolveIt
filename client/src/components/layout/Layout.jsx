import { Navbar } from "./Navbar";

export function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-black text-primary/90">
      <Navbar />
      <main className="pt-[100px] h-[calc(100vh)]">
        {children}
      </main>
    </div>
  );
}
