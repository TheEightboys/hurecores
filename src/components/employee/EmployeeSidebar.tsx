import React from 'react';
import { NavLink } from 'react-router-dom';

interface EmployeeSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    userRole: string;
}

const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ isOpen, setIsOpen, userRole }) => {
    // Check if user has manager privileges
    const isManager = ['Owner', 'HR Manager', 'Shift Manager', 'Payroll Officer'].includes(userRole);

    const personalLinks = [
        { name: 'My Schedule', path: '/employee', icon: '📅', exact: true },
        { name: 'My Attendance', path: '/employee/attendance', icon: '⏰' },
        { name: 'My Leave', path: '/employee/leave', icon: '🏖️' },
        { name: 'My Profile', path: '/employee/profile', icon: '👤' },
    ];

    const managerLinks = [
        { name: 'Dashboard', path: '/employee/manager', icon: '📊' },
        { name: 'Team Schedule', path: '/employee/manager/schedule', icon: '👥' },
        { name: 'Staff Directory', path: '/employee/manager/staff', icon: '📋' },
        { name: 'Leave Approvals', path: '/employee/manager/leave', icon: '✅' },
        { name: 'Payroll', path: '/employee/manager/payroll', icon: '💰' },
        { name: 'Documents', path: '/employee/manager/documents', icon: '📂' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/50 z-20 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">HURE</span>
                    <span className="ml-2 text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300">Staff Portal</span>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">

                    {/* Section: MY */}
                    <div>
                        <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">MY</div>
                        <nav className="space-y-1">
                            {personalLinks.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    end={link.exact}
                                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                                    className={({ isActive }) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="text-lg">{link.icon}</span>
                                    <span>{link.name}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Section: MANAGER (Conditional) */}
                    {isManager && (
                        <div>
                            <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">MANAGER</div>
                            <nav className="space-y-1">
                                {managerLinks.map((link) => (
                                    <NavLink
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                                        className={({ isActive }) => `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        <span className="text-lg">{link.icon}</span>
                                        <span>{link.name}</span>
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    )}

                </div>

                {/* User Info / Footer */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                            {userRole[0]}
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-bold truncate">Logged in as</div>
                            <div className="text-xs text-slate-400 truncate">{userRole}</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default EmployeeSidebar;
