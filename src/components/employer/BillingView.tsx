import React, { useState, useEffect } from 'react';
import { PLANS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { organizationService } from '../../lib/services/organization.service';
import { staffService } from '../../lib/services/staff.service';
import type { Organization, Subscription } from '../../types';

interface BillingViewProps {
    organization?: Organization | null;
}

const BillingView: React.FC<BillingViewProps> = ({ organization: orgProp }) => {
    const { user } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(orgProp || null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState({ locations: 0, staff: 0, admins: 0 });
    const [loading, setLoading] = useState(!orgProp);
    const [showManageModal, setShowManageModal] = useState(false);
    const [showInvoicesModal, setShowInvoicesModal] = useState(false);

    useEffect(() => {
        if (user?.organizationId && !orgProp) {
            loadData();
        } else if (orgProp) {
            setOrganization(orgProp);
            loadUsageData();
        }
    }, [user?.organizationId, orgProp]);

    const loadData = async () => {
        if (!user?.organizationId) return;
        setLoading(true);
        try {
            const [org, sub] = await Promise.all([
                organizationService.getById(user.organizationId),
                organizationService.getSubscription(user.organizationId)
            ]);
            setOrganization(org);
            setSubscription(sub);
            await loadUsageData();
        } catch (err) {
            console.error('Error loading billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUsageData = async () => {
        if (!user?.organizationId) return;
        try {
            const [locations, staffData, adminData] = await Promise.all([
                organizationService.getLocations(user.organizationId),
                staffService.getActiveCount(user.organizationId),
                staffService.checkAdminSeatAvailability(user.organizationId)
            ]);
            setUsage({ locations: locations.length, staff: staffData, admins: adminData.used });
        } catch (err) {
            console.error('Error loading usage data:', err);
        }
    };

    // Trial calculation
    const getTrialInfo = () => {
        const trialEndDate = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
        const now = new Date();

        if (!trialEndDate) {
            // Default to 10 days from org creation if no trialEndsAt
            const orgCreated = organization?.createdAt ? new Date(organization.createdAt) : new Date();
            const defaultTrialEnd = new Date(orgCreated);
            defaultTrialEnd.setDate(defaultTrialEnd.getDate() + 10);
            return calculateTrialDays(defaultTrialEnd, now);
        }
        return calculateTrialDays(trialEndDate, now);
    };

    const calculateTrialDays = (endDate: Date, now: Date) => {
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            daysRemaining: Math.max(0, diffDays),
            isExpired: diffDays <= 0,
            isUrgent: diffDays <= 5 && diffDays > 2,
            isCritical: diffDays <= 2 && diffDays > 0,
            endDate
        };
    };

    const trialInfo = getTrialInfo();
    const isTrial = subscription?.status === 'Trial' || (!subscription?.status && !trialInfo.isExpired);
    const isActive = subscription?.status === 'Active';
    const isInactive = trialInfo.isExpired && !isActive;

    const currentPlanId = organization?.plan || 'Professional';
    const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[1];

    const maxLocations = organization?.maxLocations || currentPlan.locations;
    const maxStaff = organization?.maxStaff || currentPlan.staff;
    const maxAdmins = organization?.maxAdmins || currentPlan.admins;

    // Get trial message
    const getTrialMessage = () => {
        if (!isTrial) return null;
        const { daysRemaining } = trialInfo;
        if (daysRemaining === 0) return "Trial ends today at midnight";
        if (daysRemaining === 1) return "Trial ending tomorrow";
        if (daysRemaining <= 2) return `Trial ending in ${daysRemaining} days`;
        return `Trial: ${daysRemaining} days remaining`;
    };

    // Card color based on trial status
    const getCardGradient = () => {
        if (isInactive) return 'from-red-700 to-red-900';
        if (trialInfo.isCritical) return 'from-red-600 to-red-800';
        if (trialInfo.isUrgent) return 'from-amber-600 to-amber-800';
        return 'from-slate-900 to-slate-800';
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-64">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
            {/* Trial Expired Banner */}
            {isInactive && (
                <div className="bg-red-600 text-white rounded-xl p-6 mb-8 text-center">
                    <div className="text-2xl mb-2">⚠️ Your trial has ended</div>
                    <p className="text-lg mb-4">Please activate a plan to continue using HURE.</p>
                    <button className="bg-white text-red-600 px-8 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors">
                        Choose a Plan & Pay Now
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Billing & Subscription</h2>
                    <p className="text-slate-500">Manage your plan and payment methods.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Current Plan Card */}
                <div className={`bg-gradient-to-br ${getCardGradient()} rounded-3xl p-8 text-white shadow-xl relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Current Plan</div>
                                <h3 className="text-3xl font-bold">{currentPlan.name}</h3>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${isInactive ? 'bg-red-500 text-white' :
                                    isActive ? 'bg-green-500 text-white' :
                                        isTrial ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                {isInactive ? 'Inactive' : isActive ? 'Active' : isTrial ? 'Trial' : subscription?.status || 'Trial'}
                            </span>
                        </div>

                        <div className="text-4xl font-bold mb-1">{currentPlan.price}<span className="text-lg font-medium text-slate-400">/mo</span></div>

                        {/* Trial Status Line */}
                        {isTrial && getTrialMessage() && (
                            <div className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-4 ${trialInfo.isCritical ? 'bg-red-500/30' :
                                    trialInfo.isUrgent ? 'bg-amber-500/30' : 'bg-blue-500/30'
                                }`}>
                                {getTrialMessage()}
                            </div>
                        )}

                        {isInactive && (
                            <div className="bg-red-500/30 px-3 py-1 rounded-lg text-sm font-medium mb-4 inline-block">
                                Payment Required
                            </div>
                        )}

                        {isActive && subscription?.currentPeriodEnd && (
                            <p className="text-slate-400 text-sm mb-6">
                                Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        )}

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setShowManageModal(true)}
                                className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                            >
                                Manage Subscription
                            </button>
                            <button
                                onClick={() => setShowInvoicesModal(true)}
                                className="flex-1 bg-transparent border border-slate-600 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition-colors"
                            >
                                View Invoices
                            </button>
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
                                <span className="text-slate-900">{usage.locations} / {maxLocations} Used</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${Math.min(100, (usage.locations / maxLocations) * 100)}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-700">Staff Members</span>
                                <span className="text-slate-900">{usage.staff} / {maxStaff} Used</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-indigo-600 h-3 rounded-full" style={{ width: `${Math.min(100, (usage.staff / maxStaff) * 100)}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-700">Admin Roles</span>
                                <span className="text-slate-900">{usage.admins} / {maxAdmins} Used</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${Math.min(100, (usage.admins / maxAdmins) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trial Countdown Banner */}
            {isTrial && (
                <div className={`rounded-xl p-4 mb-8 flex items-center justify-between ${trialInfo.isCritical ? 'bg-red-50 border border-red-200' :
                        trialInfo.isUrgent ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
                    }`}>
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{trialInfo.isCritical ? '⚠️' : trialInfo.isUrgent ? '⏰' : 'ℹ️'}</span>
                        <div>
                            <p className={`font-semibold ${trialInfo.isCritical ? 'text-red-800' :
                                    trialInfo.isUrgent ? 'text-amber-800' : 'text-blue-800'
                                }`}>
                                {trialInfo.daysRemaining === 0
                                    ? 'Trial ends today at midnight'
                                    : trialInfo.daysRemaining === 1
                                        ? 'Trial ending tomorrow'
                                        : `Trial ends in ${trialInfo.daysRemaining} days`
                                }
                            </p>
                            <p className={`text-sm ${trialInfo.isCritical ? 'text-red-600' :
                                    trialInfo.isUrgent ? 'text-amber-600' : 'text-blue-600'
                                }`}>
                                Upgrade required to continue after trial ends.
                            </p>
                        </div>
                    </div>
                    <button className={`px-6 py-2 rounded-lg font-bold ${trialInfo.isCritical ? 'bg-red-600 text-white hover:bg-red-700' :
                            trialInfo.isUrgent ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}>
                        Upgrade Now
                    </button>
                </div>
            )}

            {/* Available Plans */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((p, i) => (
                        <div key={i} className={`p-6 rounded-2xl border transition-all ${p.id === currentPlanId
                                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                                : 'border-slate-200 bg-white hover:border-blue-300'
                            }`}>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-lg text-slate-900">{p.name}</h4>
                                {p.id === currentPlanId && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Current</span>}
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-4">{p.price}<span className="text-sm font-medium text-slate-500">/mo</span></div>
                            <ul className="space-y-2 mb-6">
                                <li className="text-sm text-slate-600 flex items-center">✓ Up to {p.locations} Locations</li>
                                <li className="text-sm text-slate-600 flex items-center">✓ Up to {p.staff} Staff</li>
                                <li className="text-sm text-slate-600 flex items-center">✓ {p.admins} Admins</li>
                            </ul>
                            {p.id !== currentPlanId && (
                                <button className="w-full py-2 border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 text-slate-700">
                                    {isInactive ? 'Select & Pay' : 'Upgrade'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* What happens after trial? Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center">
                    <span className="mr-2">📋</span> What happens after the trial?
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                        <span className="mr-2 text-slate-400">•</span>
                        You will need to select a plan and add a payment method
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2 text-slate-400">•</span>
                        Your data is preserved and will not be deleted
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2 text-slate-400">•</span>
                        Access is paused if no plan is selected – you can only view billing and make payment
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2 text-slate-400">•</span>
                        Full access is restored instantly after payment
                    </li>
                </ul>
            </div>

            {/* During Trial Restrictions Info */}
            {isTrial && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-6">
                    <h4 className="font-bold text-amber-800 mb-3 flex items-center">
                        <span className="mr-2">⚠️</span> Trial Restrictions
                    </h4>
                    <p className="text-sm text-amber-700 mb-3">During trial, you have full access to configure and preview features. However, the following actions require verification and an active paid plan:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-semibold text-amber-800 mb-2">✓ Allowed during trial:</p>
                            <ul className="space-y-1 text-amber-700">
                                <li>• Configure payroll & preview calculations</li>
                                <li>• Approve leave & run attendance</li>
                                <li>• Upload verification documents</li>
                                <li>• Prepare draft invoices</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold text-amber-800 mb-2">✗ Blocked until verified & paid:</p>
                            <ul className="space-y-1 text-amber-700">
                                <li>• Run payroll payouts</li>
                                <li>• Mark payroll as "Paid"</li>
                                <li>• Generate official invoices</li>
                                <li>• Export statutory reports</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Subscription Modal */}
            {showManageModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Manage Subscription</h2>
                            <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="space-y-4">
                            {isTrial && (
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <p className="font-semibold text-blue-800">Trial Status</p>
                                    <p className="text-sm text-blue-600">{getTrialMessage()}</p>
                                </div>
                            )}

                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="font-semibold text-slate-800">Current Plan: {currentPlan.name}</p>
                                <p className="text-sm text-slate-600">{currentPlan.price}/month</p>
                            </div>

                            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                                {isInactive ? 'Add Payment Method & Activate' : 'Upgrade Plan'}
                            </button>

                            {!isTrial && !isInactive && (
                                <button className="w-full py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50">
                                    Update Payment Method
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invoices Modal */}
            {showInvoicesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Invoices</h2>
                            <button onClick={() => setShowInvoicesModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="space-y-4">
                            {/* Trial Invoice */}
                            <div className="border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-800">Trial Period</p>
                                    <p className="text-sm text-slate-500">{currentPlan.name} Plan</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900">KES 0</p>
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Trial</span>
                                </div>
                            </div>

                            {/* Mock past invoices would go here */}
                            <p className="text-center text-slate-500 py-4">No paid invoices yet</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingView;
