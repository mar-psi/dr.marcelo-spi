"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ArrowLeft, Ghost, Search, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) return null;

  // Se estiver logado, leva pra home (/), senão leva pro login (/login)
  const destination = user ? "/" : "/login";
  const buttonText = user ? "Ir para o Painel" : "Fazer Login";

  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center relative overflow-hidden px-4 font-sans">
      {/* Background Glows */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05] 
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-primary blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.1, 0.05] 
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-secondary blur-[120px] rounded-full" 
        />
      </div>

      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-noise" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-xl"
      >
        {/* Icon with Floating Animation */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-12 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-accent-primary opacity-20 blur-2xl rounded-full scale-150" />
            <Ghost size={140} className="text-accent-primary relative z-10 drop-shadow-glow" />
            <motion.div 
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/50 blur-xl rounded-full" 
            />
          </div>
        </motion.div>

        {/* Big 404 with Shimmer */}
        <div className="relative inline-block mb-6">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-content-primary to-content-secondary tracking-tighter sm:text-[12rem]">
            404
          </h1>
          <motion.div 
            animate={{ left: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-20 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
          />
        </div>
        
        <h2 className="text-3xl font-bold text-content-primary mb-4 sm:text-4xl">
          Caminho sem saída
        </h2>
        
        <p className="text-content-secondary text-lg mb-12 leading-relaxed max-w-md mx-auto">
          A página que você procura sumiu no subconsciente. 
          Mas não se preocupe, podemos te ajudar a voltar.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href={destination}>
            <motion.button
              whileHover={{ scale: 1.05, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-10 py-4 bg-accent-primary text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-glow hover:shadow-glowStrong overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              {user ? <Home size={22} /> : <ArrowLeft size={22} />}
              <span className="relative z-10">{buttonText}</span>
            </motion.button>
          </Link>
          
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(30, 30, 46, 1)" }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 bg-background-secondary border border-border text-content-primary rounded-2xl font-bold flex items-center gap-3 transition-all backdrop-blur-sm"
            >
              <Search size={22} className="text-accent-secondary" />
              Página Inicial
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%" 
            }}
            animate={{ 
              opacity: [0, 0.4, 0],
              y: ["0%", "-20%"] 
            }}
            transition={{ 
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5 
            }}
            className="absolute w-1 h-1 bg-accent-primary rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Footer hint */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 text-content-disabled text-sm flex items-center gap-2"
      >
        <AlertCircle size={14} />
        <span>Dr. Marcelo Psiquiatra &copy; 2026</span>
      </motion.div>
    </div>
  );
}
