import React, { useState, useEffect } from 'react';
import './Sidebar.css';

function Sidebar({ chats, onSelectChat, currentChatId, onViewChange, currentView }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isVisible, setIsVisible] = useState(!isMobile);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsVisible(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsVisible(!isVisible);
  };

  const menuItems = [
    { title: 'Chats', icon: '💬', view: 'chat' },
    { title: 'FAQ', icon: '📚', view: 'faq' }
  ];

  // Filter out duplicate chats and remove empty chats (no messages)
  const uniqueChats = Array.from(new Set(chats.map(chat => chat.id)))
    .map(id => chats.find(chat => chat.id === id))
    .filter(chat => chat && chat.messages && chat.messages.length > 0);

  return (
    <>
      {isMobile && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isVisible ? '✖' : '☰'}
        </button>
      )}
      <div className={`sidebar ${isVisible ? 'show' : ''}`}>
        <div className="sidebar-header">
          <h1>Jesus, Guide Me</h1>
        </div>
        <div className="sidebar-section">
          <h2>RECENT CHATS</h2>
          <ul className="recent-list">
            {uniqueChats.length > 0 ? (
              uniqueChats.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    if (isMobile) setIsVisible(false);
                  }}
                  className={chat.id === currentChatId ? 'active' : ''}
                >
                  <span className="icon">💬</span>
                  {chat.title || 'New Conversation'}
                </li>
              ))
            ) : (
              <li>No recent chats</li> 
            )}
          </ul>
        </div>
        <div className="sidebar-footer">
          <ul className="menu-list">
            {menuItems.map((item, index) => (
              <li 
                key={index} 
                className={`menu-item ${currentView === item.view ? 'active' : ''}`}
                onClick={() => onViewChange(item.view)}
              >
                <span className="icon">{item.icon}</span>
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default Sidebar;