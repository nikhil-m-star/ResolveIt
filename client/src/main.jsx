import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ResolveItAuthProvider } from './lib/auth.jsx'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient();

function NativeAuthBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const isNative = typeof window !== "undefined" && !!window.Capacitor?.isNative;
    if (!isNative) return undefined;

    let removeListener = null;
    let active = true;

    const setupListener = async () => {
      try {
        const [{ App: CapacitorApp }, { Browser }] = await Promise.all([
          import("@capacitor/app"),
          import("@capacitor/browser"),
        ]);

        const handler = await CapacitorApp.addListener("appUrlOpen", ({ url }) => {
          if (!url) return;

          try {
            const parsedUrl = new URL(url);
            const isResolveHost = parsedUrl.host === "resolve--it.vercel.app";
            if (!isResolveHost) return;

            const targetPath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
            Browser.close().catch(() => {});
            navigate(targetPath || "/dashboard", { replace: true });
            window.dispatchEvent(new Event("resolveit:auth-redirected"));
          } catch (err) {
            console.error("Failed handling deep-link callback", err);
          }
        });

        if (active) {
          removeListener = () => handler.remove();
        } else {
          handler.remove();
        }
      } catch (err) {
        console.error("Failed to initialize native auth bridge", err);
      }
    };

    setupListener();

    return () => {
      active = false;
      if (removeListener) removeListener();
    };
  }, [navigate]);

  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NativeAuthBridge />
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
