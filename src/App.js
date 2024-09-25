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
  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'faq'

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
    setCurrentView('chat');
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    setCurrentView('chat');
  };

  const updateChatList = (updatedChat) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      )
    );
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="app">
      <img src={highQualityImage} alt="Background" className="bg-image" />
      <div className="overlay"></div>
      <TopBar onNewChat={handleNewChat} />
      <div className="main-content">
        <Sidebar 
          chats={chats} 
          onSelectChat={handleSelectChat} 
          currentChatId={currentChatId}
          onViewChange={handleViewChange}
          currentView={currentView}
        />
        <ChatArea 
          chatId={currentChatId} 
          updateChatList={updateChatList}
          currentView={currentView}
        />
      </div>
    </div>
  );
}

export default App;