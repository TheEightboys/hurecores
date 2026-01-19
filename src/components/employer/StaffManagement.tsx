import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { staffService, organizationService } from '../../lib/services';
import KenyaPhoneInput from '../common/KenyaPhoneInput';
import type {
    Profile,
    CreateStaffInput,
    SystemRole,
    EmploymentType,
    StaffStatus,
    StaffPermissions,
    Location
} from '../../types';
import { JOB_TITLES } from '../../types';

// Permission Dialog Component
const PermissionsDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (permissions: StaffPermissions) => void;
    staffName: string;
    jobTitle: string;
    adminSeats: { used: number; max: number };
    initialPermissions?: StaffPermissions;
}> = ({ isOpen, onClose, onSave, staffName, jobTitle, adminSeats, initialPermissions }) => {
    const [permissions, setPermissions] = useState<StaffPermissions>(initialPermissions || {
        staffManagement: false,
        scheduling: false,
        attendance: false,
        leave: false,
        documentsAndPolicies: false,
        payroll: false,
        settingsAdmin: false
    });

    const togglePermission = (key: keyof StaffPermissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        const hasAnyPermission = Object.values(permissions).some(v => v);
        if (!hasAnyPermission) {
            alert('At least one permission must be selected for Admin role.');
            return;
        }
        onSave(permissions);
    };

    if (!isOpen) return null;

    const permissionGroups = [
        { key: 'staffManagement', label: 'Staff Management', description: 'Add, edit, and manage staff members' },
        { key: 'scheduling', label: 'Scheduling', description: 'Create and manage shifts and schedules' },
        { key: 'attendance', label: 'Attendance', description: 'View and edit attendance records' },
        { key: 'leave', label: 'Leave', description: 'Approve/reject leave requests' },
        { key: 'documentsAndPolicies', label: 'Documents & Policies', description: 'Manage organization documents' },
        { key: 'payroll', label: 'Payroll', description: 'View and process payroll' },
        { key: 'settingsAdmin', label: 'Settings / Admin', description: 'Access organization settings (restricted)' }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 m-4">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Admin Permissions</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {staffName} • {jobTitle || 'Admin'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800">Admin Seats Used</span>
                        <span className="font-bold text-blue-900">{adminSeats.used} / {adminSeats.max}</span>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {permissionGroups.map(({ key, label, description }) => (
                        <label
                            key={key}
                            className={`flex items-start p-4 rounded-xl border cursor-pointer transition-colors ${permissions[key as keyof StaffPermissions]
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={permissions[key as keyof StaffPermissions]}
                                onChange={() => togglePermission(key as keyof StaffPermissions)}
                                className="w-5 h-5 text-blue-600 rounded mt-0.5"
                            />
                            <div className="ml-3">
                                <div className="font-medium text-slate-900">{label}</div>
                                <div className="text-xs text-slate-500">{description}</div>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                    >
                        Save Permissions
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper to check if license is expired
const isLicenseExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
};

const LicenseBadge: React.FC<{ type?: string; number?: string; expiry?: string }> = ({ type, number, expiry }) => {
    const expired = isLicenseExpired(expiry);

    if (!type && !number) return <span className="text-slate-400">-</span>;

    return (
        <div className="flex flex-col">
            <span className="font-medium text-slate-700">{type || '-'}</span>
            <span className="text-xs text-slate-500">{number || '-'}</span>
            {expired && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1 w-fit">
                    Expired
                </span>
            )}
            {!expired && expiry && (
                <span className="text-xs text-slate-400 mt-0.5">Exp: {new Date(expiry).toLocaleDateString()}</span>
            )}
        </div>
    );
};

const OnboardingBadge: React.FC<{ status?: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        'Completed': 'bg-emerald-100 text-emerald-800',
        'In progress': 'bg-amber-100 text-amber-800',
        'Not started': 'bg-slate-100 text-slate-600'
    };
    const s = status || 'Not started';
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[s] || styles['Not started']}`}>
            {s}
        </span>
    );
};

const VettingBadge: React.FC<{ status?: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        'Verified': 'bg-emerald-100 text-emerald-800',
        'Pending review': 'bg-amber-100 text-amber-800',
        'In progress': 'bg-blue-100 text-blue-800',
        'Not started': 'bg-slate-100 text-slate-600'
    };
    const s = status || 'Not started';
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[s] || styles['Not started']}`}>
            {s}
        </span>
    );
};

// Simplified badges for Account and Invite
const SimpleBadge: React.FC<{ label: string; type: 'success' | 'warning' | 'neutral' }> = ({ label, type }) => {
    const styles = {
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        neutral: 'bg-slate-100 text-slate-600'
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[type]}`}>
            {label}
        </span>
    );
};

const StaffManagement: React.FC = () => {
    const { user } = useAuth();
    const [staff, setStaff] = useState<Profile[]>([]);
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Profile | null>(null);
    const [adminSeats, setAdminSeats] = useState({ used: 0, max: 0 });
    const [pendingPermissions, setPendingPermissions] = useState<StaffPermissions | null>(null);
    const [error, setError] = useState('');
    const [isCustomJobTitle, setIsCustomJobTitle] = useState(false);
    const [phoneValid, setPhoneValid] = useState(true);
    const [staffTab, setStaffTab] = useState<'active' | 'inactive'>('active');

    const [formData, setFormData] = useState<CreateStaffInput>({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        systemRole: 'EMPLOYEE',
        jobTitle: '',
        department: '',
        employmentType: 'Full-Time',
        locationId: '',
        monthlySalaryCents: 0,
        dailyRateCents: 0,
        shiftRateCents: 0,
        payMethod: 'Fixed',
        licenseType: '',
        licenseNumber: '',
        licenseAuthority: '',
        licenseExpiry: ''
    });

    useEffect(() => {
        loadData();
    }, [user?.organizationId]);

    const loadData = async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        try {
            const [staffData, locationsData, seatData, invitesData] = await Promise.all([
                staffService.getAll(user.organizationId),
                organizationService.getLocations(user.organizationId),
                staffService.checkAdminSeatAvailability(user.organizationId),
                staffService.getPendingInvitations(user.organizationId)
            ]);
            setStaff(staffData);
            setLocations(locationsData);
            setAdminSeats({ used: seatData.used, max: seatData.max });
            setPendingInvites(invitesData);
        } catch (error) {
            console.error('Error loading staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResendInvite = async (inviteId: string) => {
        const result = await staffService.resendInvitation(inviteId);
        if (result.success) {
            alert('Invitation resent successfully!');
        } else {
            alert(result.error || 'Failed to resend invitation');
        }
    };

    const handleCancelInvite = async (inviteId: string) => {
        if (!confirm('Are you sure you want to cancel this invitation?')) return;

        const result = await staffService.cancelInvitation(inviteId);
        if (result.success) {
            loadData(); // Reload to update the list
        } else {
            alert(result.error || 'Failed to cancel invitation');
        }
    };

    const handleSystemRoleChange = (role: SystemRole) => {
        setFormData(prev => ({ ...prev, systemRole: role }));

        // If changing to ADMIN, open permissions dialog
        if (role === 'ADMIN') {
            // Check seat availability first
            if (!adminSeats.used || adminSeats.used >= adminSeats.max) {
                if (adminSeats.used >= adminSeats.max) {
                    setError(`Admin limit reached for your plan (${adminSeats.used}/${adminSeats.max}). Upgrade to add more admin seats.`);
                    setFormData(prev => ({ ...prev, systemRole: 'EMPLOYEE' }));
                    return;
                }
            }
            setShowPermissionsModal(true);
        } else {
            // Clear permissions if not admin
            setFormData(prev => ({ ...prev, permissions: undefined }));
        }
    };

    const handlePermissionsSave = (permissions: StaffPermissions) => {
        setFormData(prev => ({ ...prev, permissions }));
        setPendingPermissions(permissions);
        setShowPermissionsModal(false);
    };

    const handlePermissionsClose = () => {
        // Revert to EMPLOYEE if permissions dialog closed without saving
        if (!pendingPermissions) {
            setFormData(prev => ({ ...prev, systemRole: 'EMPLOYEE' }));
        }
        setShowPermissionsModal(false);
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organizationId) return;

        setError('');

        // Validate admin permissions
        if (formData.systemRole === 'ADMIN' && !formData.permissions) {
            setError('Please assign permissions for the Admin role.');
            return;
        }

        // Validate pay fields based on employment type
        if (formData.employmentType === 'Salary' && !formData.monthlySalaryCents) {
            setError('Monthly salary is required for Salary employment type.');
            return;
        }

        // Validate phone if provided
        if (formData.phone && !phoneValid) {
            setError('Please enter a valid Kenyan phone number.');
            return;
        }

        const result = await staffService.createStaffInvitation(formData, user.organizationId);

        if (result.success) {
            setShowAddModal(false);
            resetForm();
            loadData();
        } else {
            setError(result.error || 'Failed to add staff member');
        }
    };

    const handleDeactivate = async (staffId: string) => {
        if (!confirm('Are you sure you want to deactivate this staff member?')) return;

        const result = await staffService.deactivate(staffId);
        if (result.success) {
            loadData();
        } else {
            alert(result.error);
        }
    };

    const handleReactivate = async (staffId: string) => {
        const result = await staffService.reactivate(staffId);
        if (result.success) {
            loadData();
        } else {
            alert(result.error);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            phone: '',
            systemRole: 'EMPLOYEE',
            jobTitle: '',
            department: '',
            employmentType: 'Full-Time',
            locationId: '',
            monthlySalaryCents: 0,
            dailyRateCents: 0,
            shiftRateCents: 0,
            payMethod: 'Fixed',
            licenseType: '',
            licenseNumber: '',
            licenseAuthority: '',
            licenseExpiry: ''
        });
        setPendingPermissions(null);
        setError('');
        setIsCustomJobTitle(false);
    };

    const openEditModal = (member: Profile) => {
        setSelectedStaff(member);
        // Check if member's job title is a custom one (not in the predefined list)
        const hasCustomTitle = member.jobTitle ? !JOB_TITLES.includes(member.jobTitle as any) : false;
        setIsCustomJobTitle(hasCustomTitle);
        setFormData({
            email: member.email,
            firstName: member.firstName || '',
            lastName: member.lastName || '',
            phone: member.phone || '',
            systemRole: member.systemRole,
            jobTitle: member.jobTitle || '',
            department: member.department || '',
            employmentType: member.employmentType,
            locationId: member.locationId || '',
            monthlySalaryCents: member.monthlySalaryCents || 0,
            dailyRateCents: member.dailyRateCents || 0,
            shiftRateCents: member.shiftRateCents || 0,
            payMethod: member.payMethod,
            permissions: member.permissions
        });
        setPendingPermissions(member.permissions || null);
        setShowEditModal(true);
    };

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaff || !user?.organizationId) return;

        setError('');

        // Validate admin permissions
        if (formData.systemRole === 'ADMIN' && !formData.permissions) {
            setError('Please assign permissions for the Admin role.');
            return;
        }

        // Validate phone if provided
        if (formData.phone && !phoneValid) {
            setError('Please enter a valid Kenyan phone number.');
            return;
        }

        const result = await staffService.update(selectedStaff.id, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            fullName: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            systemRole: formData.systemRole,
            jobTitle: formData.jobTitle,
            department: formData.department,
            employmentType: formData.employmentType,
            locationId: formData.locationId || undefined,
            monthlySalaryCents: formData.monthlySalaryCents,
            dailyRateCents: formData.dailyRateCents,
            shiftRateCents: formData.shiftRateCents,
            payMethod: formData.payMethod,
            permissions: formData.systemRole === 'ADMIN' ? formData.permissions : undefined,
            onboardingStatus: formData.onboardingStatus,
            vettingStatus: formData.vettingStatus,
            inviteStatus: formData.inviteStatus
        }, user.organizationId);

        if (result.success) {
            setShowEditModal(false);
            setSelectedStaff(null);
            resetForm();
            loadData();
        } else {
            setError(result.error || 'Failed to update staff member');
        }
    };

    // Helper function to get location name
    const getLocationName = (locationId?: string): string => {
        if (!locationId) return '-';
        const location = locations.find(loc => loc.id === locationId);
        return location?.name || '-';
    };

    const [showExpiredOnly, setShowExpiredOnly] = useState(false);

    // Filter staff based on tab and location
    const visibleStaff = React.useMemo(() => {
        return staff.filter(s => {
            // Always exclude archived staff
            if (s.staffStatus === 'Archived') return false;

            // Filter for expired licenses if banner button clicked
            if (showExpiredOnly) {
                return isLicenseExpired(s.license?.expiryDate);
            }

            // Filter by active/inactive tab
            if (staffTab === 'active' && s.staffStatus === 'Inactive') return false;
            if (staffTab === 'inactive' && s.staffStatus !== 'Inactive') return false;

            // If a location is selected, strictly match locationId
            if (selectedLocation && selectedLocation.trim() !== '') {
                return s.locationId === selectedLocation;
            }

            // If no location selected (empty string), show all
            return true;
        });
    }, [staff, selectedLocation, staffTab, showExpiredOnly]);

    // Count inactive staff for badge
    const inactiveCount = React.useMemo(() => {
        return staff.filter(s => s.staffStatus === 'Inactive').length;
    }, [staff]);

    const expiredLicensesCount = React.useMemo(() => {
        return staff.filter(s => isLicenseExpired(s.license?.expiryDate)).length;
    }, [staff]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#4fd1c5] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#1a2e35]">Staff</h2>
                    <p className="text-slate-500 mt-1">Simple staff scheduling, onboarding & credentialing for clinics</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    Add staff
                </button>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-bold text-[#1a2e35]">Staff onboarding & credentialing</h3>
                <p className="text-sm text-slate-500">Track contact details, licenses, vetting status and onboarding status for each staff member.</p>
            </div>

            {/* Expired License Banner */}
            {expiredLicensesCount > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold uppercase">License expired</span>
                        <span className="font-bold text-slate-800">Action recommended</span>
                        <span className="text-slate-600 text-sm">
                            {expiredLicensesCount} staff member(s) have an expired license. Please update documents to avoid compliance issues.
                        </span>
                    </div>
                    <button
                        className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-50"
                        onClick={() => alert("Review feature coming soon")}
                    >
                        Review
                    </button>
                </div>
            )}

            {/* Staff Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-4 py-4 min-w-[100px]">First</th>
                                <th className="px-4 py-4 min-w-[100px]">Last</th>
                                <th className="px-4 py-4 min-w-[200px]">Email</th>
                                <th className="px-4 py-4 min-w-[120px]">Account role</th>
                                <th className="px-4 py-4 min-w-[120px]">Job role</th>
                                <th className="px-4 py-4 min-w-[100px]">License type</th>
                                <th className="px-4 py-4 min-w-[120px]">License #</th>
                                <th className="px-4 py-4 min-w-[120px]">License expiry</th>
                                <th className="px-4 py-4 min-w-[120px]">Onboarding</th>
                                <th className="px-4 py-4 min-w-[120px]">Vetting status</th>
                                <th className="px-4 py-4 min-w-[100px]">Account</th>
                                <th className="px-4 py-4 min-w-[100px]">Invite</th>
                                <th className="px-4 py-4 min-w-[250px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {visibleStaff.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-4 font-medium text-slate-900">{member.firstName || member.fullName.split(' ')[0]}</td>
                                    <td className="px-4 py-4 font-medium text-slate-900">{member.lastName || member.fullName.split(' ').slice(1).join(' ')}</td>
                                    <td className="px-4 py-4 text-slate-600">{member.email}</td>
                                    <td className="px-4 py-4 text-slate-600">{member.systemRole}</td>
                                    <td className="px-4 py-4 text-slate-600">{member.jobTitle || '-'}</td>
                                    <td className="px-4 py-4">
                                        {member.license?.type || '-'}
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">
                                        {member.license?.number || '-'}
                                    </td>
                                    <td className="px-4 py-4">
                                        {member.license?.expiryDate ? (
                                            <LicenseBadge expiry={member.license.expiryDate} />
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <OnboardingBadge status={member.onboardingStatus || (member.staffStatus === 'Active' ? 'Completed' : 'Not started')} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <VettingBadge status={member.vettingStatus || (member.license?.verificationStatus === 'Verified' ? 'Verified' : 'Pending review')} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <SimpleBadge
                                            label={member.staffStatus}
                                            type={member.staffStatus === 'Active' ? 'success' : 'neutral'}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <SimpleBadge
                                            label={member.inviteStatus || (member.staffStatus === 'Invited' ? 'Pending' : 'None')}
                                            type={member.staffStatus === 'Invited' ? 'warning' : 'neutral'}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center space-x-2">
                                            {member.phone ? (
                                                <>
                                                    <a
                                                        href={`sms:${member.phone}`}
                                                        className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                        title="Send SMS"
                                                    >
                                                        SMS
                                                    </a>
                                                    <a
                                                        href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                        title="Send WhatsApp"
                                                    >
                                                        WA
                                                    </a>
                                                </>
                                            ) : (
                                                <>
                                                    <button disabled className="px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-400 cursor-not-allowed">SMS</button>
                                                    <button disabled className="px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-400 cursor-not-allowed">WA</button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDeactivate(member.id)}
                                                className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50"
                                            >
                                                Revoke
                                            </button>
                                            <button
                                                onClick={() => openEditModal(member)}
                                                className="text-blue-600 text-xs font-bold hover:underline ml-2"
                                            >
                                                Review Vetting
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {visibleStaff.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            No staff found.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 text-xs text-slate-400">
                Tip: Keep the dashboard focused — everything else can be a plugin in Settings.
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-xl p-6 m-4 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Add Staff Member</h2>
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <KenyaPhoneInput
                                label="Phone Number"
                                value={formData.phone || ''}
                                onChange={(normalized, isValid) => {
                                    setFormData(prev => ({ ...prev, phone: normalized }));
                                    setPhoneValid(isValid);
                                }}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title *</label>
                                    <select
                                        value={isCustomJobTitle ? 'Other (custom)' : (JOB_TITLES.includes(formData.jobTitle as any) ? formData.jobTitle : '')}
                                        onChange={(e) => {
                                            if (e.target.value === 'Other (custom)') {
                                                setIsCustomJobTitle(true);
                                                setFormData(prev => ({ ...prev, jobTitle: '' }));
                                            } else {
                                                setIsCustomJobTitle(false);
                                                setFormData(prev => ({ ...prev, jobTitle: e.target.value }));
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        required={!isCustomJobTitle}
                                    >
                                        <option value="">Select Job Title</option>
                                        {JOB_TITLES.map(title => (
                                            <option key={title} value={title}>{title}</option>
                                        ))}
                                    </select>
                                    {isCustomJobTitle && (
                                        <input
                                            type="text"
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 mt-2"
                                            placeholder="Enter custom job title"
                                            required
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">System Role *</label>
                                    <select
                                        value={formData.systemRole}
                                        onChange={(e) => handleSystemRoleChange(e.target.value as SystemRole)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    <p className="text-xs text-[#94A3B8] mt-1">
                                        System role controls access. Only Admins and Owners consume admin seats.
                                    </p>
                                    {formData.systemRole === 'ADMIN' && formData.permissions && (
                                        <p className="text-xs text-green-600 mt-1">✓ Permissions assigned</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Employment Type *</label>
                                    <select
                                        value={formData.employmentType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value as EmploymentType }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Full-Time">Full-Time</option>
                                        <option value="Part-Time">Part-Time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Locum">Locum</option>
                                        <option value="External">External</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                                    <select
                                        value={formData.locationId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* License Credentials Section */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-blue-900 mb-1">📋 Professional Credentials</h3>
                                <p className="text-xs text-slate-500 mb-4 flex items-start">
                                    <span className="mr-1">💡</span> License credentials can be updated later in the staff profile, but required for all clinical professionals.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">License Type</label>
                                        <select
                                            value={formData.licenseType || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, licenseType: e.target.value }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select License Type</option>
                                            <option value="KMPDC">Medical License (KMPDC)</option>
                                            <option value="NCK">Nursing License (NCK)</option>
                                            <option value="CDK">Clinical Officer (CDK)</option>
                                            <option value="PPB">Pharmacy License (PPB)</option>
                                            <option value="KMLTB">Lab Tech License (KMLTB)</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">License Number</label>
                                        <input
                                            type="text"
                                            value={formData.licenseNumber || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., A12345"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Licensing Authority</label>
                                        <input
                                            type="text"
                                            value={formData.licenseAuthority || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, licenseAuthority: e.target.value }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Medical Practitioners Board"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">License Expiry Date</label>
                                        <input
                                            type="date"
                                            value={formData.licenseExpiry || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Compensation fields based on employment type */}
                            {/* Full-Time: Monthly Salary only */}
                            {formData.employmentType === 'Full-Time' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Salary (KES) <span className="font-normal text-slate-400">- Optional</span></label>
                                    <input
                                        type="number"
                                        value={formData.monthlySalaryCents ? formData.monthlySalaryCents / 100 : ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, monthlySalaryCents: Number(e.target.value) * 100 }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., 50000"
                                    />
                                    <p className="text-xs text-[#94A3B8] mt-1">You can configure or change payroll details later.</p>
                                </div>
                            )}

                            {/* Part-Time: Monthly Salary OR Hourly Rate */}
                            {formData.employmentType === 'Part-Time' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Salary (KES) <span className="font-normal text-slate-400">- Optional</span></label>
                                        <input
                                            type="number"
                                            value={formData.monthlySalaryCents ? formData.monthlySalaryCents / 100 : ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, monthlySalaryCents: Number(e.target.value) * 100 }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 25000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hourly Rate (KES) <span className="font-normal text-slate-400">- Optional</span></label>
                                        <input
                                            type="number"
                                            value={formData.hourlyRateCents ? formData.hourlyRateCents / 100 : ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRateCents: Number(e.target.value) * 100 }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 500"
                                        />
                                    </div>
                                    <p className="col-span-2 text-xs text-[#94A3B8]">You can configure or change payroll details later.</p>
                                </div>
                            )}

                            {/* Contract/Locum/External: No salary fields, show info message */}
                            {(formData.employmentType === 'Contract' || formData.employmentType === 'Locum' || formData.employmentType === 'External') && (
                                <div className="bg-[#F1F5F9] p-4 rounded-xl border border-[#E2E8F0]">
                                    <p className="text-sm text-[#475569]">
                                        💡 Compensation details are not required for {formData.employmentType} staff. You can configure payroll details later if needed.
                                    </p>
                                </div>
                            )}


                            <div className="flex space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); resetForm(); }}
                                    className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                                >
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Staff Modal */}
            {showEditModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-xl p-6 m-4 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Edit Staff Member</h2>
                            <button onClick={() => { setShowEditModal(false); setSelectedStaff(null); resetForm(); }} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleUpdateStaff} className="space-y-4">
                            {/* Similar form fields as Add Modal */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <KenyaPhoneInput
                                label="Phone Number"
                                value={formData.phone || ''}
                                onChange={(normalized, isValid) => {
                                    setFormData(prev => ({ ...prev, phone: normalized }));
                                    setPhoneValid(isValid);
                                }}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Job Title *</label>
                                    <select
                                        value={isCustomJobTitle ? 'Other (custom)' : (JOB_TITLES.includes(formData.jobTitle as any) ? formData.jobTitle : '')}
                                        onChange={(e) => {
                                            if (e.target.value === 'Other (custom)') {
                                                setIsCustomJobTitle(true);
                                                setFormData(prev => ({ ...prev, jobTitle: '' }));
                                            } else {
                                                setIsCustomJobTitle(false);
                                                setFormData(prev => ({ ...prev, jobTitle: e.target.value }));
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        required={!isCustomJobTitle}
                                    >
                                        <option value="">Select Job Title</option>
                                        {JOB_TITLES.map(title => (
                                            <option key={title} value={title}>{title}</option>
                                        ))}
                                    </select>
                                    {isCustomJobTitle && (
                                        <input
                                            type="text"
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 mt-2"
                                            placeholder="Enter custom job title"
                                            required
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">System Role *</label>
                                    <select
                                        value={formData.systemRole}
                                        onChange={(e) => handleSystemRoleChange(e.target.value as SystemRole)}
                                        disabled={selectedStaff.systemRole === 'OWNER'}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                                    >
                                        {selectedStaff.systemRole === 'OWNER' && <option value="OWNER">Owner</option>}
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    <p className="text-xs text-[#94A3B8] mt-1">
                                        System role controls access. Only Admins and Owners consume admin seats.
                                    </p>
                                    {formData.systemRole === 'ADMIN' && formData.permissions && (
                                        <p className="text-xs text-green-600 mt-1">✓ Permissions assigned</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Employment Type *</label>
                                    <select
                                        value={formData.employmentType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value as EmploymentType }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Full-Time">Full-Time</option>
                                        <option value="Part-Time">Part-Time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Locum">Locum</option>
                                        <option value="External">External</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                                    <select
                                        value={formData.locationId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Status Management Section */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-slate-700 mb-3">Status Management</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Onboarding Status</label>
                                        <select
                                            value={formData.onboardingStatus || 'Not started'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, onboardingStatus: e.target.value as any }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        >
                                            <option value="Not started">Not started</option>
                                            <option value="In progress">In progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Vetting Status</label>
                                        <select
                                            value={formData.vettingStatus || 'Not started'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, vettingStatus: e.target.value as any }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        >
                                            <option value="Not started">Not started</option>
                                            <option value="In progress">In progress</option>
                                            <option value="Pending review">Pending review</option>
                                            <option value="Verified">Verified</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Invite Status</label>
                                        <select
                                            value={formData.inviteStatus || 'None'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, inviteStatus: e.target.value as any }))}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        >
                                            <option value="None">None</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Active">Active</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Compensation fields based on employment type */}
                            {/* Full-Time: Monthly Salary only */}
                            {formData.employmentType === 'Full-Time' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Salary (KES) <span className="font-normal text-slate-400">- Optional</span></label>
                                    <input
                                        type="number"
                                        value={formData.monthlySalaryCents ? formData.monthlySalaryCents / 100 : ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, monthlySalaryCents: Number(e.target.value) * 100 }))}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., 50000"
                                    />
                                    <p className="text-xs text-[#94A3B8] mt-1">You can configure or change payroll details later.</p>
                                </div>
                            )}

                            {/* Part-Time: Monthly Salary OR Hourly Rate */}
                            {formData.employmentType === 'Part-Time' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Salary (KES) <span className="font-normal text-slate-400">- Optional</span></label>
                                        <input
                                            type="number"
                                            value={formData.monthlySalaryCents ? formData.monthlySalaryCents / 100 : ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, monthlySalaryCents: Number(e.target.value) * 100 }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 25000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hourly Rate (KES) <span className="font-normal text-slate-400">- Optional</span></label>
                                        <input
                                            type="number"
                                            value={formData.hourlyRateCents ? formData.hourlyRateCents / 100 : ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRateCents: Number(e.target.value) * 100 }))}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 500"
                                        />
                                    </div>
                                    <p className="col-span-2 text-xs text-[#94A3B8]">You can configure or change payroll details later.</p>
                                </div>
                            )}

                            {/* Contract/Locum/External: No salary fields, show info message */}
                            {(formData.employmentType === 'Contract' || formData.employmentType === 'Locum' || formData.employmentType === 'External') && (
                                <div className="bg-[#F1F5F9] p-4 rounded-xl border border-[#E2E8F0]">
                                    <p className="text-sm text-[#475569]">
                                        💡 Compensation details are not required for {formData.employmentType} staff. You can configure payroll details later if needed.
                                    </p>
                                </div>
                            )}

                            <div className="flex space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setSelectedStaff(null); resetForm(); }}
                                    className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permissions Dialog */}
            <PermissionsDialog
                isOpen={showPermissionsModal}
                onClose={handlePermissionsClose}
                onSave={handlePermissionsSave}
                staffName={`${formData.firstName} ${formData.lastName}`}
                jobTitle={formData.jobTitle || ''}
                adminSeats={adminSeats}
                initialPermissions={pendingPermissions || undefined}
            />
        </div>
    );
};

export default StaffManagement;
