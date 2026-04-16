import { Navbar } from "./Navbar";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function Layout({ children }) {
  const location = useLocation();
  
  return (
    <div className="relative min-h-screen bg-[#020617] text-primary/90 overflow-x-hidden">
      {/* Noise Texture */}
      <div className="bg-noise fixed inset-0 pointer-events-none z-0" />
      
      {/* Liquid Ambient Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none mix-blend-screen z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none mix-blend-screen z-0" />
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-teal-500/5 blur-[90px] pointer-events-none mix-blend-screen z-0" />

      <Navbar />
      <AnimatePresence mode="wait">
        <Motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="pt-[100px] min-h-screen relative z-10 pb-8"
        >
          {children}
        </Motion.main>
      </AnimatePresence>
    </div>
  );
}
