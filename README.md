# BuddyChat 💬

A scalable, real-time chat application built with Next.js, Node.js, MongoDB, and Socket.IO.

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15+ (App Router, TypeScript, Tailwind CSS) |
| Backend | Node.js + Express |
| Database | MongoDB with Mongoose |
| Real-time | Socket.IO |
| Auth | JWT stored in HTTP-only cookies |

## 📁 Project Structure

```
buddychat/
├── client/                   # Next.js frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/        # Login page
│   │   │   └── register/     # Register page
│   │   ├── dashboard/        # Group management dashboard
│   │   └── chat/[groupId]/   # Real-time chat page
│   ├── components/
│   │   ├── ChatWindow.tsx    # Main chat UI with socket integration
│   │   ├── MessageBubble.tsx # Individual message display
│   │   ├── TypingIndicator.tsx # Animated typing status
│   │   └── GroupSidebar.tsx  # Group list + create/join modals
│   ├── context/
│   │   └── AuthContext.tsx   # Global auth state
│   ├── hooks/
│   │   └── useSocket.ts      # Socket.IO connection hook
│   ├── lib/
│   │   ├── api.ts            # Axios API client
│   │   ├── socket.ts         # Socket.IO singleton
│   │   └── auth.ts           # Auth utilities
│   └── types/
│       └── index.ts          # TypeScript interfaces
│
├── server/                   # Express backend
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── groupController.js
│   │   └── messageController.js
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── groups.js
│   │   └── messages.js
│   ├── sockets/
│   │   └── index.js          # Socket.IO event handlers
│   └── server.js             # Entry point
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

The server runs on `http://localhost:5000` by default.

### Frontend Setup

```bash
cd client
cp .env.local.example .env.local
# Edit .env.local if your server runs on a different port
npm install
npm run dev
```

The client runs on `http://localhost:3000`.

## ⚙️ Environment Variables

### Server (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/buddychat
JWT_SECRET=your_strong_jwt_secret_here
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Client (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## 📌 Features

- **User Authentication** — Register, login, and logout with JWT in HTTP-only cookies
- **Group Chat** — Create chat groups, invite others via shareable invite codes
- **Real-time Messaging** — Instant message delivery with Socket.IO
- **Typing Indicators** — See when others are typing
- **Online Status** — Live online/offline user status
- **Persistent History** — All messages stored in MongoDB with pagination

## 🔌 Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Client → Server | Join a group's socket room |
| `send-message` | Client → Server | Send a message to a room |
| `typing` | Client → Server | Notify others you're typing |
| `stop-typing` | Client → Server | Stop typing notification |
| `new-message` | Server → Client | Receive a new message |
| `user-typing` | Server → Client | Someone is typing |
| `user-stop-typing` | Server → Client | Someone stopped typing |
| `online-users` | Server → Client | Broadcast online users list |

## 🔐 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens stored in HTTP-only, SameSite=Strict cookies
- CSRF protection via double-submit cookie pattern
- Rate limiting on auth routes (20 req/15min) and global (300 req/15min)
- Input sanitization to prevent NoSQL injection
- Socket.IO connections authenticated via JWT

## 📦 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT cookie |
| POST | `/api/auth/logout` | Clear JWT cookie |
| GET | `/api/auth/me` | Get current user info |

### Groups
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/groups` | Create a new group |
| GET | `/api/groups` | Get all groups for current user |
| GET | `/api/groups/:id` | Get group by ID |
| POST | `/api/groups/join/:inviteCode` | Join a group via invite code |

### Messages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages/:groupId` | Get paginated messages |
| POST | `/api/messages/:groupId` | Send a message (HTTP fallback) |