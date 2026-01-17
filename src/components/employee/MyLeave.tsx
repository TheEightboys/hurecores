import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../lib/services';
import type { LeaveRequest, LeaveType, LeaveBalance, LeaveStatus } from '../../types';

const MyLeave: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: ''
    });

    useEffect(() => {
        loadData();
    }, [user?.organizationId, user?.id]);

    const loadData = async () => {
        if (!user?.organizationId || !user?.id) return;

        setLoading(true);
        try {
            const [requestsData, typesData, balancesData] = await Promise.all([
                leaveService.getMyLeaveRequests(user.organizationId, user.id),
                leaveService.getLeaveTypes(user.organizationId),
                leaveService.getMyBalances(user.organizationId, user.id)
            ]);
            setRequests(requestsData);
            setLeaveTypes(typesData);
            setBalances(balancesData);

            // Default to first leave type if available
            if (typesData.length > 0 && !formData.leaveTypeId) {
                setFormData(prev => ({ ...prev, leaveTypeId: typesData[0].id }));
            }
        } catch (error) {
            console.error('Error loading leave data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId || !user?.id) return;

        setError('');
        setSubmitting(true);

        try {
            const result = await leaveService.submitRequest(user.organizationId, {
                staffId: user.id,
                leaveTypeId: formData.leaveTypeId,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason
            });

            if (result.success) {
                setFormData({ leaveTypeId: leaveTypes[0]?.id || '', startDate: '', endDate: '', reason: '' });
                loadData();
            } else {
                setError(result.error || 'Failed to submit request');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (requestId: string) => {
        if (!user?.organizationId) return;
        if (!confirm('Cancel this leave request?')) return;

        try {
            await leaveService.cancelRequest(user.organizationId, requestId);
            loadData();
        } catch (error) {
            console.error('Error cancelling request:', error);
        }
    };

    const getStatusBadge = (status: LeaveStatus) => {
        const styles: Record<LeaveStatus, string> = {
            'Approved': 'bg-green-100 text-green-700',
            'Pending': 'bg-amber-100 text-amber-700',
            'Rejected': 'bg-red-100 text-red-700',
            'Cancelled': 'bg-slate-100 text-slate-600'
        };
        return (
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[status]}`}>
                {status}
            </span>
        );
    };

    const calculateDays = (start: string, end: string) => {
        return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    // Get primary balance (Annual Leave) for display
    const primaryBalance = balances.find(b => b.leaveType?.name?.toLowerCase().includes('annual')) || balances[0];

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">My Leave</h2>
                <p className="text-slate-500">View balance and submit time-off requests.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Stats & Form */}
                <div className="space-y-8">
                    {/* Balance Card */}
                    {primaryBalance && (
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold opacity-90 mb-1">{primaryBalance.leaveType?.name || 'Annual Leave'} Balance</h3>
                                <div className="text-5xl font-bold mb-4">
                                    {primaryBalance.remaining} <span className="text-xl font-normal opacity-70">days</span>
                                </div>
                                <div className="w-full bg-white/20 h-2 rounded-full mb-2">
                                    <div
                                        className="bg-white h-2 rounded-full"
                                        style={{ width: `${(primaryBalance.remaining / primaryBalance.allocated) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm font-medium opacity-80">
                                    <span>Used: {primaryBalance.used} days</span>
                                    <span>Total: {primaryBalance.allocated} days</span>
                                </div>
                            </div>
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 opacity-20 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        </div>
                    )}

                    {/* All Balances */}
                    {balances.length > 1 && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">All Balances</h3>
                            <div className="space-y-3">
                                {balances.map((balance) => (
                                    <div key={balance.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                        <span className="font-medium text-slate-700">{balance.leaveType?.name}</span>
                                        <span className="font-bold text-slate-900">{balance.remaining}/{balance.allocated}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Request Form */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Request Time Off</h3>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Leave Type</label>
                                <select
                                    value={formData.leaveTypeId}
                                    onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    required
                                >
                                    {leaveTypes.map((type) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Reason</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 outline-none resize-none"
                                    placeholder="Brief description..."
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden h-full">
                        <div className="px-8 py-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">Request History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Dates</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900">{req.leaveType?.name || 'Leave'}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {req.daysRequested} day{req.daysRequested > 1 ? 's' : ''}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {req.startDate} <span className="text-slate-300 mx-1">→</span> {req.endDate}
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleCancel(req.id)}
                                                        className="text-red-600 hover:text-red-700 font-semibold text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {req.status === 'Rejected' && req.rejectionReason && (
                                                    <span className="text-xs text-red-600" title={req.rejectionReason}>
                                                        View Reason
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {requests.length === 0 && (
                                <div className="p-12 text-center text-slate-500">
                                    No leave requests found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyLeave;
