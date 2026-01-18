import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveService, staffService, organizationService, scheduleService } from '../../lib/services';
import type { LeaveRequest, LeaveType, LeaveStatus, Profile, Location } from '../../types';
import { JOB_TITLES } from '../../types';

// Kenya Default Leave Types
const KENYA_DEFAULT_LEAVES = [
    { name: 'Annual Leave', daysAllowed: 21, isPaid: true, requiresApproval: true, requiresDocument: false, notes: 'Employment Act' },
    { name: 'Sick Leave - Paid', daysAllowed: 14, isPaid: true, requiresApproval: true, requiresDocument: true, notes: '7 full + 7 half (policy configurable)' },
    { name: 'Sick Leave - Unpaid', daysAllowed: 999, isPaid: false, requiresApproval: true, requiresDocument: true, notes: 'After paid sick leave exhausted' },
    { name: 'Maternity Leave', daysAllowed: 90, isPaid: true, requiresApproval: true, requiresDocument: true, notes: 'Female employees' },
    { name: 'Paternity Leave', daysAllowed: 14, isPaid: true, requiresApproval: true, requiresDocument: true, notes: 'Male employees' },
    { name: 'Compassionate Leave', daysAllowed: 5, isPaid: true, requiresApproval: true, requiresDocument: false, notes: 'Bereavement / family emergency' },
    { name: 'Study Leave', daysAllowed: 10, isPaid: true, requiresApproval: true, requiresDocument: true, notes: 'Employer-defined' },
    { name: 'Unpaid Leave', daysAllowed: 999, isPaid: false, requiresApproval: true, requiresDocument: false, notes: 'No balance limit' },
    { name: 'Comp Off', daysAllowed: 10, isPaid: true, requiresApproval: true, requiresDocument: false, notes: 'Compensatory time off' },
];

const LeaveManager: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [staff, setStaff] = useState<Profile[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        locationId: '',
        leaveTypeId: '',
        staffId: '',
        role: '',
        status: '' as LeaveStatus | ''
    });

    // Modals
    const [activeTab, setActiveTab] = useState<'requests' | 'policies'>('requests');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Create Request Form
    const [newRequest, setNewRequest] = useState({
        staffId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        isHalfDay: false,
        halfDayType: 'AM' as 'AM' | 'PM',
        reason: ''
    });

    useEffect(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setFilters(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        }));
    }, []);

    useEffect(() => {
        if (user?.organizationId) loadData();
    }, [user?.organizationId, filters]);

    const loadData = async () => {
        if (!user?.organizationId) return;
        setLoading(true);
        try {
            const [requestsData, typesData, staffData, locationsData] = await Promise.all([
                leaveService.getLeaveRequests(user.organizationId, {
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                    staffId: filters.staffId || undefined,
                    leaveTypeId: filters.leaveTypeId || undefined,
                    status: filters.status || undefined
                }),
                leaveService.getLeaveTypes(user.organizationId),
                staffService.getAll(user.organizationId),
                organizationService.getLocations(user.organizationId)
            ]);

            let filtered = requestsData;
            if (filters.role) {
                filtered = filtered.filter(r => r.staff?.jobTitle === filters.role);
            }
            if (filters.locationId) {
                filtered = filtered.filter(r => r.staff?.locationId === filters.locationId);
            }

            setRequests(filtered);
            setLeaveTypes(typesData);
            setStaff(staffData.filter(s => s.staffStatus === 'Active'));
            setLocations(locationsData);
        } catch (err) {
            console.error('Error loading leave data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId) return;
        setError('');

        try {
            const result = await leaveService.createRequest(user.organizationId, {
                staffId: newRequest.staffId,
                leaveTypeId: newRequest.leaveTypeId,
                startDate: newRequest.startDate,
                endDate: newRequest.endDate,
                reason: newRequest.reason
            });

            if (result.success) {
                setSuccess('Leave request created successfully');
                setShowCreateModal(false);
                setNewRequest({ staffId: '', leaveTypeId: '', startDate: '', endDate: '', isHalfDay: false, halfDayType: 'AM', reason: '' });
                loadData();
            } else {
                setError(result.error || 'Failed to create request');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create request');
        }
    };

    const handleApprove = async (request: LeaveRequest) => {
        if (!user?.organizationId) return;
        try {
            const result = await leaveService.approveRequest(user.organizationId, request.id);
            if (result.success) {
                setSuccess('Leave request approved');
                loadData();
            } else {
                setError(result.error || 'Failed to approve');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleReject = async () => {
        if (!user?.organizationId || !selectedRequest || !rejectionReason.trim()) {
            setError('Rejection reason is required');
            return;
        }
        try {
            const result = await leaveService.rejectRequest(user.organizationId, selectedRequest.id, rejectionReason);
            if (result.success) {
                setSuccess('Leave request rejected');
                setShowRejectModal(false);
                setRejectionReason('');
                setSelectedRequest(null);
                loadData();
            } else {
                setError(result.error || 'Failed to reject');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getStatusBadge = (status: LeaveStatus) => {
        const styles: Record<LeaveStatus, string> = {
            'Pending': 'bg-amber-100 text-amber-700',
            'Approved': 'bg-emerald-100 text-emerald-700',
            'Rejected': 'bg-red-100 text-red-700',
            'Cancelled': 'bg-slate-100 text-slate-600'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{status}</span>;
    };

    const getPayrollImpact = (request: LeaveRequest) => {
        const leaveType = leaveTypes.find(t => t.id === request.leaveTypeId);
        if (leaveType?.isPaid) {
            return <span className="text-xs text-emerald-600 font-medium">✓ Counts as PAID units</span>;
        }
        return <span className="text-xs text-red-600 font-medium">✗ Counts as UNPAID (reduces pay)</span>;
    };

    const pendingCount = requests.filter(r => r.status === 'Pending').length;

    if (loading && requests.length === 0) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Leave Management</h2>
                    <p className="text-slate-500 mt-1">{requests.length} requests • {pendingCount} pending approval</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700"
                >
                    + Create Leave Request
                </button>
            </div>


            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 flex justify-between">
                    <span>✓ {success}</span>
                    <button onClick={() => setSuccess('')}>✕</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
                <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'requests' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
                    Leave Requests
                </button>
                <button onClick={() => setActiveTab('policies')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'policies' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
                    Leave Policies
                </button>
            </div>

            {/* Navigation Helper - Only show in requests tab */}
            {activeTab === 'requests' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start space-x-3">
                        <span className="text-xl">ℹ️</span>
                        <div className="flex-1">
                            <p className="text-sm text-blue-800">
                                <strong>Need to configure leave types?</strong> View and manage organization-wide leave policies in the{' '}
                                <button
                                    onClick={() => setActiveTab('policies')}
                                    className="underline font-semibold hover:text-blue-900"
                                >
                                    Leave Policies tab →
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
                                <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
                                <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                                <select value={filters.locationId} onChange={e => setFilters(p => ({ ...p, locationId: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                    <option value="">All Locations</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Type</label>
                                <select value={filters.leaveTypeId} onChange={e => setFilters(p => ({ ...p, leaveTypeId: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                    <option value="">All Types</option>
                                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                                <select value={filters.role} onChange={e => setFilters(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                    <option value="">All Roles</option>
                                    {JOB_TITLES.filter(j => j !== 'Other (custom)').map(j => <option key={j} value={j}>{j}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Employee</label>
                                <select value={filters.staffId} onChange={e => setFilters(p => ({ ...p, staffId: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                    <option value="">All Employees</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Requests Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Employee</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Leave Type</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Dates</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Days</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Payroll Impact</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{req.staff?.fullName || 'Unknown'}</div>
                                            <div className="text-sm text-slate-500">{req.staff?.jobTitle || ''}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${req.leaveType?.isPaid ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {req.leaveType?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">{req.startDate} → {req.endDate}</td>
                                        <td className="px-6 py-4 text-center font-medium">{req.daysRequested}</td>
                                        <td className="px-6 py-4 text-center">{getStatusBadge(req.status)}</td>
                                        <td className="px-6 py-4">{getPayrollImpact(req)}</td>
                                        <td className="px-6 py-4 text-center">
                                            {req.status === 'Pending' && (
                                                <div className="flex justify-center space-x-2">
                                                    <button onClick={() => handleApprove(req)} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-200">Approve</button>
                                                    <button onClick={() => { setSelectedRequest(req); setShowRejectModal(true); }} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200">Reject</button>
                                                </div>
                                            )}
                                            {req.status !== 'Pending' && (
                                                <span className="text-xs text-slate-400">{req.reviewedBy ? `By ${req.reviewer?.fullName || 'Admin'}` : '-'}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {requests.length === 0 && (
                            <div className="p-12 text-center">
                                <div className="text-4xl mb-4">📅</div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No leave requests</h3>
                                <p className="text-slate-500">No requests match your filters</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'policies' && (
                <LeavePoliciesTab leaveTypes={leaveTypes} onRefresh={loadData} />
            )}

            {/* Create Request Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Create Leave Request</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleCreateRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Employee *</label>
                                <select required value={newRequest.staffId} onChange={e => setNewRequest(p => ({ ...p, staffId: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl">
                                    <option value="">Select Employee</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.fullName} - {s.jobTitle}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Leave Type *</label>
                                <select required value={newRequest.leaveTypeId} onChange={e => setNewRequest(p => ({ ...p, leaveTypeId: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl">
                                    <option value="">Select Leave Type</option>
                                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.isPaid ? 'Paid' : 'Unpaid'})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date *</label>
                                    <input type="date" required value={newRequest.startDate} onChange={e => setNewRequest(p => ({ ...p, startDate: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Date *</label>
                                    <input type="date" required value={newRequest.endDate} onChange={e => setNewRequest(p => ({ ...p, endDate: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" checked={newRequest.isHalfDay} onChange={e => setNewRequest(p => ({ ...p, isHalfDay: e.target.checked }))} className="w-4 h-4" />
                                    <span className="text-sm text-slate-700">Half Day</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason</label>
                                <textarea value={newRequest.reason} onChange={e => setNewRequest(p => ({ ...p, reason: e.target.value }))} className="w-full px-4 py-3 border border-slate-300 rounded-xl" rows={2} placeholder="Optional reason..." />
                            </div>
                            <div className="flex space-x-3 mt-6">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Create Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 m-4">
                        <h2 className="text-xl font-bold mb-4">Reject Leave Request</h2>
                        <p className="text-sm text-slate-600 mb-4">Rejecting {selectedRequest.staff?.fullName}'s request for {selectedRequest.daysRequested} days.</p>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Rejection Reason *</label>
                            <textarea required value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl" rows={3} placeholder="Reason for rejection..." />
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); }} className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold">Cancel</button>
                            <button onClick={handleReject} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Leave Policies Tab Component
const LeavePoliciesTab: React.FC<{ leaveTypes: LeaveType[]; onRefresh: () => void }> = ({ leaveTypes, onRefresh }) => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                    <strong>Organization Leave Policies:</strong> These defaults apply to all staff unless overridden at the employee level.
                    Individual overrides can be configured in Staff Management → Employee → Leave Entitlement section.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Leave Type</th>
                            <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Days/Year</th>
                            <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Paid</th>
                            <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Approval</th>
                            <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Document</th>
                            <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Carry Forward</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leaveTypes.map(lt => (
                            <tr key={lt.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{lt.name}</td>
                                <td className="px-6 py-4 text-center">{lt.daysAllowed === 999 ? 'Unlimited' : lt.daysAllowed}</td>
                                <td className="px-6 py-4 text-center">{lt.isPaid ? <span className="text-emerald-600">✓</span> : <span className="text-slate-400">✗</span>}</td>
                                <td className="px-6 py-4 text-center">{lt.requiresApproval ? <span className="text-blue-600">✓</span> : <span className="text-slate-400">✗</span>}</td>
                                <td className="px-6 py-4 text-center">{lt.requiresDocument ? <span className="text-amber-600">✓</span> : <span className="text-slate-400">✗</span>}</td>
                                <td className="px-6 py-4 text-center">{lt.carryForwardAllowed ? <span className="text-purple-600">✓</span> : <span className="text-slate-400">✗</span>}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{lt.notes || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaveManager;
