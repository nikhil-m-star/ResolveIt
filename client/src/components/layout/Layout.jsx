import { Navbar } from "./Navbar";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function Layout({ children }) {
  const location = useLocation();
  
  return (
    <div className="relative min-h-screen text-primary/90 overflow-x-hidden">
      {/* Noise Texture */}
      <div className="bg-noise fixed inset-0 pointer-events-none z-0" />
      
      {/* Ambient gradients */}
      <div className="fixed top-[-18%] left-[-8%] h-[34rem] w-[34rem] rounded-full bg-orange-400/12 blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-[6%] right-[-10%] h-[32rem] w-[32rem] rounded-full bg-teal-300/12 blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-15%] left-[20%] h-[22rem] w-[22rem] rounded-full bg-cyan-300/8 blur-[110px] pointer-events-none z-0" />

      <Navbar />
      <AnimatePresence mode="wait">
        <Motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="pt-[132px] min-h-screen relative z-10 pb-8"
        >
          <div className="mx-auto max-w-[1500px]">
            {children}
          </div>
        </Motion.main>
      </AnimatePresence>
    </div>
  );
}
