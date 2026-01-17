import React, { useState } from 'react';

const PermissionsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Roles' | 'Assignments'>('Assignments');
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

    // New Role Form State
    const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });

    const availablePermissions = [
        { id: 'team_schedule', label: 'View Team Schedule' },
        { id: 'manage_schedule', label: 'Create & Edit Shifts' },
        { id: 'staff_list', label: 'View Staff Directory' },
        { id: 'manage_staff', label: 'Add/Edit Staff Members' },
        { id: 'approve_leave', label: 'Approve/Reject Leave' },
        { id: 'team_attendance', label: 'View Attendance Records' },
        { id: 'payroll', label: 'Access Payroll Data' },
        { id: 'settings', label: 'Manage Org Settings' },
    ];

    const handleCreateRole = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would save to the backend
        setIsRoleModalOpen(false);
        setNewRole({ name: '', description: '', permissions: [] });
        alert('Custom role created!');
    };

    const togglePermission = (id: string) => {
        if (newRole.permissions.includes(id)) {
            setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== id) });
        } else {
            setNewRole({ ...newRole, permissions: [...newRole.permissions, id] });
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Roles & Permissions</h2>
                    <p className="text-slate-500">Control access levels for your staff.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold">
                        2 / 5 Admin Seats Used
                    </span>
                    <button
                        onClick={() => setIsRoleModalOpen(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        + Create New Role
                    </button>
                </div>
            </div>

            <div className="flex space-x-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('Assignments')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Assignments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Staff Assignments
                </button>
                <button
                    onClick={() => setActiveTab('Roles')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Roles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    Role Definitions
                </button>
            </div>

            {activeTab === 'Assignments' && (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Staff Member</th>
                                <th className="px-6 py-4">Assigned Role</th>
                                <th className="px-6 py-4">Permissions Count</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[
                                { name: 'Sarah Johnson', role: 'Shift Manager', perms: 12 },
                                { name: 'James Mwangi', role: 'Staff', perms: 3 },
                                { name: 'Grace Wanjiku', role: 'Nurse', perms: 3 },
                                { name: 'Admin User', role: 'Owner', perms: 'Full Access' },
                            ].map((user, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900">{user.name}</td>
                                    <td className="px-6 py-4">
                                        <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-700 focus:border-blue-500 outline-none" defaultValue={user.role}>
                                            <option>Owner</option>
                                            <option>Shift Manager</option>
                                            <option>HR Manager</option>
                                            <option>Payroll Officer</option>
                                            <option>Staff</option>
                                            <option>Nurse</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{user.perms}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 font-bold text-sm hover:underline">View Access</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Roles' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { name: 'Owner', desc: 'Full access to all features.', type: 'System' },
                        { name: 'Shift Manager', desc: 'Can manage schedules and basic staff details.', type: 'System' },
                        { name: 'HR Manager', desc: 'Can manage staff, hiring, and leave.', type: 'System' },
                        { name: 'Payroll Officer', desc: 'Can view attendance and generate payroll.', type: 'System' },
                        { name: 'Staff', desc: 'Basic access to own schedule and profile.', type: 'System' },
                    ].map((role, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-slate-900">{role.name}</h3>
                                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded uppercase">{role.type}</span>
                            </div>
                            <p className="text-slate-500 text-sm mb-6">{role.desc}</p>
                            <button className="w-full py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">Edit Permissions</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Role Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsRoleModalOpen(false)} />
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-900">Create Custom Role</h3>
                            <p className="text-sm text-slate-500">Define a new role and its permissions.</p>
                        </div>

                        <form onSubmit={handleCreateRole} className="p-6 overflow-y-auto space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Role Name</label>
                                <input required type="text" className="w-full px-4 py-2 border rounded-xl"
                                    value={newRole.name} onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                                    placeholder="e.g. Finance Assistant"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea className="w-full px-4 py-2 border rounded-xl" rows={2}
                                    value={newRole.description} onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                                    placeholder="Briefly describe this role..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Permissions</label>
                                <div className="space-y-3">
                                    {availablePermissions.map(perm => (
                                        <label key={perm.id} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                checked={newRole.permissions.includes(perm.id)}
                                                onChange={() => togglePermission(perm.id)}
                                            />
                                            <span className="text-slate-700 font-medium">{perm.label} <span className="text-xs text-slate-400 font-mono ml-1">({perm.id})</span></span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">Save New Role</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermissionsManager;
