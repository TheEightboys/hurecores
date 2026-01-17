import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService, organizationService } from '../../lib/services';
import type { AttendanceRecord, AttendanceStatus, Location } from '../../types';

const AttendanceView: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showExternalModal, setShowExternalModal] = useState(false);
    const [summary, setSummary] = useState({ present: 0, partial: 0, absent: 0, onLeave: 0, totalHours: 0 });

    useEffect(() => {
        // Set default date range to current month
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    }, []);

    useEffect(() => {
        if (user?.organizationId && dateRange.start && dateRange.end) {
            loadData();
        }
    }, [user?.organizationId, dateRange, selectedLocation]);

    const loadData = async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        try {
            const [recordsData, locationsData, summaryData] = await Promise.all([
                attendanceService.getByDateRange(
                    user.organizationId,
                    dateRange.start,
                    dateRange.end,
                    selectedLocation || undefined
                ),
                organizationService.getLocations(user.organizationId),
                attendanceService.getTodaySummary(user.organizationId, selectedLocation || undefined)
            ]);
            setRecords(recordsData);
            setLocations(locationsData);
            setSummary({
                present: summaryData.presentCount,
                partial: summaryData.partialCount,
                absent: summaryData.absentCount,
                onLeave: summaryData.onLeaveCount,
                totalHours: summaryData.totalHoursWorked
            });
        } catch (error) {
            console.error('Error loading attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: AttendanceStatus) => {
        const styles: Record<AttendanceStatus, string> = {
            'Present': 'bg-emerald-100 text-emerald-700',
            'Worked': 'bg-emerald-100 text-emerald-700',
            'Partial': 'bg-amber-100 text-amber-700',
            'Absent': 'bg-red-100 text-red-700',
            'No-show': 'bg-red-100 text-red-700',
            'On Leave': 'bg-blue-100 text-blue-700'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
                {status}
            </span>
        );
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '-';
        return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const handleAddExternalLocum = async (data: {
        locumName: string;
        role: string;
        locationId: string;
        date: string;
        shiftStart: string;
        shiftEnd: string;
        status: 'Worked' | 'No-show';
    }) => {
        if (!user?.organizationId) return;

        try {
            await attendanceService.addExternalLocumAttendance(user.organizationId, data);
            setShowExternalModal(false);
            loadData();
        } catch (error) {
            console.error('Error adding external locum:', error);
        }
    };

    if (loading && records.length === 0) {
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
                    <h2 className="text-2xl font-bold text-slate-900">Attendance</h2>
                    <p className="text-slate-500 mt-1">{records.length} records</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowExternalModal(true)}
                        className="bg-slate-800 text-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                    >
                        + External Locum
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        + Manual Entry
                    </button>
                </div>
            </div>

            {/* Today's Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-700">{summary.present}</div>
                    <div className="text-sm text-emerald-600">Present Today</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">{summary.partial}</div>
                    <div className="text-sm text-amber-600">Partial</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-700">{summary.absent}</div>
                    <div className="text-sm text-red-600">Absent</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.onLeave}</div>
                    <div className="text-sm text-blue-600">On Leave</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-slate-700">{summary.totalHours.toFixed(1)}</div>
                    <div className="text-sm text-slate-600">Hours Worked</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
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
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700"
                >
                    Apply Filter
                </button>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Staff</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Clock In</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Clock Out</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Hours</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    {record.isExternal ? (
                                        <div>
                                            <div className="font-medium text-slate-900">{record.externalLocumName}</div>
                                            <div className="text-sm text-slate-500">{record.externalLocumRole} (External)</div>
                                        </div>
                                    ) : (
                                        <div className="font-medium text-slate-900">{record.staff?.fullName || 'Unknown'}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-600">{record.date}</td>
                                <td className="px-6 py-4 text-slate-600">{formatTime(record.clockIn)}</td>
                                <td className="px-6 py-4 text-slate-600">{formatTime(record.clockOut)}</td>
                                <td className="px-6 py-4 text-slate-600">{record.totalHours?.toFixed(1) || '0'}</td>
                                <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                                <td className="px-6 py-4">
                                    {record.isExternal ? (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">External</span>
                                    ) : record.isManualEntry ? (
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">Manual</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">System</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {records.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">⏰</div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No attendance records</h3>
                        <p className="text-slate-500">No records found for the selected date range</p>
                    </div>
                )}
            </div>

            {/* External Locum Modal */}
            {showExternalModal && (
                <ExternalLocumModal
                    locations={locations}
                    onClose={() => setShowExternalModal(false)}
                    onSave={handleAddExternalLocum}
                />
            )}
        </div>
    );
};

// External Locum Entry Modal
const ExternalLocumModal: React.FC<{
    locations: Location[];
    onClose: () => void;
    onSave: (data: any) => void;
}> = ({ locations, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        locumName: '',
        role: '',
        locationId: '',
        date: new Date().toISOString().split('T')[0],
        shiftStart: '',
        shiftEnd: '',
        status: 'Worked' as 'Worked' | 'No-show'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Add External Locum</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Locum Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.locumName}
                            onChange={(e) => setFormData(prev => ({ ...prev, locumName: e.target.value }))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            placeholder="e.g., Dr. Jane Smith"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Role *</label>
                        <input
                            type="text"
                            required
                            value={formData.role}
                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            placeholder="e.g., Nurse, Surgeon"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Location *</label>
                        <select
                            required
                            value={formData.locationId}
                            onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
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
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Shift Start</label>
                            <input
                                type="time"
                                value={formData.shiftStart}
                                onChange={(e) => setFormData(prev => ({ ...prev, shiftStart: e.target.value }))}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Shift End</label>
                            <input
                                type="time"
                                value={formData.shiftEnd}
                                onChange={(e) => setFormData(prev => ({ ...prev, shiftEnd: e.target.value }))}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Status *</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'Worked' | 'No-show' }))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl"
                        >
                            <option value="Worked">Worked</option>
                            <option value="No-show">No-show</option>
                        </select>
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                        >
                            Add Entry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AttendanceView;
