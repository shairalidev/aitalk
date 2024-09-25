import React, { useState } from 'react';

function Settings() {
  const [language, setLanguage] = useState('es');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="settings-container">
      <h2>Ajustes</h2>
      <div className="setting-item">
        <label htmlFor="language">Idioma:</label>
        <select 
          id="language" 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="setting-item">
        <label htmlFor="theme">Tema:</label>
        <select 
          id="theme" 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>
      <div className="setting-item">
        <label htmlFor="notifications">Notificaciones:</label>
        <input 
          type="checkbox" 
          id="notifications" 
          checked={notifications} 
          onChange={(e) => setNotifications(e.target.checked)} 
        />
      </div>
    </div>
  );
}

export default Settings;