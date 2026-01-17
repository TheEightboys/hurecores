import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { payrollService, staffService } from '../../lib/services';
import type { PayrollPeriod, PayrollEntry } from '../../types';

const PayrollView: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
    const [entries, setEntries] = useState<PayrollEntry[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newPeriod, setNewPeriod] = useState({
        name: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        loadPeriods();
    }, [user?.organizationId]);

    useEffect(() => {
        if (selectedPeriod) {
            loadPeriodDetails(selectedPeriod.id);
        }
    }, [selectedPeriod?.id]);

    const loadPeriods = async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        try {
            const data = await payrollService.getPeriods(user.organizationId);
            setPeriods(data);
            if (data.length > 0) {
                setSelectedPeriod(data[0]); // Select most recent
            }
        } catch (error) {
            console.error('Error loading payroll periods:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPeriodDetails = async (periodId: string) => {
        if (!user?.organizationId) return;

        try {
            const [entriesData, summaryData] = await Promise.all([
                payrollService.getEntries(user.organizationId, periodId),
                payrollService.getPeriodSummary(user.organizationId, periodId)
            ]);
            setEntries(entriesData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error loading period details:', error);
        }
    };

    const handleCreatePeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId) return;

        setError('');
        try {
            const period = await payrollService.createPeriod(user.organizationId, newPeriod);
            setShowCreateModal(false);
            setNewPeriod({ name: '', startDate: '', endDate: '' });
            loadPeriods();
            setSelectedPeriod(period);
        } catch (err: any) {
            setError(err.message || 'Failed to create period');
        }
    };

    const handleGenerateEntries = async () => {
        if (!user?.organizationId || !selectedPeriod) return;

        try {
            await payrollService.generateEntries(user.organizationId, selectedPeriod.id);
            setSuccess('Payroll entries generated successfully');
            loadPeriodDetails(selectedPeriod.id);
        } catch (err: any) {
            setError(err.message || 'Failed to generate entries');
        }
    };

    const handleMarkAllPaid = async () => {
        if (!user?.organizationId || !selectedPeriod) return;
        if (!confirm('Mark all entries as paid?')) return;

        try {
            await payrollService.markAllAsPaid(user.organizationId, selectedPeriod.id);
            setSuccess('All entries marked as paid');
            loadPeriodDetails(selectedPeriod.id);
        } catch (err: any) {
            setError(err.message || 'Failed to mark as paid');
        }
    };

    const handleFinalize = async () => {
        if (!user?.organizationId || !selectedPeriod) return;
        if (!confirm('Finalize this payroll period? This action cannot be undone.')) return;

        try {
            await payrollService.finalizePeriod(user.organizationId, selectedPeriod.id);
            setSuccess('Payroll period finalized');
            loadPeriods();
        } catch (err: any) {
            setError(err.message || 'Failed to finalize');
        }
    };

    const handleExport = async () => {
        if (!user?.organizationId || !selectedPeriod) return;

        try {
            const csv = await payrollService.exportToCSV(user.organizationId, selectedPeriod.id);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payroll-${selectedPeriod.name.replace(/\s+/g, '-')}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message || 'Failed to export');
        }
    };

    const formatCurrency = (cents: number) => {
        return `KES ${(cents / 100).toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Payroll</h2>
                    <p className="text-slate-500 mt-1">{periods.length} payroll periods</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                >
                    + Create Period
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Period List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                        <h3 className="font-bold text-slate-900 mb-4">Payroll Periods</h3>
                        <div className="space-y-2">
                            {periods.map(period => (
                                <button
                                    key={period.id}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`w-full text-left p-3 rounded-xl transition-colors ${selectedPeriod?.id === period.id
                                        ? 'bg-blue-50 border-2 border-blue-500'
                                        : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="font-medium text-slate-900">{period.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {period.startDate} → {period.endDate}
                                    </div>
                                    {period.isFinalized && (
                                        <span className="inline-block mt-2 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">
                                            FINALIZED
                                        </span>
                                    )}
                                </button>
                            ))}

                            {periods.length === 0 && (
                                <p className="text-center text-slate-500 py-8">No periods yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Period Details */}
                <div className="lg:col-span-3">
                    {selectedPeriod ? (
                        <>
                            {/* Summary Cards */}
                            {summary && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                                        <div className="text-2xl font-bold text-slate-900">{summary.totalEntries}</div>
                                        <div className="text-sm text-slate-500">Staff</div>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalGrossCents)}</div>
                                        <div className="text-sm text-slate-500">Gross Pay</div>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalNetCents)}</div>
                                        <div className="text-sm text-slate-500">Net Pay</div>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                                        <div className="text-2xl font-bold text-slate-900">{summary.paidCount}/{summary.totalEntries}</div>
                                        <div className="text-sm text-slate-500">Paid</div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                {entries.length === 0 && !selectedPeriod.isFinalized && (
                                    <button
                                        onClick={handleGenerateEntries}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700"
                                    >
                                        Generate Entries
                                    </button>
                                )}
                                {entries.length > 0 && !selectedPeriod.isFinalized && (
                                    <>
                                        <button
                                            onClick={handleMarkAllPaid}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700"
                                        >
                                            Mark All Paid
                                        </button>
                                        <button
                                            onClick={handleFinalize}
                                            className="bg-slate-800 text-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-900"
                                        >
                                            Finalize Period
                                        </button>
                                    </>
                                )}
                                {entries.length > 0 && (
                                    <button
                                        onClick={handleExport}
                                        className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold hover:bg-slate-200"
                                    >
                                        Export CSV
                                    </button>
                                )}
                            </div>

                            {/* Entries Table */}
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Staff</th>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Pay Method</th>
                                            <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Worked</th>
                                            <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Absent</th>
                                            <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Gross</th>
                                            <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Net</th>
                                            <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {entries.map(entry => (
                                            <tr key={entry.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{entry.staff?.fullName || 'Unknown'}</div>
                                                    <div className="text-sm text-slate-500">{entry.staff?.jobTitle || ''}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{entry.payMethod}</td>
                                                <td className="px-6 py-4 text-right text-slate-600">{entry.workedUnits}h</td>
                                                <td className="px-6 py-4 text-right text-slate-600">{entry.absentUnits}d</td>
                                                <td className="px-6 py-4 text-right font-medium">{formatCurrency(entry.grossPayCents)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(entry.netPayCents)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {entry.isPaid ? (
                                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">PAID</span>
                                                    ) : (
                                                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">PENDING</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {entries.length === 0 && (
                                    <div className="p-12 text-center">
                                        <div className="text-4xl mb-4">💰</div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No payroll entries</h3>
                                        <p className="text-slate-500 mb-4">Generate entries based on staff attendance and pay rates</p>
                                        {!selectedPeriod.isFinalized && (
                                            <button
                                                onClick={handleGenerateEntries}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                                            >
                                                Generate Entries
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                            <div className="text-4xl mb-4">💰</div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No payroll period selected</h3>
                            <p className="text-slate-500">Create a new payroll period to get started</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Period Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Create Payroll Period</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleCreatePeriod} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Period Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newPeriod.name}
                                    onChange={(e) => setNewPeriod(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    placeholder="e.g., January 2026"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={newPeriod.startDate}
                                        onChange={(e) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={newPeriod.endDate}
                                        onChange={(e) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                                >
                                    Create Period
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollView;
