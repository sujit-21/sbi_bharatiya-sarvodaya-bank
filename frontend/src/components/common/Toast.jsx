import React from 'react';

export default function Toast({ toast }) {
  if (!toast || !toast.message) return null;

  return (
    <div id="toast" className={`toast ${toast.type || 'primary'}`}>
      {toast.message}
    </div>
  );
}
