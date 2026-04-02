"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { Message, User } from "@/types";
import { getMessages } from "@/lib/api";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface ChatWindowProps {
  groupId: string;
  currentUser: User;
  socket: Socket;
}

export default function ChatWindow({ groupId, currentUser, socket }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load history
  useEffect(() => {
    setIsLoading(true);
    getMessages(groupId)
      .then((res) => {
        const data = res.data;
        setMessages(Array.isArray(data) ? data : data.messages ?? []);
      })
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));
  }, [groupId]);

  // Socket events
  useEffect(() => {
    socket.emit("join-room", groupId);

    const onNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onUserTyping = ({ userId, name }: { userId: string; name: string }) => {
      if (userId !== currentUser.id) {
        setTypingUsers((prev) =>
          prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, name }]
        );
      }
    };

    const onStopTyping = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    socket.on("new-message", onNewMessage);
    socket.on("user-typing", onUserTyping);
    socket.on("user-stop-typing", onStopTyping);

    return () => {
      socket.emit("leave-room", groupId);
      socket.off("new-message", onNewMessage);
      socket.off("user-typing", onUserTyping);
      socket.off("user-stop-typing", onStopTyping);
    };
  }, [groupId, socket, currentUser.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const sendMessage = useCallback(() => {
    const content = input.trim();
    if (!content) return;
    socket.emit("send-message", { groupId, content });
    setInput("");
    socket.emit("stop-typing", { groupId });
  }, [input, groupId, socket]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    socket.emit("typing", { groupId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { groupId });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id ?? (msg as { _id?: string })._id}
              message={msg}
              isOwnMessage={
                (msg.sender as User & { _id?: string })._id?.toString() === currentUser.id ||
                msg.sender.id === currentUser.id
              }
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers.map((u) => u.name)} />

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-700 bg-gray-900">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
          >
            <svg
              className="w-5 h-5 text-white rotate-45"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
