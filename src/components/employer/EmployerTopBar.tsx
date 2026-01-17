import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface EmployerTopBarProps {
    user: any;
    sidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
}

const EmployerTopBar: React.FC<EmployerTopBarProps> = ({ user, sidebarOpen, setSidebarOpen }) => {
    const { logout } = useAuth();
    const planName = "Professional"; // Mock plan

    return (
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10">
            <div className="flex items-center">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="mr-4 lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>

                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">MedCare Clinics Group</h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 rounded border border-emerald-100">
                            {planName} Plan
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                {/* Location Dropdown - Mock */}
                <div className="hidden md:flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-lg mr-2">📍</span>
                    <select className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none">
                        <option>All Locations</option>
                        <option>Nairobi West</option>
                        <option>Mombasa Branch</option>
                    </select>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

                <div className="flex items-center space-x-3 group relative">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-bold text-slate-900">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-slate-500">{user.role}</div>
                    </div>
                    <button className="relative">
                        <img src={user.avatar} className="w-9 h-9 rounded-full border border-slate-200 shadow-sm" alt="Profile" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <button
                            onClick={logout}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 first:rounded-t-xl last:rounded-b-xl flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default EmployerTopBar;
