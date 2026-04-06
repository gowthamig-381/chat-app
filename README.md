# Adverayze Chat Application

A real-time chat application built as part of the Adverayze technical assignment. Features include sending/receiving messages, deleting messages (for self and everyone), pinning messages, and real-time updates using WebSockets.

## Tech Stack

- **Frontend**: Next.js 14, React 18, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB (MongoDB Atlas)
- **Real-time**: Socket.io for WebSocket communication
- **Deployment**: Vercel (Frontend), Render (Backend)

## Features

### Core Features
- Send and receive messages in real-time
- Display message content and timestamp
- Delete messages for self only
- Delete messages for everyone
- Pin/unpin important messages
- Pinned messages sidebar

### Technical Features
- Real-time updates without page refresh
- Efficient handling of 100+ messages
- Input validation
- Data persistence across sessions

## Project Structure

```
chat-app/
├── backend/
│   ├── server.js          # Main server file
│   ├── package.json
│   └── .env              # Environment variables
│
└── frontend/
    ├── app/
    │   ├── page.js       # Main chat component
    │   ├── layout.js
    │   └── globals.css
    ├── package.json
    ├── next.config.js
    └── .env.local        # Environment variables
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | Fetch all messages (last 100) |
| GET | `/api/messages/pinned` | Fetch pinned messages |
| POST | `/api/messages` | Send a new message |
| DELETE | `/api/messages/:id` | Delete a message |
| PUT | `/api/messages/:id/pin` | Pin/unpin a message |

### API Request/Response Formats

**POST /api/messages**
```json
Request: { "content": "Hello", "userId": "user-123" }
Response: { "id": "...", "content": "Hello", "timestamp": "...", "isPinned": false }
```

**DELETE /api/messages/:id**
```json
Request: { "userId": "user-123", "deleteForEveryone": false }
Response: { "message": "Message deleted for user" }
```

**PUT /api/messages/:id/pin**
```json
Request: { "isPinned": true }
Response: { "id": "...", "isPinned": true }
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB account (MongoDB Atlas)

### Backend Setup
```bash
cd backend
npm install
# Add your MongoDB URI in .env file
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend (.env)**
```
PORT=3001
MONGODB_URI=your_mongodb_connection_string
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=your_backend_url
NEXT_PUBLIC_SOCKET_URL=your_backend_url
```

## Design Decisions

1. **Socket.io for Real-time**: Chosen for its simplicity and reliability in establishing WebSocket connections
2. **MongoDB**: Flexible schema for message storage, easy to scale
3. **Next.js**: Server-side rendering, automatic code splitting, excellent developer experience
4. **UUID for User IDs**: Each browser session gets a unique ID for message ownership tracking
5. **Soft Deletes**: Messages are marked as deleted rather than hard-deleted for audit purposes

## Tradeoffs and Assumptions

- **Assumption**: Single chat room (no multiple conversation support)
- **Tradeoff**: Used simple UUID-based user identification instead of full authentication
- **Limitation**: No message editing (only delete and pin)
- **Real-time**: Used polling fallback would require additional implementation

## Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render with MongoDB Atlas

## Live Application

[Chat Application URL](https://adverayze-chat.vercel.app)

## Future Improvements

- User authentication system
- Multiple chat rooms/channels
- Message editing
- File/image attachments
- Read receipts
- Typing indicators
- Message search functionality