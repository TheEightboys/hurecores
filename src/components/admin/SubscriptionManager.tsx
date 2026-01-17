import React, { useState } from 'react';

interface Subscription {
    id: string;
    clinic: string;
    plan: string;
    amount: number;
    status: 'Active' | 'Suspended' | 'Cancelled';
    nextBilling: string;
}

const SubscriptionManager: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([
        { id: 'SUB-001', clinic: 'Care Health Facility', plan: 'Care Professional', amount: 25000, status: 'Active', nextBilling: '2025-02-02' },
        { id: 'SUB-002', clinic: 'Nairobi West Clinic', plan: 'Essential', amount: 4500, status: 'Active', nextBilling: '2025-02-02' },
        { id: 'SUB-003', clinic: 'Sunrise Pediatric', plan: 'Care Standard', amount: 12000, status: 'Suspended', nextBilling: '2025-02-01' },
    ]);

    const handleStatusChange = (id: string, newStatus: Subscription['status']) => {
        setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: newStatus } : s));
    };

    const totalMRR = subscriptions
        .filter(s => s.status === 'Active')
        .reduce((sum, s) => sum + s.amount, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Subscriptions</h2>
                    <p className="text-slate-500">Manage recurring billing and plans.</p>
                </div>
                <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-lg">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total MRR</div>
                    <div className="text-2xl font-bold">KES {totalMRR.toLocaleString()}</div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Clinic Name</th>
                            <th className="px-6 py-4">Current Plan</th>
                            <th className="px-6 py-4">Monthly Fee</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Next Billing</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {subscriptions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">{sub.clinic}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${sub.plan.includes('Care') ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        {sub.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-600">KES {sub.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${sub.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                                            sub.status === 'Suspended' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">{sub.nextBilling}</td>
                                <td className="px-6 py-4 text-right">
                                    <select
                                        className="bg-white border border-slate-200 rounded-lg text-xs font-bold py-1 px-2 text-slate-700 outline-none focus:border-blue-500"
                                        value={sub.status}
                                        onChange={(e) => handleStatusChange(sub.id, e.target.value as any)}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Suspended">Suspend</option>
                                        <option value="Cancelled">Cancel</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SubscriptionManager;
