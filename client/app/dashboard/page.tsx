"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GroupSidebar from "@/components/GroupSidebar";
import { getGroups, createGroup as apiCreateGroup, joinGroup as apiJoinGroup } from "@/lib/api";
import type { Group, User } from "@/types";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <GroupSidebar
        groups={groups}
        activeGroupId={activeGroupId}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
        currentUserId={user.id}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-14 border-b border-gray-700 bg-gray-800 flex items-center justify-between px-6">
          <h2 className="font-semibold text-gray-200">Dashboard</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              Hi, <span className="text-white font-medium">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            {activeGroup ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto">
                  {activeGroup.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold">{activeGroup.name}</h2>
                <p className="text-gray-400 text-sm">
                  {activeGroup.members.length} member
                  {activeGroup.members.length !== 1 ? "s" : ""}
                </p>
                {inviteLink && (
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                      Invite Link
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-indigo-300 bg-gray-700 px-3 py-2 rounded-lg truncate">
                        {activeGroup.inviteCode}
                      </code>
                      <button
                        onClick={copyInvite}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        {copied ? "✓ Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/chat/${activeGroup.id}`)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-colors"
                >
                  Open Chat →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl">💬</div>
                <h2 className="text-2xl font-bold text-gray-100">
                  Welcome to BuddyChat
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Select a group from the sidebar to start chatting, or create a
                  new group to invite your friends.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <div className="bg-gray-800 rounded-xl p-4 flex-1 border border-gray-700 max-w-32">
                    <div className="text-2xl mb-2">✨</div>
                    <p className="text-xs text-gray-300">Create a group</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 flex-1 border border-gray-700 max-w-32">
                    <div className="text-2xl mb-2">🔗</div>
                    <p className="text-xs text-gray-300">Join via invite</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 flex-1 border border-gray-700 max-w-32">
                    <div className="text-2xl mb-2">⚡</div>
                    <p className="text-xs text-gray-300">Real-time chat</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
