import React from 'react';
import { NavLink } from 'react-router-dom';

const ManagerDashboard: React.FC = () => {
    const stats = [
        { title: 'Pending Leave', count: 5, icon: '🏖️', color: 'bg-blue-100 text-blue-700', link: '/employee/manager/leave' },
        { title: 'Compliance Issues', count: 3, icon: '⚠️', color: 'bg-red-100 text-red-700', link: '/employee/manager/staff' },
        { title: 'Expiring Licenses', count: 2, icon: '📄', color: 'bg-amber-100 text-amber-700', link: '/employee/manager/documents' },
        { title: 'Pending Onboarding', count: 4, icon: '👋', color: 'bg-green-100 text-green-700', link: '/employee/manager/staff' },
        { title: 'Absent Today', count: 1, icon: '🚫', color: 'bg-purple-100 text-purple-700', link: '/employee/manager/schedule' },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Manager Dashboard</h2>
                <p className="text-slate-500">Overview of team performance and HR tasks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <NavLink
                        key={i}
                        to={stat.link}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <div className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                Manage
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 mb-1">{stat.count}</div>
                        <div className="text-sm font-bold text-slate-500">{stat.title}</div>
                    </NavLink>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                        {[
                            { user: 'Sarah Johnson', action: 'requested annual leave', time: '2 hours ago', icon: '🏖️' },
                            { user: 'James Mwangi', action: 'clocked in late (15m)', time: '4 hours ago', icon: '⏰' },
                            { user: 'Grace Wanjiku', action: 'updated emergency contact', time: 'Yesterday', icon: '📝' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center space-x-4 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-lg">
                                    {item.icon}
                                </div>
                                <div>
                                    <div className="text-sm text-slate-900">
                                        <span className="font-bold">{item.user}</span> {item.action}
                                    </div>
                                    <div className="text-xs text-slate-400 font-bold uppercase mt-1">{item.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-4">Today's Coverage</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-slate-300">Morning Shift</span>
                                <span className="font-bold text-green-400">12/12 Staff</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-slate-300">Afternoon Shift</span>
                                <span className="font-bold text-amber-400">10/12 Staff</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-slate-300">Night Shift</span>
                                <span className="font-bold text-blue-400">8/8 Staff</span>
                            </div>
                        </div>
                        <button className="w-full mt-8 bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors">
                            View Schedule
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
