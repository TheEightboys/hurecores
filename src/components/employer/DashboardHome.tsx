import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { organizationService, staffService, scheduleService, attendanceService, leaveService } from '../../lib/services';
import type { Organization, DashboardStats, Location } from '../../types';

const DashboardHome: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [org, setOrg] = useState<Organization | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [pendingLeave, setPendingLeave] = useState(0);
    const [todayAttendance, setTodayAttendance] = useState({ present: 0, scheduled: 0 });

    useEffect(() => {
        loadDashboardData();
    }, [user?.organizationId]);

    const loadDashboardData = async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        try {
            // Get organization details
            const orgData = await organizationService.getById(user.organizationId);
            setOrg(orgData);

            // Get organization stats
            const statsData = await organizationService.getStats(user.organizationId);
            if (statsData) {
                // Get today's shifts
                const todayShifts = await scheduleService.getTodayShifts(user.organizationId);
                const openShifts = await scheduleService.getOpenShifts(user.organizationId);

                // Get today's attendance
                const attendanceSummary = await attendanceService.getTodaySummary(user.organizationId);
                setTodayAttendance({
                    present: attendanceSummary.presentCount,
                    scheduled: todayShifts.reduce((sum, s) => sum + (s.assignments?.length || 0), 0)
                });

                setStats({
                    totalStaff: statsData.staffCount,
                    maxStaff: statsData.maxStaff,
                    totalLocations: statsData.locationsCount,
                    maxLocations: statsData.maxLocations,
                    todaysShifts: todayShifts.length,
                    openShifts: openShifts.length,
                    presentToday: attendanceSummary.presentCount,
                    scheduledToday: todayShifts.reduce((sum, s) => sum + (s.assignments?.length || 0), 0),
                    adminSeatsUsed: statsData.adminsCount,
                    maxAdmins: statsData.maxAdmins
                });
            }

            // Get locations
            const locs = await organizationService.getLocations(user.organizationId);
            setLocations(locs);

            // Get pending leave requests
            const pending = await leaveService.getPendingRequests(user.organizationId);
            setPendingLeave(pending.length);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getVerificationBadge = (status: string) => {
        switch (status) {
            case 'Verified':
                return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Approved</span>;
            case 'Pending':
                return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending Review</span>;
            case 'Rejected':
                return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Rejected</span>;
            default:
                return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Unverified</span>;
        }
    };

    const quickActions = [
        { label: 'View Schedule', icon: '📅', color: 'bg-blue-600', href: '#/employer/schedule' },
        { label: 'Manage Staff', icon: '👥', color: 'bg-slate-800', href: '#/employer/staff' },
        { label: 'Attendance', icon: '⏰', color: 'bg-slate-800', href: '#/employer/attendance' },
        { label: 'Export Payroll', icon: '💰', color: 'bg-slate-800', href: '#/employer/payroll' },
    ];

    const verifiedLocations = locations.filter(l => l.status === 'Verified').length;

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
                <span className="text-sm text-slate-500">Last updated: Just now</span>
            </div>

            {/* Verification Banner - Show if not verified */}
            {org && org.orgStatus !== 'Verified' && (
                <div className={`border rounded-2xl p-6 flex items-start justify-between ${org.orgStatus === 'Rejected' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg text-xl ${org.orgStatus === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                            {org.orgStatus === 'Rejected' ? '❌' : '⚠️'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                {org.orgStatus === 'Rejected' ? 'Verification Rejected' : 'Verification Required'}
                            </h3>
                            <p className="text-slate-600 leading-relaxed max-w-2xl">
                                {org.orgStatus === 'Rejected' && org.rejectionReason ? (
                                    <>Reason: {org.rejectionReason}. Please update your documents and resubmit.</>
                                ) : (
                                    <>Your organization <span className="font-bold">{org.name}</span> is currently unverified.
                                        Please submit your business registration and facility licenses to unlock full features.</>
                                )}
                            </p>
                        </div>
                    </div>
                    <a
                        href="#/employer/verification"
                        className={`px-6 py-2.5 rounded-xl font-bold transition-colors text-white ${org.orgStatus === 'Rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
                            }`}
                    >
                        {org.orgStatus === 'Rejected' ? 'Resubmit' : 'Verify Now'}
                    </a>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 text-2xl">👥</div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalStaff || 0}</div>
                    <div className="text-sm font-semibold text-slate-500">Total Staff</div>
                    <div className="text-xs text-slate-400 mt-1">of {stats?.maxStaff || 0} allowed</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 text-2xl">📍</div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalLocations || 0}</div>
                    <div className="text-sm font-semibold text-slate-500">Locations</div>
                    <div className="text-xs text-slate-400 mt-1">of {stats?.maxLocations || 0} allowed</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-purple-50 text-purple-600 text-2xl">📅</div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.todaysShifts || 0}</div>
                    <div className="text-sm font-semibold text-slate-500">Today's Shifts</div>
                    <div className="text-xs text-slate-400 mt-1">{stats?.openShifts || 0} Open</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 text-2xl">⏰</div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{todayAttendance.present}</div>
                    <div className="text-sm font-semibold text-slate-500">Present Today</div>
                    <div className="text-xs text-slate-400 mt-1">of {todayAttendance.scheduled || stats?.totalStaff || 0} staff clocked in</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Compliance Status & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Compliance Card */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center">
                            <span className="mr-2">🛡️</span> Compliance Status
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">🏢</div>
                                    <div>
                                        <div className="font-bold text-slate-900">Organization Verification</div>
                                        <div className="text-xs text-slate-500">Business Registration & KRA PIN</div>
                                    </div>
                                </div>
                                {getVerificationBadge(org?.orgStatus || 'Unverified')}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">🏥</div>
                                    <div>
                                        <div className="font-bold text-slate-900">Facility Licenses</div>
                                        <div className="text-xs text-slate-500">{verifiedLocations} of {locations.length} locations verified</div>
                                    </div>
                                </div>
                                {verifiedLocations === locations.length && locations.length > 0 ? (
                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Approved</span>
                                ) : verifiedLocations > 0 ? (
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">In Progress</span>
                                ) : (
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">👨‍⚕️</div>
                                    <div>
                                        <div className="font-bold text-slate-900">Staff Licenses</div>
                                        <div className="text-xs text-slate-500">0 licenses added</div>
                                    </div>
                                </div>
                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Not Started</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Pending Leave Requests</span>
                                <span className="text-2xl font-bold text-slate-900">{pendingLeave}</span>
                            </div>
                            {pendingLeave > 0 && (
                                <a href="#/employer/leave" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
                                    Review requests →
                                </a>
                            )}
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Admin Seats Used</span>
                                <span className="text-2xl font-bold text-slate-900">{stats?.adminSeatsUsed || 0}/{stats?.maxAdmins || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Tips */}
                <div>
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl mb-8">
                        <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
                        <div className="space-y-3">
                            {quickActions.map((action, i) => (
                                <a
                                    key={i}
                                    href={action.href}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all hover:bg-opacity-90 active:scale-95 ${action.color} text-white block text-center`}
                                >
                                    <span>{action.icon}</span>
                                    <span>{action.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white">
                        <h3 className="font-bold text-lg mb-2">Pro Tip</h3>
                        <p className="text-blue-100 text-sm leading-relaxed mb-6">
                            Complete your organization verification to unlock all features including scheduling, attendance tracking, and payroll management.
                        </p>
                        <a
                            href="#/employer/verification"
                            className="text-sm font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors inline-block"
                        >
                            Get Verified
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
