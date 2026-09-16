import React from 'react';
import { Outlet } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';

const CustomerLayout = () => {
  return (
    <div className="customer-wrapper d-flex flex-column min-vh-100 bg-light">
      <CustomerNavbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <CustomerFooter />
    </div>
  );
};

export default CustomerLayout;
