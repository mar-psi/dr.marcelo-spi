"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/data/subscription";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => {
        const isOpen = openId === faq.id;
        return (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              "rounded-xl border overflow-hidden transition-all duration-200",
              isOpen
                ? "border-accent-primary/40 bg-[rgba(124,58,237,0.06)]"
                : "border-border-subtle bg-background-secondary hover:border-accent-primary/25"
            )}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span
                className={cn(
                  "text-sm font-semibold transition-colors duration-200",
                  isOpen ? "text-accent-secondary" : "text-content-primary"
                )}
              >
                {faq.question}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "shrink-0 text-content-secondary transition-transform duration-300",
                  isOpen && "rotate-180 text-accent-secondary"
                )}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm text-content-secondary leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
