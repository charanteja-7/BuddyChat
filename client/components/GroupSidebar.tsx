"use client";

import { useState } from "react";
import type { Group, User } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface GroupSidebarProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => void;
  onJoinGroup: (inviteCode: string) => void;
  currentUserId: string;
}

export default function GroupSidebar({
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  currentUserId,
}: GroupSidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName("");
      setShowCreateModal(false);
    }
  };

  const handleJoin = () => {
    if (inviteCode.trim()) {
      onJoinGroup(inviteCode.trim());
      setInviteCode("");
      setShowJoinModal(false);
    }
  };

  const onlineCount = (group: Group) =>
    group.members.filter((m: User) => m.isOnline).length;

  return (
    <>
      <div
        className="flex flex-col h-full w-64 flex-shrink-0 border-r border-white/8"
        style={{
          background: "rgba(10,10,22,0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💬</span>
            <span className="text-lg font-bold gradient-text">BuddyChat</span>
          </div>
        </div>

        {/* Groups list */}
        <div className="flex-1 overflow-y-auto py-2">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-4 py-2">
            Your Groups
          </p>
          {groups.length === 0 ? (
            <p className="text-white/30 text-sm px-4 py-6 text-center leading-relaxed">
              No groups yet.<br />Create or join one!
            </p>
          ) : (
            groups.map((group, i) => {
              const isActive = activeGroupId === group.id;
              const online = onlineCount(group);
              return (
                <motion.button
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 mx-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-500/20 border border-indigo-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                  style={{ width: "calc(100% - 8px)" }}
                >
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4))",
                    }}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-white/80"}`}>
                      {group.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-white/35">
                        {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                      </p>
                      {online > 0 && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 online-pulse inline-block" />
                            <span className="text-xs text-green-400 font-medium">{online} online</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  )}
                </motion.button>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-white/8 flex flex-col gap-2">
          <motion.button
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-2.5 px-3 rounded-xl text-sm font-semibold text-white transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
            }}
          >
            + Create Group
          </motion.button>
          <motion.button
            onClick={() => setShowJoinModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-2.5 px-3 bg-white/6 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/80 transition-all duration-300"
          >
            Join by Invite
          </motion.button>
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => { setShowCreateModal(false); setNewGroupName(""); }}
          >
            <motion.div
              className="w-80 rounded-2xl p-6 shadow-2xl border border-white/10"
              style={{
                background: "rgba(15,15,30,0.9)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-white mb-1">Create New Group</h2>
              <p className="text-white/40 text-xs mb-4">Give your group a name to get started.</p>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Group name…"
                className="w-full px-4 py-2.5 bg-white/6 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 mb-4 transition-all"
                autoFocus
              />
              <div className="flex gap-2">
                <motion.button
                  onClick={handleCreate}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  Create
                </motion.button>
                <motion.button
                  onClick={() => { setShowCreateModal(false); setNewGroupName(""); }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2.5 bg-white/6 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/70 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Group Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => { setShowJoinModal(false); setInviteCode(""); }}
          >
            <motion.div
              className="w-80 rounded-2xl p-6 shadow-2xl border border-white/10"
              style={{
                background: "rgba(15,15,30,0.9)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-white mb-1">Join a Group</h2>
              <p className="text-white/40 text-xs mb-4">Enter an invite code shared by a friend.</p>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Invite code…"
                className="w-full px-4 py-2.5 bg-white/6 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 mb-4 transition-all"
                autoFocus
              />
              <div className="flex gap-2">
                <motion.button
                  onClick={handleJoin}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                >
                  Join
                </motion.button>
                <motion.button
                  onClick={() => { setShowJoinModal(false); setInviteCode(""); }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2.5 bg-white/6 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/70 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
