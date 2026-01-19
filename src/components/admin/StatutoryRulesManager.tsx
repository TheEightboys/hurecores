import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { statutoryRulesService } from '../../lib/services';
import type { StatutoryRules, PAYEBand, DeductionPreview } from '../../types';

const StatutoryRulesManager: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentRules, setCurrentRules] = useState<StatutoryRules | null>(null);
    const [history, setHistory] = useState<StatutoryRules[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [testSalary, setTestSalary] = useState(100000);
    const [preview, setPreview] = useState<DeductionPreview | null>(null);
    const [updating, setUpdating] = useState(false);

    // Form state for editing
    const [editForm, setEditForm] = useState({
        nssfEmployeeRate: 0.06,
        nssfEmployerRate: 0.06,
        nhdfRate: 0.015,
        shaRate: 0.0275,
        payeBands: [] as PAYEBand[],
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (testSalary > 0) {
            calculatePreview();
        }
    }, [testSalary, currentRules]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rules, rulesHistory] = await Promise.all([
                statutoryRulesService.getCurrentRules(),
                statutoryRulesService.getRulesHistory()
            ]);

            setCurrentRules(rules);
            setHistory(rulesHistory);

            if (rules) {
                setEditForm({
                    nssfEmployeeRate: rules.nssfEmployeeRate,
                    nssfEmployerRate: rules.nssfEmployerRate,
                    nhdfRate: rules.nhdfRate,
                    shaRate: rules.shaRate,
                    payeBands: [...rules.payeBands],
                    notes: ''
                });
            }
        } catch (error) {
            console.error('Error loading statutory rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculatePreview = async () => {
        if (!testSalary || testSalary <= 0) return;

        try {
            const result = await statutoryRulesService.calculateDeductions(testSalary, 0);
            setPreview(result);
        } catch (error) {
            console.error('Error calculating preview:', error);
        }
    };

    const handleUpdateRules = async () => {
        if (!user) return;

        setUpdating(true);
        try {
            await statutoryRulesService.updateRules(
                user.id,
                user.email,
                {
                    payeBands: editForm.payeBands,
                    nssfEmployeeRate: editForm.nssfEmployeeRate,
                    nssfEmployerRate: editForm.nssfEmployerRate,
                    nhdfRate: editForm.nhdfRate,
                    shaRate: editForm.shaRate,
                    notes: editForm.notes
                }
            );

            setShowEditModal(false);
            await loadData();
            alert('Statutory rules updated successfully!');
        } catch (error: any) {
            console.error('Error updating rules:', error);
            alert('Failed to update rules: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleRevertToDefaults = async () => {
        if (!user) return;
        if (!confirm('Are you sure you want to revert to default statutory rules? This will create a new version.')) return;

        setUpdating(true);
        try {
            await statutoryRulesService.revertToDefaults(user.id, user.email);
            await loadData();
            alert('Statutory rules reverted to defaults successfully!');
        } catch (error: any) {
            console.error('Error reverting to defaults:', error);
            alert('Failed to revert: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const formatCurrency = (cents: number) => {
        return `KES ${(cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatPercent = (decimal: number) => {
        return `${(decimal * 100).toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!currentRules) {
        return (
            <div className="p-8">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <p className="text-amber-800">No statutory rules found. Initializing defaults...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Statutory Payroll Rules (Kenya)</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Defines national statutory deductions applied to payroll. Controlled by Super Admin only.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                        >
                            {showHistory ? 'Hide History' : 'View Version History'}
                        </button>
                        <button
                            onClick={handleRevertToDefaults}
                            disabled={updating}
                            className="px-4 py-2 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors font-medium disabled:opacity-50"
                        >
                            Revert to Defaults
                        </button>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors font-bold"
                        >
                            Update Rules
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - PAYE Bands */}
                <div className="lg:col-span-2 space-y-6">
                    {/* PAYE Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
                                📊
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Pay As You Earn (PAYE) - Income Tax</h3>
                                <p className="text-sm text-slate-600">A progressive tax on earnings, with rates from 10% up to 35%</p>
                                <p className="text-xs text-slate-500 mt-1">Bands (Annual): 10% on allowable; ESS ≥58,000+ 10% cess | 31% rushes</p>
                            </div>
                        </div>

                        {/* PAYE Bands Visualization */}
                        <div className="grid grid-cols-5 gap-2">
                            {currentRules.payeBands.map((band, idx) => {
                                const colors = [
                                    'bg-slate-200 text-slate-800',
                                    'bg-blue-300 text-blue-900',
                                    'bg-cyan-400 text-cyan-900',
                                    'bg-purple-400 text-purple-900',
                                    'bg-red-500 text-white'
                                ];
                                return (
                                    <div key={idx} className={`p-4 rounded-xl ${colors[idx] || 'bg-slate-200'} text-center`}>
                                        <div className="text-2xl font-bold">{formatPercent(band.rate)}</div>
                                        <div className="text-xs mt-2 font-medium">{band.label}</div>
                                        <div className="text-xs mt-1 opacity-75">
                                            {band.threshold === Infinity ? 'Above' : `Next ${(band.threshold / 1000).toFixed(0)}K`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Other Deductions */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* NSSF */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg">
                                    🏦
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">National Social Security Fund (NSSF)</h4>
                                    <p className="text-xs text-slate-600 mt-1">Mandatory pension contribution, 6% from employee (matched by employer)</p>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm text-slate-600">Employee: <span className="font-bold text-blue-700">{formatPercent(currentRules.nssfEmployeeRate)}</span></div>
                                <div className="text-sm text-slate-600">Employer: <span className="font-bold text-blue-700">{formatPercent(currentRules.nssfEmployerRate)}</span></div>
                            </div>
                        </div>

                        {/* NHDF */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg">
                                    🏠
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">National Housing Development Fund (NHDF)</h4>
                                    <p className="text-xs text-slate-600 mt-1">Mandatory contribution for housing</p>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                <div className="text-sm text-slate-600">Currently: <span className="font-bold text-green-700">{formatPercent(currentRules.nhdfRate)}</span></div>
                            </div>
                        </div>

                        {/* SHA */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 col-span-2">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-lg">
                                    ❤️
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Social Health Authority (SHA)</h4>
                                    <p className="text-xs text-slate-600 mt-1">Contribution towards national health insurance</p>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-pink-50 rounded-lg inline-block">
                                <div className="text-sm text-slate-600">Currently: <span className="font-bold text-pink-700">{formatPercent(currentRules.shaRate)}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                        ℹ️ HURE Core calculates only. Employers must remit payments per these rules.
                    </div>
                </div>

                {/* Right Column - Current Rates & Preview */}
                <div className="space-y-6">
                    {/* Current Rates Summary */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Current Rates (Kenya)</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">🔸 Controlled by Super Admin only</span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">PAYE:</span>
                                <span className="font-bold text-slate-900">Bands from 10% → 35%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">NSSF:</span>
                                <span className="font-bold text-slate-900">{formatPercent(currentRules.nssfEmployeeRate)} Employee + {formatPercent(currentRules.nssfEmployerRate)} Employer</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">NHDF:</span>
                                <span className="font-bold text-slate-900">{formatPercent(currentRules.nhdfRate)} of taxable pay</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">SHA:</span>
                                <span className="font-bold text-slate-900">{formatPercent(currentRules.shaRate)} of taxable pay</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200 text-xs text-slate-500">
                            <div>Version: {currentRules.version}</div>
                            <div>Effective: {new Date(currentRules.effectiveFrom).toLocaleDateString('en-KE')}</div>
                            <div>Updated: {new Date(currentRules.updatedAt).toLocaleDateString('en-KE')}</div>
                        </div>
                    </div>

                    {/* Preview Calculator */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Preview Calculator</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Test Monthly Salary (KES)</label>
                            <input
                                type="number"
                                value={testSalary}
                                onChange={(e) => setTestSalary(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        {preview && (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Gross Pay:</span>
                                    <span className="font-bold">{formatCurrency(preview.grossPay * 100)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>PAYE:</span>
                                    <span className="font-bold">-{formatCurrency(preview.paye * 100)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>NSSF (Employee):</span>
                                    <span className="font-bold">-{formatCurrency(preview.nssfEmployee * 100)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>NHDF:</span>
                                    <span className="font-bold">-{formatCurrency(preview.nhdf * 100)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>SHA:</span>
                                    <span className="font-bold">-{formatCurrency(preview.sha * 100)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-green-700">
                                    <span>Net Pay:</span>
                                    <span>{formatCurrency(preview.netPay * 100)}</span>
                                </div>
                                <div className="flex justify-between text-blue-600 text-xs">
                                    <span>Employer Cost (+ NSSF):</span>
                                    <span className="font-bold">{formatCurrency(preview.employerCost * 100)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Version History */}
            {showHistory && (
                <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Version History</h3>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">Version</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">Effective From</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">Updated By</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">Notes</th>
                                    <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((rule) => (
                                    <tr key={rule.id} className="border-b border-slate-100">
                                        <td className="py-3 px-4">{rule.version}</td>
                                        <td className="py-3 px-4">{new Date(rule.effectiveFrom).toLocaleDateString('en-KE')}</td>
                                        <td className="py-3 px-4">{rule.updatedByEmail || 'System'}</td>
                                        <td className="py-3 px-4 text-xs text-slate-600">{rule.notes || '-'}</td>
                                        <td className="py-3 px-4">
                                            {rule.isActive ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">Archived</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-xl font-bold text-slate-900">Update Statutory Rules</h3>
                            <p className="text-sm text-slate-600 mt-1">Changes will create a new version</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* NSSF */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">NSSF Employee Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.nssfEmployeeRate * 100}
                                    onChange={(e) => setEditForm({ ...editForm, nssfEmployeeRate: Number(e.target.value) / 100 })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">NSSF Employer Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.nssfEmployerRate * 100}
                                    onChange={(e) => setEditForm({ ...editForm, nssfEmployerRate: Number(e.target.value) / 100 })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>

                            {/* NHDF */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">NHDF Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.nhdfRate * 100}
                                    onChange={(e) => setEditForm({ ...editForm, nhdfRate: Number(e.target.value) / 100 })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>

                            {/* SHA */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">SHA Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.shaRate * 100}
                                    onChange={(e) => setEditForm({ ...editForm, shaRate: Number(e.target.value) / 100 })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                                <textarea
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                    placeholder="Reason for update..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                disabled={updating}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateRules}
                                disabled={updating}
                                className="px-6 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors font-bold disabled:opacity-50"
                            >
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatutoryRulesManager;
