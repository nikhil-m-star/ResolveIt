import { Navbar } from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function Layout({ children }) {
  const location = useLocation();
  
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden selection:bg-primary/30">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/25 rounded-full blur-[140px] animate-pulse opacity-60" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/15 rounded-full blur-[140px] animate-pulse opacity-40" style={{ animationDelay: '3s' }} />
         <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Noise Texture */}
      <div className="bg-noise fixed inset-0 pointer-events-none z-0 opacity-[0.04]" />

      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.99, y: 15, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.01, y: -15, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pt-32 md:pt-48 min-h-screen relative z-10 pb-24 px-4 sm:px-6"
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
