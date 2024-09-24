import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/SideBar';
import ChatArea from './components/ChatArea';
import { fetchChatHistory, createNewChat } from './api';
import './App.css';
import highQualityImage from './img/bg.png';
function App() {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (chats.length === 0) {
      handleNewChat();
    } else if (!currentChatId) {
      setCurrentChatId(chats[0].id);
    }
  }, [chats, currentChatId]);

  const loadChatHistory = async () => {
    const history = await fetchChatHistory();
    setChats(history);
  };

  const handleNewChat = async () => {
    const newChat = await createNewChat();
    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChatId(newChat.id);
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="app">
      <img src={highQualityImage} alt="Background" className="bg-image" />
      <div className="overlay"></div>
      <TopBar onNewChat={handleNewChat} />
      <div className="main-content">
        <Sidebar chats={chats} onSelectChat={handleSelectChat} currentChatId={currentChatId} />
        <ChatArea chatId={currentChatId} />
      </div>
    </div>
  );
}

export default App;