import React, { useState } from 'react';

const ManagerPayroll: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Salaried' | 'Daily' | 'Hourly'>('Salaried');

    // Mock Data (Same structure as Employer view)
    const payrollData = [
        { id: 1, name: 'Sarah Johnson', role: 'Shift Manager', type: 'Salaried', worked: '22 Days', rate: 'KES 80,000/mo', total: 'KES 80,000', status: 'Paid' },
        { id: 2, name: 'James Mwangi', role: 'Staff', type: 'Daily', worked: '18 Days', rate: 'KES 2,500/day', total: 'KES 45,000', status: 'Unpaid' },
        { id: 3, name: 'Grace Wanjiku', role: 'Nurse', type: 'Hourly', worked: '120 Hours', rate: 'KES 500/hr', total: 'KES 60,000', status: 'Unpaid' },
        { id: 4, name: 'David Ochieng', role: 'Staff', type: 'Daily', worked: '20 Days', rate: 'KES 2,000/day', total: 'KES 40,000', status: 'Paid' },
    ];

    const filteredData = payrollData.filter(item => item.type === activeTab);

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Team Payroll</h2>
                    <p className="text-slate-500">View payroll status for your team (Read Only).</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
                        <span>📥</span>
                        <span>Export CSV</span>
                    </button>
                    <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">
                        <option>January 2025</option>
                        <option>December 2024</option>
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                {['Salaried', 'Daily', 'Hourly'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        {tab} Staff
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Staff Member</th>
                                <th className="px-6 py-4">Work Summary</th>
                                <th className="px-6 py-4">Rate</th>
                                <th className="px-6 py-4">Total Due</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length > 0 ? filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                                                {item.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{item.name}</div>
                                                <div className="text-xs text-slate-500">{item.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{item.worked}</td>
                                    <td className="px-6 py-4 text-slate-600">{item.rate}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{item.total}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No staff found for this category.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerPayroll;
