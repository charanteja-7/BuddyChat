"use client";

import type { Message } from "@/types";

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
    <div
      className={`flex items-end gap-2 mb-3 ${
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.sender.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.sender.avatar}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
              isOwnMessage ? "bg-indigo-500" : "bg-purple-600"
            }`}
          >
            {getInitials(message.sender.name)}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwnMessage && (
          <span className="text-xs text-gray-400 mb-1 ml-1">
            {message.sender.name}
          </span>
        )}
        <div
          className={`px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwnMessage
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-gray-700 text-gray-100 rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-gray-500 mt-1 mx-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
