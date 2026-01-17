import React, { useState } from 'react';

interface Clinic {
    id: number;
    name: string;
    email: string;
    plan: string;
    orgStatus: 'Verified' | 'Pending' | 'Unverified';
    accountStatus: 'Active' | 'Under Review' | 'Suspended';
    created: string;
}

const ClinicsManager: React.FC = () => {
    const [clinics, setClinics] = useState<Clinic[]>([
        { id: 1, name: 'Care Health Facility', email: 'admin@care.com', plan: 'Care Professional', orgStatus: 'Verified', accountStatus: 'Active', created: '2024-11-12' },
        { id: 2, name: 'Nairobi West Clinic', email: 'nwcpp@gmail.com', plan: 'Essential', orgStatus: 'Pending', accountStatus: 'Under Review', created: '2024-12-28' },
        { id: 3, name: 'Mombasa Road Medical', email: 'info@mrm.co.ke', plan: 'Care Standard', orgStatus: 'Unverified', accountStatus: 'Active', created: '2025-01-01' },
    ]);

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const openReview = (clinic: Clinic) => {
        setSelectedClinic(clinic);
        setRejectionReason('');
        setIsReviewModalOpen(true);
    };

    const handleReviewAction = (action: 'approve' | 'reject') => {
        if (selectedClinic) {
            setClinics(clinics.map(c => c.id === selectedClinic.id ? {
                ...c,
                accountStatus: action === 'approve' ? 'Active' : 'Suspended',
                orgStatus: action === 'approve' ? 'Verified' : 'Unverified'
            } : c));
            setIsReviewModalOpen(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">All Clinics <span className="text-slate-400 text-lg ml-2">({clinics.length})</span></h2>
                    <p className="text-slate-500">Master list of registered healthcare facilities.</p>
                </div>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50">⬇ Export CSV</button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Clinic Name</th>
                            <th className="px-6 py-4">Current Plan</th>
                            <th className="px-6 py-4">Verification</th>
                            <th className="px-6 py-4">Account Status</th>
                            <th className="px-6 py-4">Joined On</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {clinics.map((clinic) => (
                            <tr key={clinic.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{clinic.name}</div>
                                    <div className="text-xs text-slate-500">{clinic.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${clinic.plan.includes('Care') ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        {clinic.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${clinic.orgStatus === 'Verified' ? 'bg-green-100 text-green-700' :
                                            clinic.orgStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {clinic.orgStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 text-sm font-bold ${clinic.accountStatus === 'Active' ? 'text-green-600' :
                                            clinic.accountStatus === 'Under Review' ? 'text-blue-600' : 'text-slate-400'
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full ${clinic.accountStatus === 'Active' ? 'bg-green-600' :
                                                clinic.accountStatus === 'Under Review' ? 'bg-blue-600' : 'bg-slate-400'
                                            }`}></span>
                                        {clinic.accountStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{clinic.created}</td>
                                <td className="px-6 py-4 text-right">
                                    {clinic.accountStatus === 'Under Review' ? (
                                        <button onClick={() => openReview(clinic)} className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100">Review</button>
                                    ) : (
                                        <button className="text-slate-400 font-bold text-sm hover:text-slate-600">Details</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Review Modal */}
            {isReviewModalOpen && selectedClinic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Review Clinic Account</h3>
                        <p className="text-slate-500 text-sm mb-6">Reviewing details for <span className="font-bold text-slate-700">{selectedClinic.name}</span></p>

                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div><span className="block text-xs uppercase font-bold text-slate-400">Business Reg</span><span className="font-mono font-bold">BN-X892-00</span></div>
                                <div><span className="block text-xs uppercase font-bold text-slate-400">KRA PIN</span><span className="font-mono font-bold">P051XXXXXX</span></div>
                                <div><span className="block text-xs uppercase font-bold text-slate-400">Org Doc</span><span className="text-blue-600 font-bold underline cursor-pointer">View PDF</span></div>
                                <div><span className="block text-xs uppercase font-bold text-slate-400">Submitted</span><span className="font-bold">Today</span></div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Rejection Reason (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-xl text-sm"
                                    placeholder="Enter reason if rejecting..."
                                    rows={3}
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsReviewModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
                            <button onClick={() => handleReviewAction('reject')} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100">Reject</button>
                            <button onClick={() => handleReviewAction('approve')} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20">Approve</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicsManager;
