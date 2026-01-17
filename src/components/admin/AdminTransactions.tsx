import React from 'react';

interface Transaction {
    id: string;
    clinic: string;
    email: string;
    plan: string;
    amount: string;
    status: 'Completed' | 'Pending' | 'Failed';
    date: string;
    method: string;
}

const AdminTransactions: React.FC = () => {
    const transactions: Transaction[] = [
        { id: 'TXN-8823', clinic: 'Care Health Facility', email: 'admin@care.com', plan: 'Care Professional', amount: '25,000', status: 'Completed', date: '2025-01-02', method: 'M-Pesa' },
        { id: 'TXN-8822', clinic: 'Nairobi West Clinic', email: 'nwcpp@gmail.com', plan: 'Essential', amount: '4,500', status: 'Pending', date: '2025-01-02', method: 'Bank Transfer' },
        { id: 'TXN-8821', clinic: 'Sunrise Pediatric', email: 'info@sunrise.com', plan: 'Care Standard', amount: '12,000', status: 'Completed', date: '2025-01-01', method: 'Card' },
        { id: 'TXN-8819', clinic: 'Mombasa Road Medical', email: 'info@mrm.co.ke', plan: 'Professional', amount: '8,500', status: 'Failed', date: '2024-12-31', method: 'M-Pesa' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Transactions</h2>
                <p className="text-slate-500">History of all platform payments and invoices.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Transaction ID</th>
                            <th className="px-6 py-4">Clinic / Payer</th>
                            <th className="px-6 py-4">Plan Item</th>
                            <th className="px-6 py-4">Amount (KES)</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.map((txn) => (
                            <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-mono font-bold text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded w-fit">{txn.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{txn.clinic}</div>
                                    <div className="text-xs text-slate-500">{txn.method}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${txn.plan.includes('Care') ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                        {txn.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900">
                                    {txn.amount}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 text-xs font-bold uppercase ${txn.status === 'Completed' ? 'text-green-600' :
                                            txn.status === 'Pending' ? 'text-amber-600' : 'text-red-500'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${txn.status === 'Completed' ? 'bg-green-600' :
                                                txn.status === 'Pending' ? 'bg-amber-600' : 'bg-red-500'
                                            }`}></span>
                                        {txn.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-slate-500 font-mono">
                                    {txn.date}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {transactions.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-bold">No transactions found.</div>
            )}
        </div>
    );
};

export default AdminTransactions;
