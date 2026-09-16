import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <AdminAuthProvider>
      <CustomerAuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CustomerAuthProvider>
    </AdminAuthProvider>
  );
}

export default App;
