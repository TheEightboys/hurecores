import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface AdminTopBarProps {
    toggleSidebar: () => void;
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ toggleSidebar }) => {
    const { logout, user } = useAuth();
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 lg:px-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="hidden md:block">
                    <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentDate}</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Quick visual indicator of Super Admin status */}
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-900">{user?.name || 'Super Admin'}</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wide">System Owner</span>
                </div>

                <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-all group"
                >
                    <span>Logout</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        </header>
    );
};

export default AdminTopBar;
