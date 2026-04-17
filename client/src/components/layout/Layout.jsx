import { Navbar } from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function Layout({ children, compact }) {
  const location = useLocation();
  
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden selection:bg-primary/30">
      {/* Clean Background */}
      <div className="fixed inset-0 z-0 bg-black pointer-events-none" />

      {/* Noise Texture Removed */}

      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.99, y: 15, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.01, y: -15, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={compact ? "pt-8 md:pt-48 min-h-screen relative z-10 pb-24 px-4 sm:px-6" : "pt-8 md:pt-48 min-h-screen relative z-10 pb-24 px-4 sm:px-6"}
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
