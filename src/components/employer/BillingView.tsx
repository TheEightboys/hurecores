import React from 'react';
import { PLANS } from '../../constants'; // Assuming constants are available here or need import adjustment

const BillingView: React.FC = () => {
    const currentPlan = PLANS[1]; // Mock: currently on 'Professional'

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Billing & Subscription</h2>
                    <p className="text-slate-500">Manage your plan and payment methods.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Current Plan Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Current Plan</div>
                                <h3 className="text-3xl font-bold">{currentPlan.name}</h3>
                            </div>
                            <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase">Active</span>
                        </div>

                        <div className="text-4xl font-bold mb-2">{currentPlan.price}<span className="text-lg font-medium text-slate-400">/mo</span></div>
                        <p className="text-slate-400 text-sm mb-8">Renews on Feb 12, 2025</p>

                        <div className="flex space-x-4">
                            <button className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors">Manage Subscription</button>
                            <button className="flex-1 bg-transparent border border-slate-600 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition-colors">View Invoices</button>
                        </div>
                    </div>
                </div>

                {/* Usage Limits */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Plan Usage Limits</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-700">Locations</span>
                                <span className="text-slate-900">2 / {currentPlan.locations} Used</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '40%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-700">Staff Members</span>
                                <span className="text-slate-900">12 / {currentPlan.staff} Used</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-indigo-600 h-3 rounded-full" style={{ width: '24%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-700">Admin Roles</span>
                                <span className="text-slate-900">2 / {currentPlan.admins} Used</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-purple-600 h-3 rounded-full" style={{ width: '66%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Options */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((p, i) => (
                        <div key={i} className={`p-6 rounded-2xl border transition-all ${p.name === currentPlan.name ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-lg text-slate-900">{p.name}</h4>
                                {p.name === currentPlan.name && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Current</span>}
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-4">{p.price}<span className="text-sm font-medium text-slate-500">/mo</span></div>
                            <ul className="space-y-2 mb-6">
                                <li className="text-sm text-slate-600 flex items-center">✓ Up to {p.locations} Locations</li>
                                <li className="text-sm text-slate-600 flex items-center">✓ Up to {p.staff} Staff</li>
                                <li className="text-sm text-slate-600 flex items-center">✓ {p.admins} Admins</li>
                            </ul>
                            {p.name !== currentPlan.name && (
                                <button className="w-full py-2 border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 text-slate-700">Upgrade</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BillingView;
