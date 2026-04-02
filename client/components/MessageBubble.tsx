"use client";

import type { Message } from "@/types";
import { motion } from "framer-motion";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <motion.div
      className={`flex items-end gap-2 mb-4 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.sender.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.sender.avatar}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ring-2 ring-white/10 ${
              isOwnMessage
                ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                : "bg-gradient-to-br from-purple-500 to-pink-600"
            }`}
          >
            {getInitials(message.sender.name)}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwnMessage && (
          <span className="text-xs text-white/40 mb-1 ml-2 font-medium">
            {message.sender.name}
          </span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-lg ${
            isOwnMessage
              ? "text-white rounded-br-sm"
              : "text-white/90 rounded-bl-sm border border-white/10"
          }`}
          style={
            isOwnMessage
              ? {
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                }
              : {
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }
          }
        >
          {message.content}
        </div>
        <span className={`text-xs text-white/30 mt-1 ${isOwnMessage ? "mr-1" : "ml-1"}`}>
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
