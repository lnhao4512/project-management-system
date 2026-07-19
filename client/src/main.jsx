import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './redux/store'
import App from './App.jsx'
import './index.css'

// Set default theme on first load
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
localStorage.setItem('theme', savedTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-dark-900)',
              color: 'var(--color-dark-50)',
              border: '1px solid var(--color-dark-700)',
              borderRadius: '12px',
              fontSize: '14px',
              backdropFilter: 'blur(12px)',
              boxShadow: 'var(--shadow-card)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#161b27' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#161b27' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
