"use client";

import { motion, AnimatePresence } from "framer-motion";

interface TypingIndicatorProps {
  typingUsers: string[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
      : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

  return (
    <AnimatePresence>
      <motion.div
        key="typing"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex items-center gap-2.5 px-4 py-2"
      >
        {/* Dots container */}
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block w-1.5 h-1.5 rounded-full bg-indigo-400"
              animate={{ y: [0, -5, 0] }}
              transition={{
                delay: i * 0.15,
                repeat: Infinity,
                duration: 0.7,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        <span className="text-xs text-white/40 italic">{label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
