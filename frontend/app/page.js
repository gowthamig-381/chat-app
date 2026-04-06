'use client';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import './globals.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [userId] = useState(() => uuidv4());
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('new_message', (message) => {
      if (!message.deletedForEveryone) {
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('message_deleted', (data) => {
      if (data.deleteForEveryone) {
        setMessages(prev => prev.filter(m => m.id !== data.id));
        setPinnedMessages(prev => prev.filter(m => m.id !== data.id));
      } else {
        setMessages(prev => prev.filter(m => m.id !== data.id || m.usersWhoDeleted?.includes(userId)));
      }
    });

    newSocket.on('message_pinned', (data) => {
      setMessages(prev => prev.map(m => 
        m.id === data.id ? { ...m, isPinned: data.isPinned } : m
      ));
      fetchPinnedMessages();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    fetchMessages();
    fetchPinnedMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages`);
      const data = await res.json();
      setMessages(data.filter(m => !m.usersWhoDeleted?.includes(userId)));
      setLoading(false);
    } catch (error) {
      showToast('Failed to fetch messages');
      setLoading(false);
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages/pinned`);
      const data = await res.json();
      setPinnedMessages(data.filter(m => !m.usersWhoDeleted?.includes(userId)));
    } catch (error) {
      console.error('Failed to fetch pinned messages');
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputValue, userId })
      });
      
      if (res.ok) {
        setInputValue('');
      } else {
        showToast('Failed to send message');
      }
    } catch (error) {
      showToast('Failed to send message');
    }
  };

  const deleteMessage = async (messageId, deleteForEveryone) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deleteForEveryone })
      });
      
      if (res.ok) {
        if (deleteForEveryone) {
          showToast('Message deleted for everyone');
        } else {
          showToast('Message deleted for you');
        }
      }
    } catch (error) {
      showToast('Failed to delete message');
    }
  };

  const togglePin = async (messageId, isPinned) => {
    try {
      await fetch(`${API_URL}/api/messages/${messageId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isPinned })
      });
    } catch (error) {
      showToast('Failed to pin message');
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="root">
      <header className="header">Adverayze Chat</header>
      
      <div className="main-container">
        <aside className="sidebar">
          <div className="sidebar-title">Pinned Messages ({pinnedMessages.length})</div>
          <div className="pinned-list">
            {pinnedMessages.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                No pinned messages
              </div>
            ) : (
              pinnedMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className="pinned-item"
                  onClick={() => goToMessage(msg.id)}
                >
                  <div className="pinned-item-content">{msg.content}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="chat-container">
          <div className="messages-area">
            {loading ? (
              <div className="empty-state">
                <div>Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <div>No messages yet. Start the conversation!</div>
              </div>
            ) : (
              messages.map(msg => (
                <div 
                  key={msg.id} 
                  id={`message-${msg.id}`}
                  className={`message ${msg.isPinned ? 'pinned' : ''}`}
                >
                  <div className="message-header">
                    {msg.isPinned && <span className="pin-icon">📌</span>}
                    <span className="timestamp">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="message-content">{msg.content}</div>
                  <div className="message-actions">
                    <button 
                      className="action-btn pin"
                      onClick={() => togglePin(msg.id, msg.isPinned)}
                    >
                      {msg.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button 
                      className="action-btn delete-me"
                      onClick={() => deleteMessage(msg.id, false)}
                    >
                      Delete for Me
                    </button>
                    <button 
                      className="action-btn delete-all"
                      onClick={() => deleteMessage(msg.id, true)}
                    >
                      Delete for All
                    </button>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <input
              type="text"
              className="input-field"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className="send-btn" 
              onClick={sendMessage}
              disabled={!inputValue.trim()}
            >
              Send
            </button>
          </div>
        </main>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}