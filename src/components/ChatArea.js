import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, fetchChatMessages } from '../api';
import InputArea from './InputArea';
import './ChatArea.css';
import jesus from '../img/jesus.jpeg'
function ChatArea({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingResponse, setStreamingResponse] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId]);

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

    try {
      const userMessage = { role: 'user', content };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);

      let aiResponse = "";
      await sendMessage(chatId, content, (partialResponse) => {
        setStreamingResponse(partialResponse);
        aiResponse = partialResponse;
      });

      console.log("AI response:", aiResponse); // Debugging

      if (aiResponse.trim() === "") {
        throw new Error("Received empty response from AI");
      }

      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'model', content: aiResponse }
      ]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(`Failed to send message: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
      setStreamingResponse("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="chat-area">
      <div class="chat-header">
        <div class="header-content">
            <div class="avatar">
                <img src={jesus} alt="Jesus"></img>
                <div class="online-indicator"></div>
            </div>
            <div class="user-info">
                <p class="username">Jesus</p>
                <p class="status">Online</p>
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

      {loading && <div className="loading">Jesus is composing a response...</div>}

      <InputArea onSendMessage={handleSendMessage} inputRef={inputRef} />
    </div>
  );
}

export default ChatArea;