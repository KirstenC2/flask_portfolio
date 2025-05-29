import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faEnvelopeOpen, 
  faTrash, 
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import './MessagesPanel.css';

const MessagesPanel = ({ onMessageRead }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  useEffect(() => {
    fetchMessages();
  }, []);
  
  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    
    // If message is unread, mark it as read
    if (!message.read) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:5001/api/admin/messages/${message.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ read: true })
        });
        
        if (response.ok) {
          // Update message in state
          setMessages(messages.map(msg => 
            msg.id === message.id ? { ...msg, read: true } : msg
          ));
          
          // Update unread count in parent component
          if (onMessageRead) onMessageRead();
        }
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }
  };
  
  const handleDeleteMessage = async (id, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove message from state
        setMessages(messages.filter(msg => msg.id !== id));
        
        // Clear selected message if it was deleted
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(null);
        }
        
        // Update unread count in parent component
        if (onMessageRead) onMessageRead();
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message. Please try again.');
    }
  };
  
  const filteredMessages = messages.filter(msg => {
    // Filter by status
    if (filterStatus === 'read' && !msg.read) return false;
    if (filterStatus === 'unread' && msg.read) return false;
    
    // Filter by text
    if (filterText) {
      const text = filterText.toLowerCase();
      return (
        msg.name.toLowerCase().includes(text) ||
        msg.email.toLowerCase().includes(text) ||
        msg.subject.toLowerCase().includes(text) ||
        msg.message.toLowerCase().includes(text)
      );
    }
    
    return true;
  });
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="messages-panel">
      <div className="messages-filter">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Search messages..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        
        <div className="status-filter">
          <button 
            className={filterStatus === 'all' ? 'active' : ''} 
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button 
            className={filterStatus === 'unread' ? 'active' : ''} 
            onClick={() => setFilterStatus('unread')}
          >
            Unread
          </button>
          <button 
            className={filterStatus === 'read' ? 'active' : ''} 
            onClick={() => setFilterStatus('read')}
          >
            Read
          </button>
        </div>
      </div>
      
      <div className="messages-container">
        <div className="messages-list">
          {loading ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading messages...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <FontAwesomeIcon icon={faTimesCircle} />
              <p>{error}</p>
              <button onClick={fetchMessages}>Try Again</button>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faEnvelope} />
              <p>No messages found</p>
              {filterText || filterStatus !== 'all' ? (
                <button onClick={() => {
                  setFilterText('');
                  setFilterStatus('all');
                }}>Clear filters</button>
              ) : null}
            </div>
          ) : (
            <ul>
              {filteredMessages.map(message => (
                <li 
                  key={message.id} 
                  className={`message-item ${!message.read ? 'unread' : ''} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="message-icon">
                    <FontAwesomeIcon icon={message.read ? faEnvelopeOpen : faEnvelope} />
                  </div>
                  <div className="message-preview">
                    <div className="message-header">
                      <span className="sender-name">{message.name}</span>
                      <span className="message-date">{formatDate(message.date_received)}</span>
                    </div>
                    <div className="message-subject">{message.subject}</div>
                    <div className="message-snippet">{message.message.substring(0, 60)}...</div>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={(e) => handleDeleteMessage(message.id, e)}
                    title="Delete message"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="message-detail">
          {selectedMessage ? (
            <>
              <div className="detail-header">
                <h2>{selectedMessage.subject}</h2>
                <div className="message-meta">
                  <p>
                    From: <strong>{selectedMessage.name}</strong> 
                    (<a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>)
                  </p>
                  <p>Received: {formatDate(selectedMessage.date_received)}</p>
                </div>
              </div>
              <div className="detail-body">
                <p>{selectedMessage.message}</p>
              </div>
              <div className="detail-actions">
                <button onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                  Reply by Email
                </button>
                <button onClick={() => handleDeleteMessage(selectedMessage.id, { stopPropagation: () => {} })}>
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </div>
            </>
          ) : (
            <div className="no-message-selected">
              <FontAwesomeIcon icon={faEnvelope} />
              <p>Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPanel;
