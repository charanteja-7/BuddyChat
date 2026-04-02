"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import ChatWindow from "@/components/ChatWindow";
import { getGroupById } from "@/lib/api";
import type { Group, User } from "@/types";
import { motion } from "framer-motion";

interface ChatPageProps {
  params: Promise<{ groupId: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { groupId } = use(params);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [group, setGroup] = useState<Group | null>(null);
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!groupId) return;
    getGroupById(groupId)
      .then((res) => {
        const data = res.data;
        const raw = data.group ?? data;
        const normalized: Group = {
          ...raw,
          id: (raw._id ?? raw.id)?.toString(),
          members: (raw.members ?? []).map((m: User & { _id?: string }) => ({
            ...m,
            id: (m._id ?? m.id)?.toString(),
          })),
        };
        setGroup(normalized);
      })
      .catch(() => router.replace("/dashboard"));
  }, [groupId, router]);

  // Track online members via socket
  useEffect(() => {
    const onOnlineStatus = ({
      userId,
      isOnline,
      userName,
    }: {
      userId: string;
      isOnline: boolean;
      userName: string;
    }) => {
      setOnlineMembers((prev) =>
        isOnline ? [...new Set([...prev, userName])] : prev.filter((n) => n !== userName)
      );
      // Update member status in group
      setGroup((g) => {
        if (!g) return g;
        return {
          ...g,
          members: g.members.map((m: User) =>
            m.id === userId ? { ...m, isOnline } : m
          ),
        };
      });
    };

    socket.on("user-online-status", onOnlineStatus);
    return () => {
      socket.off("user-online-status", onOnlineStatus);
    };
  }, [socket]);

  if (isLoading || !user || !group) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
          <p className="text-white/30 text-sm">Loading chat…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen text-white overflow-hidden"
      style={{ background: "#0d0d18" }}
    >
      {/* Chat column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat header */}
        <div
          className="h-14 border-b border-white/8 flex items-center px-4 gap-3 flex-shrink-0"
          style={{
            background: "rgba(10,10,22,0.8)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <motion.button
            onClick={() => router.push("/dashboard")}
            whileHover={{ x: -2, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/8"
          >
            ←
          </motion.button>

          {/* Group avatar */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            }}
          >
            {group.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate">{group.name}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-white/40">
                {group.members.length} members
              </p>
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? "bg-green-400 online-pulse" : "bg-red-400"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isConnected ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow groupId={groupId} currentUser={user} socket={socket} />
        </div>
      </div>

      {/* Online members sidebar */}
      <div
        className="w-52 border-l border-white/8 flex flex-col flex-shrink-0"
        style={{
          background: "rgba(10,10,22,0.65)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="p-4 border-b border-white/8">
          <h3 className="text-[10px] font-semibold text-white/35 uppercase tracking-widest">
            Members — {group.members.length}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {group.members.map((member: User, i: number) => {
            const isOnline = member.isOnline || onlineMembers.includes(member.name);
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-white/4 transition-colors rounded-lg mx-1"
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{
                      background: isOnline
                        ? "linear-gradient(135deg, #8b5cf6, #c084fc)"
                        : "rgba(255,255,255,0.1)",
                    }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d0d18] ${
                      isOnline ? "bg-green-400 online-pulse" : "bg-white/20"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">
                    {member.name}
                    {member.id === user.id && (
                      <span className="text-white/30"> (you)</span>
                    )}
                  </p>
                  <p className={`text-xs ${isOnline ? "text-green-400" : "text-white/30"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Invite code */}
        <div className="p-3 border-t border-white/8">
          <p className="text-[10px] text-white/30 mb-1.5 font-semibold uppercase tracking-widest">
            Invite Code
          </p>
          <motion.button
            onClick={() => {
              navigator.clipboard.writeText(group.inviteCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono truncate transition-all border border-white/8 hover:border-indigo-400/40"
            style={{
              background: copied ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
              color: copied ? "#a5b4fc" : "#818cf8",
            }}
            title="Click to copy"
          >
            {copied ? "✓ Copied!" : group.inviteCode}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
