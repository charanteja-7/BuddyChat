"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GroupSidebar from "@/components/GroupSidebar";
import { getGroups, createGroup as apiCreateGroup, joinGroup as apiJoinGroup } from "@/lib/api";
import type { Group, User } from "@/types";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  const fetchGroups = useCallback(() => {
    getGroups()
      .then((res) => {
        const data = res.data;
        const raw = Array.isArray(data) ? data : data.groups ?? [];
        // Normalize _id -> id for Mongoose documents
        setGroups(
          raw.map((g: Group & { _id?: string }) => ({
            ...g,
            id: (g._id ?? g.id)?.toString(),
            members: g.members.map((m) => ({
              ...m,
              id: ((m as User & { _id?: string })._id ?? m.id)?.toString(),
            })),
          }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) fetchGroups();
  }, [user, fetchGroups]);

  const handleCreateGroup = async (name: string) => {
    try {
      await apiCreateGroup(name);
      fetchGroups();
    } catch {}
  };

  const handleJoinGroup = async (inviteCode: string) => {
    try {
      await apiJoinGroup(inviteCode);
      fetchGroups();
    } catch {}
  };

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    router.push(`/chat/${groupId}`);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const inviteLink = activeGroup
    ? `${window.location.origin}/join/${activeGroup.inviteCode}`
    : null;

  const copyInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
          <p className="text-white/30 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className="flex h-screen text-white overflow-hidden"
      style={{ background: "#0d0d18" }}
    >
      <GroupSidebar
        groups={groups}
        activeGroupId={activeGroupId}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
        currentUserId={user.id}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className="h-14 border-b border-white/8 flex items-center justify-between px-6 flex-shrink-0"
          style={{
            background: "rgba(10,10,22,0.7)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <h2 className="font-semibold text-white/80 text-sm">Dashboard</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-white/60">
                <span className="text-white font-medium">{user.name}</span>
              </span>
            </div>
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="text-sm px-3 py-1.5 bg-white/6 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white/70"
            >
              Sign out
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center chat-bg">
          <div className="text-center max-w-md px-4">
            {activeGroup ? (
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
                  }}
                >
                  {activeGroup.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{activeGroup.name}</h2>
                  <p className="text-white/40 text-sm mt-1">
                    {activeGroup.members.length} member{activeGroup.members.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {inviteLink && (
                  <div
                    className="rounded-2xl p-4 border border-white/10 text-left"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <p className="text-[10px] text-white/35 mb-2 font-semibold uppercase tracking-widest">
                      Invite Code
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-indigo-300 bg-white/6 border border-white/8 px-3 py-2 rounded-lg truncate font-mono">
                        {activeGroup.inviteCode}
                      </code>
                      <motion.button
                        onClick={copyInvite}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-white whitespace-nowrap transition-all"
                        style={{
                          background: copied
                            ? "linear-gradient(135deg, #22c55e, #16a34a)"
                            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        }}
                      >
                        {copied ? "✓ Copied!" : "Copy"}
                      </motion.button>
                    </div>
                  </div>
                )}
                <motion.button
                  onClick={() => router.push(`/chat/${activeGroup.id}`)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3 rounded-xl font-semibold text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 6px 24px rgba(99,102,241,0.4)",
                  }}
                >
                  Open Chat →
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.div
                  className="text-6xl"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  💬
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Welcome to BuddyChat</h2>
                  <p className="text-white/40 text-sm mt-2 leading-relaxed">
                    Select a group from the sidebar to start chatting,<br />
                    or create a new group to invite your friends.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  {[
                    { icon: "✨", label: "Create a group" },
                    { icon: "🔗", label: "Join via invite" },
                    { icon: "⚡", label: "Real-time chat" },
                  ].map(({ icon, label }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                      whileHover={{ y: -4, scale: 1.03 }}
                      className="rounded-2xl p-4 flex-1 border border-white/8 cursor-default max-w-32 transition-shadow"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="text-2xl mb-2">{icon}</div>
                      <p className="text-xs text-white/50 font-medium">{label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
