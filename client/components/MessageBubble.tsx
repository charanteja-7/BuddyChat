"use client";
import { useState } from "react";

import type { Message } from "@/types";
import { motion } from "framer-motion";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (msg: Message) => void;
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

export default function MessageBubble({ message, isOwnMessage, onEdit, onDelete, onReply }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== message.content && onEdit) {
      onEdit(message.id || (message as any)._id, editContent);
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      id={`message-${message.id || (message as any)._id}`}
      className={`flex items-end gap-2 mb-4 p-1 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
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
          className={`relative group px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-lg flex flex-col ${
            isOwnMessage
              ? "text-white rounded-br-sm"
              : "text-white/90 rounded-bl-sm border border-white/10"
          }`}
          style={
            message.isDeleted ? {
              background: "rgba(255,255,255,0.05)",
              border: "1px dashed rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.4)"
            } :
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
          {message.isDeleted ? (
            <span className="italic flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> This message was deleted</span>
          ) : (
            <>
              {message.replyTo && (
                <div 
                  onClick={() => {
                    const targetId = `message-${message.replyTo?.id || (message.replyTo as any)?._id}`;
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                      targetEl.style.transition = "background-color 0.5s ease";
                      targetEl.style.backgroundColor = "rgba(99, 102, 241, 0.2)";
                      targetEl.style.borderRadius = "0.5rem";
                      setTimeout(() => {
                        targetEl.style.backgroundColor = "transparent";
                      }, 1200);
                    }
                  }}
                  className="mb-2 p-2 bg-black/10 rounded-md border-l-2 border-white/30 text-xs text-white/70 overflow-hidden text-ellipsis whitespace-nowrap min-w-[150px] max-w-[200px] cursor-pointer hover:bg-black/20 transition-colors"
                >
                  <span className="font-bold mr-1 inline-block text-white/90">
                    {message.replyTo.sender?.name || (message.replyTo.sender as any)?.name}
                  </span>
                  <br/>
                  <span className="opacity-80">
                    {message.replyTo.content || "Media / Attachment"}
                  </span>
                </div>
              )}
              {message.mediaUrl && (
                <div className="mb-2 max-w-[200px] overflow-hidden rounded-lg mt-1">
                  {message.mediaType === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={message.mediaUrl} alt="media" className="w-full h-auto object-cover" />
                  ) : (
                    <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-xs">
                      📎 Download File
                    </a>
                  )}
                </div>
              )}
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEditSubmit()}
                    className="bg-black/20 text-white border border-white/20 rounded px-2 py-1 text-sm focus:outline-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button onClick={() => setIsEditing(false)} className="hover:text-white/70">Cancel</button>
                    <button onClick={handleEditSubmit} className="font-bold text-indigo-200">Save</button>
                  </div>
                </div>
              ) : (
                <span>
                  {message.content}
                  {message.isEdited && <span className="text-[10px] opacity-60 ml-2 italic">(edited)</span>}
                </span>
              )}

              {/* Message Context Actions */}
              {!isEditing && (
                <div className={`absolute top-1 ${isOwnMessage ? "-left-[88px]" : "-right-10"} opacity-0 group-hover:opacity-100 flex gap-1 ${isOwnMessage ? "bg-black/40" : "bg-black/60"} rounded-md p-1 backdrop-blur transition-opacity z-10`}>
                  <button onClick={() => { if(onReply) onReply(message) }} title="Reply" className="p-1 hover:bg-white/10 rounded text-sm">↩️</button>
                  {isOwnMessage && (
                    <>
                      <button onClick={() => setIsEditing(true)} title="Edit" className="p-1 hover:bg-white/10 rounded text-sm">✏️</button>
                      <button onClick={() => { if(onDelete) onDelete(message.id || (message as any)._id) }} title="Delete" className="p-1 hover:bg-white/10 rounded text-sm">🗑️</button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs text-white/30 mt-1 ${isOwnMessage ? "mr-1" : "ml-1"}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwnMessage && (
            <span className={`flex font-bold ${message.readBy && message.readBy.length > 0 ? "text-blue-400" : "text-white/30"}`}>
              ✓✓
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
