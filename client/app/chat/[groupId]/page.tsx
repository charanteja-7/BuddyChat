"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import ChatWindow from "@/components/ChatWindow";
import { getGroupById } from "@/lib/api";
import type { Group, User } from "@/types";

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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Back + header */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat header */}
        <div className="h-14 border-b border-gray-700 bg-gray-800 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            ←
          </button>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{group.name}</p>
            <p className="text-xs text-gray-400">
              {group.members.length} members ·{" "}
              <span
                className={`${isConnected ? "text-green-400" : "text-red-400"}`}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </p>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow groupId={groupId} currentUser={user} socket={socket} />
        </div>
      </div>

      {/* Online members sidebar */}
      <div className="w-52 border-l border-gray-700 bg-gray-900 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Members — {group.members.length}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {group.members.map((member: User) => (
            <div
              key={member.id}
              className="flex items-center gap-2.5 px-4 py-2"
            >
              <div className="relative flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-semibold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                    member.isOnline || onlineMembers.includes(member.name)
                      ? "bg-green-500"
                      : "bg-gray-600"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  {member.name}
                  {member.id === user.id && (
                    <span className="text-gray-500"> (you)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {member.isOnline || onlineMembers.includes(member.name)
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Invite code */}
        <div className="p-3 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Invite Code</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(group.inviteCode);
            }}
            className="w-full text-left px-2 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-indigo-300 font-mono truncate transition-colors"
            title="Click to copy"
          >
            {group.inviteCode}
          </button>
        </div>
      </div>
    </div>
  );
}
