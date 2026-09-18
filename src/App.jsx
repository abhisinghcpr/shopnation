import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import AppRoutes from './routes/AppRoutes';

/**
 * App root.
 * BrowserRouter is the outermost wrapper so that all providers and components
 * inside have access to router context (useNavigate, useLocation, etc.).
 */
function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <CustomerAuthProvider>
          <AppRoutes />
        </CustomerAuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
