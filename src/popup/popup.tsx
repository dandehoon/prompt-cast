import React from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './components/PopupApp';

// Initialize React app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('react-root');
  if (container) {
    const root = createRoot(container);
    root.render(React.createElement(PopupApp));
  } else {
    console.error('React root element not found');
  }
});
