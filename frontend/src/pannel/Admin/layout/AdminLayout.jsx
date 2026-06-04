import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import { useLocalStorage } from "../../../hooks/useLocalStorage";

function AdminLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage(
    "adminSidebarCollapsed",
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header stays at the top */}
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar stays fixed on the left */}
        <Sidebar isCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />

        {/* Overlay backdrop on mobile when sidebar is open */}
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        {/* Main content area scrolls independently */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 flex flex-col w-full">
          <div className="flex-1 p-4 md:p-6">{children || <Outlet />}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
