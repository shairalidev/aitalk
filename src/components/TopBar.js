import React from 'react';
import './TopBar.css';

function TopBar({ onNewChat, onToggleSidebar }) {
  return (
    <div className="top-bar">
      <div className="left-section">
        <button className="mobile-menu-toggle" onClick={onToggleSidebar}>☰</button>
        <div className="logo">Jesús, Guíame</div>
      </div>
      <button className="new-chat-btn" onClick={onNewChat}>Nuevo Chat</button>
    </div>
  );
}

export default TopBar;