import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                {/* Top Navbar Mobile */}
                <header className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary-600">
                        <span>SysAdmin</span>
                    </div>
                    <button onClick={toggleSidebar} className="text-slate-600 p-2">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Page Content */}
                <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>

                {/* Footer */}
                <footer className="mt-auto p-6 text-center text-slate-400 text-xs border-t border-slate-100 bg-white">
                    &copy; 2026 New Century Builders S.A. | V.1.0.0
                </footer>
            </main>
        </div>
    );
};

export default Layout;
