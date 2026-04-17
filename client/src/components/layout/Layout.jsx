import { Navbar } from "./Navbar";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function Layout({ children }) {
  const location = useLocation();
  
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden selection:bg-primary/30">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[160px]" />
      </div>

      {/* Noise Texture */}
      <div className="bg-noise fixed inset-0 pointer-events-none z-0 opacity-[0.03]" />

      <Navbar />
      <AnimatePresence mode="wait">
        <Motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="pt-28 min-h-screen relative z-10 pb-16 px-4 sm:px-6"
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </Motion.main>
      </AnimatePresence>
    </div>
  );
}
