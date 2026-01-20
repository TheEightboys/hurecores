import React, { useState, useEffect } from 'react';
import { statutoryRulesService } from '../../lib/services';
import type { StatutoryRules, PAYEBand, DeductionPreview } from '../../types';

const StatutoryRulesManager: React.FC = () => {
    const [rules, setRules] = useState<StatutoryRules | null>(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewSalary, setPreviewSalary] = useState(100000);
    const [previewAllowances, setPreviewAllowances] = useState(0);
    const [preview, setPreview] = useState<DeductionPreview | null>(null);

    useEffect(() => {
        loadRules();
    }, []);

    useEffect(() => {
        if (rules) {
            calculatePreview();
        }
    }, [rules, previewSalary, previewAllowances]);

    const loadRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await statutoryRulesService.getCurrentRules();
            if (data) {
                setRules(data);
            } else {
                setRules(null);
                // Optional: Could verify if we want to show a specific error here
            }
        } catch (err: any) {
            console.error('Error loading rules:', err);
            setError(err.message || 'Failed to load statutory rules');
        } finally {
            setLoading(false);
        }
    };

    const handleInitializeDefaults = async () => {
        setInitializing(true);
        setError(null);
        try {
            await statutoryRulesService.createDefaultRules();
            await loadRules();
        } catch (err: any) {
            console.error('Error initializing defaults:', err);
            setError(err.message || 'Failed to create default rules');
        } finally {
            setInitializing(false);
        }
    };

    const calculatePreview = async () => {
        if (!rules) return;
        try {
            const result = await statutoryRulesService.calculateDeductions(previewSalary, previewAllowances);
            setPreview(result);
        } catch (error) {
            console.error('Error calculating preview:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!rules) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto mt-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    📜
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Statutory Rules Found</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    The statutory rules configuration is missing. These rules are required for accurate payroll Tax, NSSF, and NHDF/SHA calculations.
                </p>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-start gap-3 text-left">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <span className="font-bold block mb-1">Error</span>
                            {error}
                        </div>
                    </div>
                )}

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={loadRules}
                        className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors"
                    >
                        Retry Loading
                    </button>
                    <button
                        onClick={handleInitializeDefaults}
                        disabled={initializing}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {initializing ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Initializing...
                            </>
                        ) : (
                            <>
                                <span>⚡</span> Initialize Default Rules
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-slate-900">Statutory Payroll Rules ({rules.country})</h2>
                            {rules.isActive && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 max-w-2xl">
                            Defines national statutory deductions applied to payroll across all employers in this system.
                            These rules are used for calculation and preview only &mdash; HURE Core does not remit statutory payments.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-semibold text-slate-500">Current Version</div>
                        <div className="text-2xl font-bold text-slate-900">v{rules.version}.0</div>
                        <button className="text-xs text-blue-600 font-semibold hover:underline mt-1">View Version History</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Rules Definition */}
                <div className="lg:col-span-2 space-y-8">

                    {/* PAYE Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl text-orange-600">🧾</div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Pay As You Earn (PAYE)</h3>
                                <p className="text-xs text-slate-500">Progressive tax bands on annual taxable income</p>
                            </div>
                        </div>

                        {/* Bands Visual */}
                        <div className="grid grid-cols-5 gap-0.5 rounded-xl overflow-hidden mb-6 text-center">
                            {rules.payeBands.map((band, idx) => {
                                let bg = 'bg-slate-100';
                                if (band.rate >= 0.35) bg = 'bg-red-500';
                                else if (band.rate >= 0.325) bg = 'bg-blue-600';
                                else if (band.rate >= 0.30) bg = 'bg-blue-400';
                                else if (band.rate >= 0.25) bg = 'bg-sky-400';
                                else bg = 'bg-emerald-400';

                                return (
                                    <div key={idx} className={`${bg} py-3 text-white`}>
                                        <div className="text-lg font-bold">{(band.rate * 100).toFixed(1)}%</div>
                                        {band.rate === 0.1 && <div className="text-[10px] opacity-90 uppercase font-bold mt-1">Tax Free</div>}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bands Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="py-2 px-3 text-left font-semibold text-slate-600">Band</th>
                                        <th className="py-2 px-3 text-left font-semibold text-slate-600">Tax Rates</th>
                                        <th className="py-2 px-3 text-right font-semibold text-slate-600">Threshold (KES)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {rules.payeBands.map((band, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50">
                                            <td className="py-3 px-3">
                                                <div className="font-medium text-slate-900">{band.label}</div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="font-bold text-slate-900">{(band.rate * 100).toFixed(1)}%</span>
                                            </td>
                                            <td className="py-3 px-3 text-right text-slate-500 font-mono">
                                                {band.threshold === Infinity ? 'Unlimited' : band.threshold.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                            <strong>Note:</strong> Effective rates include personal relief of KES 2,400/mo (KES 28,800/yr). First KES 24,000/mo is effectively tax-free due to relief.
                        </div>
                    </div>

                    {/* Deductions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* NSSF */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl text-blue-600">🏦</div>
                                <div>
                                    <h3 className="font-bold text-slate-900">NSSF Tier I & II</h3>
                                    <p className="text-xs text-slate-500">Pension Contribution</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium text-slate-600">Employee Share</span>
                                    <span className="font-bold text-slate-900 text-lg">{(rules.nssfEmployeeRate * 100)}%</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium text-slate-600">Employer Match</span>
                                    <span className="font-bold text-slate-900 text-lg">{(rules.nssfEmployerRate * 100)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* NHDF & SHA Container */}
                        <div className="space-y-6">
                            {/* NHDF */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-xl text-teal-600">🏘️</div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Housing Levy (NHDF)</h3>
                                        <p className="text-xs text-slate-500">Tax on gross salary</p>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-slate-900">{(rules.nhdfRate * 100)}%</div>
                                <p className="text-xs text-slate-400 mt-1">Matched by employer (1.5%)</p>
                            </div>

                            {/* SHA */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-xl text-pink-600">🏥</div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">HealthAuth (SHA)</h3>
                                        <p className="text-xs text-slate-500">Social Health Insurance</p>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-slate-900">{(rules.shaRate * 100).toFixed(2)}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Calculator Preview */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg sticky top-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-sm font-bold">KES</div>
                            <h3 className="font-bold text-lg">Net Pay Preview</h3>
                        </div>

                        {/* Calculator Inputs */}
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Monthly Basic Salary</label>
                                <input
                                    type="number"
                                    value={previewSalary}
                                    onChange={(e) => setPreviewSalary(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Taxable Allowances</label>
                                <input
                                    type="number"
                                    value={previewAllowances}
                                    onChange={(e) => setPreviewAllowances(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Breakdown */}
                        {preview ? (
                            <div className="space-y-3 pt-6 border-t border-slate-700">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Taxable Pay</span>
                                    <span className="font-mono text-white">{preview.taxablePay.toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-slate-800 my-2"></div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-300">PAYE (Tax)</span>
                                    <span className="font-mono text-red-300">-{preview.paye.toFixed(0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-300">NSSF (Pension)</span>
                                    <span className="font-mono text-red-300">-{preview.nssfEmployee.toFixed(0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-300">NHDF (Housing)</span>
                                    <span className="font-mono text-red-300">-{preview.nhdf.toFixed(0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-300">SHA (Health)</span>
                                    <span className="font-mono text-red-300">-{preview.sha.toFixed(0).toLocaleString()}</span>
                                </div>

                                <div className="h-px bg-slate-700 my-3"></div>

                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-emerald-400">Net Pay</span>
                                    <span className="text-2xl font-bold text-white tracking-tight">
                                        KES {preview.netPay.toFixed(0).toLocaleString()}
                                    </span>
                                </div>

                                <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-400 leading-relaxed">
                                    This confirms the rules above are generating valid payroll outputs.
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 text-sm py-4">Calculating...</div>
                        )}
                    </div>

                    <button
                        disabled
                        className="w-full py-3 bg-slate-200 text-slate-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span>🔒</span> Update Rules (Disabled)
                    </button>
                    <p className="text-center text-xs text-slate-400">
                        Updates affecting payroll logic must be verified by technical team first.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StatutoryRulesManager;
