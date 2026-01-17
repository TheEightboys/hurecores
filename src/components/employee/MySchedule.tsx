import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { scheduleService } from '../../lib/services';
import type { Shift, ShiftAssignment } from '../../types';

const MySchedule: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [myShifts, setMyShifts] = useState<(Shift & { assignment?: ShiftAssignment })[]>([]);
    const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);
    const [accepting, setAccepting] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [user?.organizationId, user?.id]);

    const loadData = async () => {
        if (!user?.organizationId || !user?.id) return;

        setLoading(true);
        try {
            // Get user's assignments and available shifts
            const [assignmentsData, availableData] = await Promise.all([
                scheduleService.getStaffSchedule(user.organizationId, user.id),
                scheduleService.getAvailableShifts(user.organizationId)
            ]);
            setMyShifts(assignmentsData);
            setAvailableShifts(availableData);
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptShift = async (shiftId: string) => {
        if (!user?.organizationId || !user?.id) return;

        setAccepting(shiftId);
        try {
            const result = await scheduleService.assignStaff(user.organizationId, shiftId, {
                staffId: user.id,
                isLocum: false
            });
            if (result.success) {
                loadData();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Error accepting shift:', error);
        } finally {
            setAccepting(null);
        }
    };

    const isToday = (dateString: string) => {
        return dateString === new Date().toISOString().split('T')[0];
    };

    const isPast = (dateString: string) => {
        return new Date(dateString) < new Date(new Date().toDateString());
    };

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
                <h2 className="text-2xl font-bold text-slate-900">My Schedule</h2>
                <p className="text-slate-500">View your upcoming shifts and find opportunities to work.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Scheduled Shifts */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">📅 Upcoming Shifts</h3>
                    <div className="space-y-4">
                        {myShifts.filter(s => !isPast(s.date)).length > 0 ? myShifts.filter(s => !isPast(s.date)).map((shift) => (
                            <div key={shift.id} className={`bg-white p-6 rounded-2xl border shadow-sm hover:border-blue-300 transition-colors relative overflow-hidden group ${isToday(shift.date) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}>
                                {isToday(shift.date) && (
                                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-xl text-xs font-bold uppercase">
                                        TODAY
                                    </div>
                                )}

                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                                        <span className="text-xs font-bold text-slate-500 uppercase">
                                            {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <span className="text-2xl font-bold text-slate-900">
                                            {new Date(shift.date).getDate()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-lg">
                                            {new Date(shift.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </div>
                                        <div className="text-slate-600 font-medium font-mono">
                                            {shift.startTime} - {shift.endTime}
                                        </div>
                                        <div className="text-sm text-slate-500 mt-1 flex items-center">
                                            <span className="mr-1">📍</span> {shift.location?.name || 'Unknown Location'}
                                        </div>
                                        {shift.roleRequired && (
                                            <span className="inline-block mt-2 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                                                {shift.roleRequired}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 italic">
                                No upcoming shifts scheduled.
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Shifts */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">✨ Available to Pick Up</h3>
                    <div className="space-y-4">
                        {availableShifts.length > 0 ? availableShifts.map((shift) => (
                            <div key={shift.id} className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-lg">
                                            {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-slate-300 font-mono mt-1">{shift.startTime} - {shift.endTime}</div>
                                        <div className="text-sm text-slate-400 mt-2 flex items-center">
                                            <span className="mr-1">📍</span> {shift.location?.name}
                                            {shift.roleRequired && (
                                                <span className="text-blue-300 font-bold ml-2">• {shift.roleRequired}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAcceptShift(shift.id)}
                                        disabled={accepting === shift.id}
                                        className="bg-white text-slate-900 px-5 py-2 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg disabled:opacity-50"
                                    >
                                        {accepting === shift.id ? 'Accepting...' : 'Accept'}
                                    </button>
                                </div>
                                {/* Decorative blobs */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 opacity-10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
                            </div>
                        )) : (
                            <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 italic">
                                No open shifts available at the moment.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MySchedule;
