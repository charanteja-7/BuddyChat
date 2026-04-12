"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { Message, User } from "@/types";
import { getMessages, uploadMedia } from "@/lib/api";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { motion } from "framer-motion";

interface ChatWindowProps {
  groupId: string;
  currentUser: User;
  socket: Socket;
}

export default function ChatWindow({ groupId, currentUser, socket }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load history
  useEffect(() => {
    setIsLoading(true);
    getMessages(groupId)
      .then((res) => {
        const data = res.data;
        setMessages(Array.isArray(data) ? data : data.messages ?? []);
        socket.emit("mark-messages-read", { groupId });
      })
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));
  }, [groupId]);

  // Socket events
  useEffect(() => {
    socket.emit("join-room", groupId);

    const onNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      socket.emit("mark-messages-read", { groupId });
    };

    const onMessageUpdated = (updatedMsg: Message) => {
      setMessages((prev) => prev.map((m) => {
        const mId = m.id || (m as any)._id;
        const uId = updatedMsg.id || (updatedMsg as any)._id;
        return mId === uId ? updatedMsg : m;
      }));
    };

    const onMessagesRead = ({ groupId: gId, userId }: { groupId: string, userId: string }) => {
      if (gId === groupId) {
        setMessages((prev) => prev.map(m => {
          if ((m.sender.id || (m.sender as any)._id) === currentUser.id && (!m.readBy || !m.readBy.includes(userId))) {
             return { ...m, readBy: [...(m.readBy || []), userId] };
          }
          return m;
        }));
      }
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
    socket.on("message-updated", onMessageUpdated);
    socket.on("messages-read", onMessagesRead);
    socket.on("user-typing", onUserTyping);
    socket.on("user-stop-typing", onStopTyping);

    return () => {
      socket.emit("leave-room", groupId);
      socket.off("new-message", onNewMessage);
      socket.off("message-updated", onMessageUpdated);
      socket.off("messages-read", onMessagesRead);
      socket.off("user-typing", onUserTyping);
      socket.off("user-stop-typing", onStopTyping);
    };
  }, [groupId, socket, currentUser.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content && !attachment) return;

    let mediaUrl, mediaType;

    if (attachment) {
      setIsUploading(true);
      try {
        const res = await uploadMedia(attachment);
        mediaUrl = res.data.mediaUrl;
        mediaType = res.data.mediaType;
      } catch (error) {
        console.error("Upload failed", error);
        setIsUploading(false);
        return; // handle error UI if needed
      }
      setIsUploading(false);
    }

    socket.emit("send-message", { 
      groupId, 
      content, 
      mediaUrl, 
      mediaType,
      replyTo: replyingToMessage?.id || (replyingToMessage as any)?._id 
    });
    setInput("");
    setAttachment(null);
    setReplyingToMessage(null);
    socket.emit("stop-typing", { groupId });
  }, [input, attachment, replyingToMessage, groupId, socket]);

  const handleEdit = (messageId: string, content: string) => {
    socket.emit("edit-message", { messageId, groupId, content });
  };

  const handleDelete = (messageId: string) => {
    socket.emit("delete-message", { messageId, groupId });
  };

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
    <div className="flex flex-col h-full chat-bg">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
            <p className="text-white/30 text-xs">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
            <motion.span
              className="text-5xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              💬
            </motion.span>
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
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReply={(msg) => {
                setReplyingToMessage(msg);
                setTimeout(() => inputRef.current?.focus(), 10);
              }}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers.map((u) => u.name)} />

      {/* Input area */}
      <div
        className="px-4 py-3 border-t border-white/8 flex-shrink-0"
        style={{
          background: "rgba(10,10,20,0.7)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {replyingToMessage && (
          <div className="mb-2 flex items-center justify-between px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                Replying to {replyingToMessage.sender.name}
              </span>
              <span className="text-xs text-white/70 truncate">
                {replyingToMessage.content || "Media / Attachment"}
              </span>
            </div>
            <button 
              onClick={() => setReplyingToMessage(null)}
              className="text-white/40 hover:text-white/90 p-1"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          {attachment && (
            <div className="text-xs text-white/70 flex items-center bg-white/10 px-2 py-1 rounded truncate max-w-[120px]">
              {attachment.name}
              <button 
                onClick={() => setAttachment(null)} 
                className="ml-2 hover:text-white font-bold"
              >×</button>
            </div>
          )}
          <label className="cursor-pointer p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            <input 
              type="file" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files?.[0]) setAttachment(e.target.files[0]);
              }} 
            />
          </label>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 px-5 py-2.5 rounded-full text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />
          <motion.button
            onClick={sendMessage}
            disabled={(!input.trim() && !attachment) || isUploading}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            style={{
              background: (input.trim() || attachment)
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "rgba(255,255,255,0.1)",
              boxShadow: (input.trim() || attachment) ? "0 4px 16px rgba(99,102,241,0.45)" : "none",
            }}
          >
            <svg
              className="w-4 h-4 text-white rotate-45"
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
          </motion.button>
        </div>
      </div>
    </div>
  );
}
