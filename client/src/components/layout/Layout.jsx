import { Navbar } from "./Navbar";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function Layout({ children }) {
  const location = useLocation();
  
  return (
    <div className="relative min-h-screen text-slate-100 overflow-x-hidden selection:bg-primary/30">
      {/* Noise Texture */}
      <div className="bg-noise fixed inset-0 pointer-events-none z-0" />
      
      {/* Ambient gradients - More vibrant "Elite" orbs */}
      <div className="fixed top-[-10%] left-[-5%] h-[40rem] w-[40rem] rounded-full bg-primary/15 blur-[120px] pointer-events-none z-0 animate-pulse" />
      <div className="fixed top-[20%] right-[-10%] h-[35rem] w-[35rem] rounded-full bg-secondary/10 blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[10%] h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[130px] pointer-events-none z-0" />

      <Navbar />
      <AnimatePresence mode="wait">
        <Motion.main 
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="pt-[140px] md:pt-[110px] min-h-screen relative z-10 pb-16 px-4 sm:px-6"
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </Motion.main>
      </AnimatePresence>
    </div>
  );
}
