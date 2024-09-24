import React, { useState, useEffect } from 'react';
import './Sidebar.css';

function Sidebar({ chats, onSelectChat, currentChatId }) {
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
    { title: 'FAQ', icon: '📚' },
    { title: 'Subscription', icon: '💳' },
    { title: 'Settings', icon: '⚙️' },
    { title: 'Logout', icon: '🚪' },
  ];

  return (
    <>
      {isMobile && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isVisible ? '✖' : '☰'}
        </button>
      )}
      <div className={`sidebar ${isVisible ? 'show' : ''}`}>
        <div className="sidebar-header">
          {/* Your header content */}
        </div>
        <div className="sidebar-section">
          <h2>RECENT CHATS</h2>
          <ul className="recent-list">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    if (isMobile) setIsVisible(false);
                  }}
                  className={chat.id === currentChatId ? 'active' : ''}
                >
                  <span className="icon">💬</span>
                  {chat.title || 'New Chat'}
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
              <li key={index} className="menu-item">
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