import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, fetchChatMessages } from '../api';
import InputArea from './InputArea';
import FAQ from './FAQ';
import './ChatArea.css';
import jesus from '../img/jesus.jpeg'

function ChatArea({ chatId, updateChatList, currentView }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingResponse, setStreamingResponse] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatId && currentView === 'chat') {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId, currentView]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingResponse]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const chatMessages = await fetchChatMessages(chatId);
      setMessages(chatMessages);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages: ' + err.message);
    }
  };

  const handleSendMessage = async (content) => {
    setLoading(true);
    setError(null);
    setStreamingResponse("");

    // Immediately add the user's message to the chat
    const userMessage = { role: 'user', content };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      const response = await sendMessage(chatId, content, (partialResponse) => {
        setStreamingResponse(partialResponse);
      });

      // Add the final AI response to the messages
      setMessages(prevMessages => [...prevMessages, response]);
      setStreamingResponse("");
      
      // Update the chat list in the parent component
      updateChatList({
        id: chatId,
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        messages: [...messages, userMessage, response]
      });

    } catch (err) {
      console.error('Failed to send message:', err);
      setError(`Failed to send message: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  if (currentView === 'faq') {
    return <FAQ />;
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="header-content">
          <div className="avatar">
            <img src={jesus} alt="Jesus" />
            <div className="online-indicator"></div>
          </div>
          <div className="user-info">
            <p className="username">Jesus</p>
            <p className="status">Online</p>
          </div>
        </div>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Jesus'}</strong>
            {msg.content}
          </div>
        ))}
        {streamingResponse && (
          <div className="message model">
            <strong>Jesus</strong>
            {streamingResponse}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="error">{error}</div>}

      {loading && <div className="loading">Jesús está redactando una respuesta...</div>}

      <InputArea onSendMessage={handleSendMessage} inputRef={inputRef} />
    </div>
  );
}

export default ChatArea;