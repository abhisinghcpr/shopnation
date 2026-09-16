import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="admin-wrapper d-flex flex-column min-vh-100 bg-light">
      {/* Top Navbar */}
      <AdminNavbar toggleSidebar={toggleSidebar} />

      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

        {/* Backdrop for mobile view */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 1040 }}
            onClick={closeSidebar}
          ></div>
        )}

        {/* Main Content Area */}
        <main className="main-content flex-grow-1 p-3 p-md-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
