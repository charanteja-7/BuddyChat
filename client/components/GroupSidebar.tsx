"use client";

import { useState } from "react";
import type { Group, User } from "@/types";

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
    <div className="flex flex-col h-full bg-gray-900 text-white w-64 border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-indigo-400">💬 BuddyChat</h1>
      </div>

      {/* Groups list */}
      <div className="flex-1 overflow-y-auto py-2">
        {groups.length === 0 ? (
          <p className="text-gray-500 text-sm px-4 py-6 text-center">
            No groups yet. Create or join one!
          </p>
        ) : (
          groups.map((group) => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-gray-800 ${
                activeGroupId === group.id
                  ? "bg-indigo-900/60 border-l-4 border-indigo-500"
                  : "border-l-4 border-transparent"
              }`}
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold">
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{group.name}</p>
                <p className="text-xs text-gray-400">
                  {group.members.length} member
                  {group.members.length !== 1 ? "s" : ""}
                  {" · "}
                  <span className="text-green-400">
                    {onlineCount(group)} online
                  </span>
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-700 flex flex-col gap-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
        >
          + Create Group
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          className="w-full py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
        >
          Join by Invite
        </button>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-80 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">Create New Group</h2>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Group name..."
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroupName("");
                }}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-80 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">Join a Group</h2>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Invite code..."
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleJoin}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                Join
              </button>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setInviteCode("");
                }}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
