"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { TESTIMONIALS } from "@/data/subscription";
import { Avatar } from "@/components/ui";

export function TestimonialsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {TESTIMONIALS.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, duration: 0.4 }}
          className="relative rounded-2xl border border-border-subtle bg-background-secondary p-5 hover:border-accent-primary/30 hover:shadow-glow transition-all duration-300"
        >
          {/* Quote icon */}
          <Quote
            size={28}
            className="text-accent-primary/20 absolute top-4 right-4"
          />

          {/* Stars */}
          <div className="flex items-center gap-0.5 mb-3">
            {Array.from({ length: t.rating }).map((_, j) => (
              <Star
                key={j}
                size={13}
                className="text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>

          {/* Text */}
          <p className="text-sm text-content-secondary leading-relaxed mb-4 italic">
            &quot;{t.text}&quot;
          </p>

          {/* Author */}
          <div className="flex items-center gap-3">
            <Avatar src={t.avatar} name={t.name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-content-primary">{t.name}</p>
              <p className="text-xs text-content-disabled">{t.role}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
