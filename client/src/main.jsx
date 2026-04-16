import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ResolveItAuthProvider } from './lib/auth.jsx'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ResolveItAuthProvider>
          <App />
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'glass-card',
              style: {
                background: 'rgba(10, 15, 30, 0.9)',
                color: '#fff',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }
            }} 
          />
        </ResolveItAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
