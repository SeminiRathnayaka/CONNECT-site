import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { NotificationsProvider } from './hooks/useNotifications';
import { IntroSplash } from './components/layout/IntroSplash';

function Root() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationsProvider>
            {introDone ? null : <IntroSplash onDone={() => setIntroDone(true)} />}
            <App />
          </NotificationsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
