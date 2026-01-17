import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { scheduleService, staffService, organizationService, leaveService } from '../../lib/services';
import type { Shift, ShiftAssignment, Profile, Location } from '../../types';

interface LocumForm {
    name: string;
    phone: string;
    rateCents: number;
    supervisorId: string;
    notes: string;
}

const ScheduleManager: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [staff, setStaff] = useState<Profile[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [showLocumModal, setShowLocumModal] = useState(false);

    const [newShift, setNewShift] = useState({
        locationId: '',
        date: selectedDate,
        startTime: '08:00',
        endTime: '17:00',
        roleRequired: '',
        staffNeeded: 1,
        notes: ''
    });

    const [locumForm, setLocumForm] = useState<LocumForm>({
        name: '',
        phone: '',
        rateCents: 0,
        supervisorId: '',
        notes: ''
    });

    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [user?.organizationId, selectedDate, selectedLocation]);

    const loadData = async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        try {
            // Calculate week range
            const date = new Date(selectedDate);
            const dayOfWeek = date.getDay();
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - dayOfWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const [shiftsData, locationsData, staffData] = await Promise.all([
                scheduleService.getShifts(user.organizationId, {
                    startDate: startOfWeek.toISOString().split('T')[0],
                    endDate: endOfWeek.toISOString().split('T')[0],
                    locationId: selectedLocation || undefined
                }),
                organizationService.getLocations(user.organizationId),
                staffService.getAll(user.organizationId)
            ]);

            setShifts(shiftsData);
            setLocations(locationsData);
            setStaff(staffData.filter(s => s.staffStatus === 'Active'));
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShift = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId) return;

        setError('');
        try {
            await scheduleService.createShift(user.organizationId, newShift);
            setShowCreateModal(false);
            setNewShift({
                locationId: '',
                date: selectedDate,
                startTime: '08:00',
                endTime: '17:00',
                roleRequired: '',
                staffNeeded: 1,
                notes: ''
            });
            loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to create shift');
        }
    };

    const handleAssignStaff = async (staffId: string) => {
        if (!user?.organizationId || !selectedShift) return;

        const result = await scheduleService.assignStaff(user.organizationId, selectedShift.id, {
            staffId,
            isLocum: false
        });

        if (result.success) {
            loadData();
            setShowAssignModal(false);
            setSelectedShift(null);
        } else {
            alert(result.error);
        }
    };

    const handleAssignLocum = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId || !selectedShift) return;

        const result = await scheduleService.assignStaff(user.organizationId, selectedShift.id, {
            isLocum: true,
            locumName: locumForm.name,
            locumPhone: locumForm.phone,
            locumRateCents: locumForm.rateCents,
            supervisorId: locumForm.supervisorId,
            notes: locumForm.notes
        });

        if (result.success) {
            loadData();
            setShowLocumModal(false);
            setSelectedShift(null);
            setLocumForm({ name: '', phone: '', rateCents: 0, supervisorId: '', notes: '' });
        } else {
            alert(result.error);
        }
    };

    const handleRemoveAssignment = async (assignmentId: string) => {
        if (!user?.organizationId) return;
        if (!confirm('Remove this assignment?')) return;

        await scheduleService.removeAssignment(user.organizationId, assignmentId);
        loadData();
    };

    const openAssignModal = (shift: Shift) => {
        setSelectedShift(shift);
        setShowAssignModal(true);
    };

    const openLocumModal = (shift: Shift) => {
        setSelectedShift(shift);
        setShowLocumModal(true);
    };

    // Group shifts by date for week view
    const shiftsByDate: Record<string, Shift[]> = {};
    shifts.forEach(shift => {
        if (!shiftsByDate[shift.date]) {
            shiftsByDate[shift.date] = [];
        }
        shiftsByDate[shift.date].push(shift);
    });

    // Generate week dates
    const getWeekDates = () => {
        const date = new Date(selectedDate);
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - dayOfWeek);

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    const weekDates = getWeekDates();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get available staff for assignment (not already assigned to shift, not on leave)
    const getAvailableStaff = (shift: Shift) => {
        const assignedIds = shift.assignments?.map(a => a.staffId) || [];
        return staff.filter(s => !assignedIds.includes(s.id));
    };

    if (loading && shifts.length === 0) {
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
                    <h2 className="text-2xl font-bold text-slate-900">Schedule Manager</h2>
                    <p className="text-slate-500 mt-1">{shifts.length} shifts this week</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                    + Create Shift
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Week Of</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Locations</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Week View */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-200">
                    {weekDates.map((date, i) => {
                        const isToday = date === new Date().toISOString().split('T')[0];
                        return (
                            <div key={date} className={`p-4 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                                <div className="text-xs font-semibold text-slate-500 uppercase">{dayNames[i]}</div>
                                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                                    {new Date(date).getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-7 min-h-[400px]">
                    {weekDates.map((date) => {
                        const dayShifts = shiftsByDate[date] || [];
                        const isPast = new Date(date) < new Date(new Date().toDateString());

                        return (
                            <div key={date} className={`border-r border-slate-100 last:border-r-0 p-2 ${isPast ? 'bg-slate-50' : ''}`}>
                                {dayShifts.map(shift => {
                                    const assignedCount = shift.assignments?.length || 0;
                                    const isFull = assignedCount >= shift.staffNeeded;

                                    return (
                                        <div
                                            key={shift.id}
                                            className={`mb-2 p-3 rounded-xl border ${isFull
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'bg-amber-50 border-amber-200'
                                                }`}
                                        >
                                            <div className="text-xs font-bold text-slate-700">
                                                {shift.startTime} - {shift.endTime}
                                            </div>
                                            <div className="text-sm text-slate-600 mt-1">
                                                {shift.location?.name || 'Unknown'}
                                            </div>
                                            {shift.roleRequired && (
                                                <div className="text-xs text-slate-500 mt-1">{shift.roleRequired}</div>
                                            )}
                                            <div className={`text-xs mt-2 font-semibold ${isFull ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {assignedCount}/{shift.staffNeeded} assigned
                                            </div>

                                            {/* Assigned staff */}
                                            {shift.assignments && shift.assignments.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {shift.assignments.map(assignment => (
                                                        <div key={assignment.id} className="flex items-center justify-between text-xs">
                                                            <span className={assignment.isLocum ? 'text-purple-600' : 'text-slate-600'}>
                                                                {assignment.isLocum ? `🔄 ${assignment.locumName}` : assignment.staff?.fullName}
                                                            </span>
                                                            {!isPast && (
                                                                <button
                                                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Assign buttons */}
                                            {!isPast && !isFull && (
                                                <div className="mt-2 flex gap-1">
                                                    <button
                                                        onClick={() => openAssignModal(shift)}
                                                        className="flex-1 text-xs bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700"
                                                    >
                                                        + Staff
                                                    </button>
                                                    <button
                                                        onClick={() => openLocumModal(shift)}
                                                        className="flex-1 text-xs bg-purple-600 text-white py-1 px-2 rounded hover:bg-purple-700"
                                                    >
                                                        + Locum
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {dayShifts.length === 0 && !isPast && (
                                    <div className="text-center py-8 text-slate-400 text-xs">
                                        No shifts
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Shift Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Create Shift</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateShift} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Location *</label>
                                <select
                                    required
                                    value={newShift.locationId}
                                    onChange={(e) => setNewShift(prev => ({ ...prev, locationId: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                >
                                    <option value="">Select Location</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={newShift.date}
                                    onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time *</label>
                                    <input
                                        type="time"
                                        required
                                        value={newShift.startTime}
                                        onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Time *</label>
                                    <input
                                        type="time"
                                        required
                                        value={newShift.endTime}
                                        onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Role Required</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Nurse, Doctor"
                                        value={newShift.roleRequired}
                                        onChange={(e) => setNewShift(prev => ({ ...prev, roleRequired: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Staff Needed *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={newShift.staffNeeded}
                                        onChange={(e) => setNewShift(prev => ({ ...prev, staffNeeded: parseInt(e.target.value) }))}
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
                                    Create Shift
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Staff Modal */}
            {showAssignModal && selectedShift && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Assign Staff</h2>
                            <button onClick={() => { setShowAssignModal(false); setSelectedShift(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                            <div className="font-medium text-slate-900">{selectedShift.startTime} - {selectedShift.endTime}</div>
                            <div className="text-sm text-slate-500">{selectedShift.date} • {selectedShift.location?.name}</div>
                        </div>

                        <div className="space-y-2">
                            {getAvailableStaff(selectedShift).length === 0 ? (
                                <p className="text-center text-slate-500 py-8">No available staff</p>
                            ) : (
                                getAvailableStaff(selectedShift).map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleAssignStaff(member.id)}
                                        className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                {member.fullName?.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium text-slate-900">{member.fullName}</div>
                                                <div className="text-sm text-slate-500">{member.jobTitle || 'Staff'}</div>
                                            </div>
                                        </div>
                                        <span className="text-blue-600 font-semibold">Assign</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Locum Modal */}
            {showLocumModal && selectedShift && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Assign External Locum</h2>
                            <button onClick={() => { setShowLocumModal(false); setSelectedShift(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleAssignLocum} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Locum Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={locumForm.name}
                                    onChange={(e) => setLocumForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    placeholder="e.g., Dr. Jane Smith"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={locumForm.phone}
                                    onChange={(e) => setLocumForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    placeholder="+254..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Rate (KES per shift)</label>
                                <input
                                    type="number"
                                    value={locumForm.rateCents / 100 || ''}
                                    onChange={(e) => setLocumForm(prev => ({ ...prev, rateCents: Number(e.target.value) * 100 }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                    placeholder="e.g., 3000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Supervisor</label>
                                <select
                                    value={locumForm.supervisorId}
                                    onChange={(e) => setLocumForm(prev => ({ ...prev, supervisorId: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                                >
                                    <option value="">Select Supervisor</option>
                                    {staff.filter(s => s.systemRole === 'OWNER' || s.systemRole === 'ADMIN').map(member => (
                                        <option key={member.id} value={member.id}>{member.fullName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowLocumModal(false); setSelectedShift(null); }}
                                    className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
                                >
                                    Assign Locum
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleManager;
