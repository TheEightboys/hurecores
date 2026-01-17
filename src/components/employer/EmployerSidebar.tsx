import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ICONS } from '../../constants';

interface EmployerSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    userRole: string;
}

const EmployerSidebar: React.FC<EmployerSidebarProps> = ({ isOpen, setIsOpen, userRole }) => {
    const menuSections = [
        {
            title: 'Main',
            items: [
                { name: 'Dashboard', icon: NAVIGATION_ICONS.Dashboard, path: '/employer', end: true },
                { name: 'Staff', icon: NAVIGATION_ICONS.Staff, path: '/employer/staff' },
                { name: 'Schedule', icon: NAVIGATION_ICONS.Schedule, path: '/employer/schedule' },
                { name: 'Attendance', icon: NAVIGATION_ICONS.Attendance, path: '/employer/attendance' },
            ]
        },
        {
            title: 'Finance',
            items: [
                { name: 'Payroll', icon: NAVIGATION_ICONS.Payroll, path: '/employer/payroll' },
                { name: 'Leave', icon: NAVIGATION_ICONS.Leave, path: '/employer/leave' },
                { name: 'Billing', icon: NAVIGATION_ICONS.Billing, path: '/employer/billing' },
            ]
        },
        {
            title: 'Admin',
            items: [
                { name: 'Organization', icon: '🏢', path: '/employer/organization' },
                { name: 'Locations', icon: '📍', path: '/employer/locations' },
                { name: 'Permissions', icon: '🔐', path: '/employer/permissions' },
                { name: 'Settings', icon: NAVIGATION_ICONS.Settings, path: '/employer/settings' },
            ]
        }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/50 z-20 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-30 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isOpen ? 'w-64' : 'w-20 lg:w-20 -translate-x-full lg:translate-x-0'}`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                    {isOpen ? (
                        <span className="text-xl font-bold text-blue-600 font-display">HURE</span>
                    ) : (
                        <span className="text-xl font-bold text-blue-600 font-display mx-auto">H</span>
                    )}
                    <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <nav className="flex-grow overflow-y-auto py-4 space-y-6">
                    {menuSections.map((section) => (
                        <div key={section.title}>
                            {isOpen ? (
                                <div className="px-6 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    {section.title}
                                </div>
                            ) : (
                                <div className="h-4"></div> // Spacer for collapsed mode
                            )}

                            <div className="space-y-1 px-3">
                                {section.items.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        end={item.end}
                                        className={({ isActive }) => `flex items-center px-3 py-2.5 rounded-xl transition-all ${isActive
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                                            {typeof item.icon === 'string' ? item.icon : item.icon}
                                        </div>
                                        {isOpen && <span className="ml-3 font-semibold text-sm">{item.name}</span>}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer / Toggle for Desktop */}
                <div className="p-4 border-t border-slate-100 hidden lg:flex justify-end">
                    <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                        {isOpen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default EmployerSidebar;
