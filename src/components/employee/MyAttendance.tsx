import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../lib/services';
import type { AttendanceRecord, AttendanceStatus } from '../../types';

const MyAttendance: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState({ totalHours: 0, daysWorked: 0, onTimePercentage: 0 });
    const [clockingIn, setClockingIn] = useState(false);
    const [clockingOut, setClockingOut] = useState(false);

    useEffect(() => {
        loadData();
    }, [user?.organizationId, user?.id]);

    const loadData = async () => {
        if (!user?.organizationId || !user?.id) return;

        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Get today's record
            const todayRecords = await attendanceService.getByDateRange(
                user.organizationId,
                today,
                today
            );
            const myTodayRecord = todayRecords.find(r => r.staffId === user.id);
            setTodayRecord(myTodayRecord || null);

            // Get history (last 30 days)
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const historyRecords = await attendanceService.getByDateRange(
                user.organizationId,
                startDate.toISOString().split('T')[0],
                today
            );
            const myHistory = historyRecords.filter(r => r.staffId === user.id);
            setHistory(myHistory);

            // Calculate summary
            const totalHours = myHistory.reduce((sum, r) => sum + (r.totalHours || 0), 0);
            const daysWorked = myHistory.filter(r => r.status === 'Present' || r.status === 'Partial').length;
            const onTimeCount = myHistory.filter(r => r.status === 'Present').length;
            const onTimePercentage = myHistory.length > 0 ? Math.round((onTimeCount / myHistory.length) * 100) : 0;

            setSummary({ totalHours, daysWorked, onTimePercentage });
        } catch (error) {
            console.error('Error loading attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        if (!user?.organizationId || !user?.id) return;

        setClockingIn(true);
        try {
            await attendanceService.clockIn(user.organizationId, user.id, user.locationId);
            loadData();
        } catch (error: any) {
            console.error('Error clocking in:', error);
            alert(error.message || 'Failed to clock in');
        } finally {
            setClockingIn(false);
        }
    };

    const handleClockOut = async () => {
        if (!user?.organizationId || !todayRecord) return;

        setClockingOut(true);
        try {
            await attendanceService.clockOut(user.organizationId, todayRecord.id);
            loadData();
        } catch (error: any) {
            console.error('Error clocking out:', error);
            alert(error.message || 'Failed to clock out');
        } finally {
            setClockingOut(false);
        }
    };

    const getStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case 'Present':
            case 'Worked': return 'bg-green-100 text-green-700';
            case 'Partial': return 'bg-amber-100 text-amber-700';
            case 'Absent':
            case 'No-show': return 'bg-red-100 text-red-700';
            case 'On Leave': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const isOnline = todayRecord && todayRecord.clockIn && !todayRecord.clockOut;
    const hoursWorkedToday = todayRecord?.totalHours || 0;

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
                <h2 className="text-2xl font-bold text-slate-900">My Attendance</h2>
                <p className="text-slate-500">Manage your daily time logs and view history.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Status Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Current Status</div>

                    <div className={`relative w-40 h-40 rounded-full border-8 flex items-center justify-center mb-8 transition-colors duration-500 ${isOnline ? 'border-green-100 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                        {isOnline && <div className="absolute inset-0 rounded-full animate-ping bg-green-200 opacity-20"></div>}
                        <div className="z-10">
                            <div className={`text-4xl font-bold ${isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                                {isOnline ? hoursWorkedToday.toFixed(1) : '--'}
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase mt-1">Hrs Today</div>
                        </div>
                    </div>

                    {!isOnline ? (
                        <button
                            onClick={handleClockIn}
                            disabled={clockingIn}
                            className="w-full py-4 rounded-2xl font-bold text-xl shadow-lg transition-all transform active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 disabled:opacity-50"
                        >
                            {clockingIn ? 'Clocking In...' : 'Clock In Now'}
                        </button>
                    ) : (
                        <button
                            onClick={handleClockOut}
                            disabled={clockingOut}
                            className="w-full py-4 rounded-2xl font-bold text-xl transition-all transform active:scale-95 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50"
                        >
                            {clockingOut ? 'Clocking Out...' : 'Clock Out'}
                        </button>
                    )}
                    <p className="text-sm text-slate-500 mt-4">
                        {isOnline
                            ? `Started at ${todayRecord?.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
                            : 'Clock in to start your shift'
                        }
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Monthly Summary</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">⏱️</span>
                                <span className="font-bold text-slate-600">Total Hours</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{summary.totalHours.toFixed(1)} hrs</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">✅</span>
                                <span className="font-bold text-slate-600">On-Time Arrival</span>
                            </div>
                            <span className="text-xl font-bold text-green-600">{summary.onTimePercentage}%</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">🗓️</span>
                                <span className="font-bold text-slate-600">Days Worked</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">{summary.daysWorked} Days</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History & Legend */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Attendance History</h3>
                    <div className="flex space-x-4 mt-4 md:mt-0 text-sm font-semibold max-w-full overflow-x-auto">
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Present</div>
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>Partial</div>
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>On Leave</div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Clock In</th>
                                <th className="px-6 py-4">Clock Out</th>
                                <th className="px-6 py-4">Hours</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.slice(0, 10).map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">
                                        {record.clockIn ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">
                                        {record.clockOut ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{record.totalHours?.toFixed(2) || '0.00'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(record.status)}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {history.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            No attendance history found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyAttendance;
