export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

export interface Group {
  id: string;
  _id?: string;
  name: string;
  members: User[];
  admin: User | string;
  inviteCode: string;
}

export interface Message {
  id: string;
  _id?: string;
  sender: User;
  groupId: string;
  content: string;
  createdAt: string;
}
