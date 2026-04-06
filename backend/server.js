require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isPinned: { type: Boolean, default: false },
  deletedForEveryone: { type: Boolean, default: false },
  deletedBy: { type: String, default: null },
  usersWhoDeleted: [{ type: String }]
});

const Message = mongoose.model('Message', messageSchema);

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      deletedForEveryone: false
    }).sort({ timestamp: -1 }).limit(100);
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages/pinned', async (req, res) => {
  try {
    const messages = await Message.find({
      isPinned: true,
      deletedForEveryone: false
    }).sort({ timestamp: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { content, userId } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }
    const message = new Message({
      id: uuidv4(),
      content: content.trim(),
      timestamp: new Date()
    });
    await message.save();
    io.emit('new_message', message);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, deleteForEveryone } = req.body;
    
    if (deleteForEveryone) {
      const message = await Message.findOne({ id });
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      message.deletedForEveryone = true;
      message.deletedBy = userId;
      await message.save();
      io.emit('message_deleted', { id, deleteForEveryone: true });
      res.json({ message: 'Message deleted for everyone' });
    } else {
      const message = await Message.findOne({ id });
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      if (!message.usersWhoDeleted.includes(userId)) {
        message.usersWhoDeleted.push(userId);
        await message.save();
      }
      io.emit('message_deleted', { id, userId, deleteForEveryone: false });
      res.json({ message: 'Message deleted for user' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/messages/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;
    const message = await Message.findOne({ id });
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    message.isPinned = isPinned;
    await message.save();
    io.emit('message_pinned', { id, isPinned });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };