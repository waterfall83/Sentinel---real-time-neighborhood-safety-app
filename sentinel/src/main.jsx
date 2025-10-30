import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import * as Toast from '@radix-ui/react-toast'

function GlobalToast() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    function handler(e) {
      const d = e.detail || {};
      setTitle(d.title || "");
      setDescription(d.description || "");
      setOpen(true);
    }
    window.addEventListener('sentinel-show-toast', handler);
    return () => window.removeEventListener('sentinel-show-toast', handler);
  }, []);

  return (
    <Toast.Root className="ToastRoot" open={open} onOpenChange={setOpen}>
      <Toast.Title className="ToastTitle">{title}</Toast.Title>
      <Toast.Description className="ToastDescription">{description}</Toast.Description>
      <Toast.Action className="ToastAction" asChild altText="Undo">
        <button className="OKbutton" onClick={() => setOpen(false)}>OK.</button>
      </Toast.Action>
    </Toast.Root>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toast.Provider swipeDirection="right">
      <App />
      <GlobalToast />
      <Toast.Viewport className="ToastViewport" />
    </Toast.Provider>
  </StrictMode>,
)