import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const MyProfile: React.FC = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        jobTitle: 'Senior Nurse',
        phone: '+254 712 345 678',
        emergencyContact: 'John Doe',
        emergencyPhone: '+254 700 000 000'
    });

    return (
        <div className="p-8 max-w-5xl mx-auto flex flex-col animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
                <p className="text-slate-500">Manage your personal information and emergency contacts.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header / Banner */}
                <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                    <div className="absolute inset-0 bg-white/5 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '20px 20px' }}></div>
                </div>

                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-16 mb-8">
                        <div className="flex items-end">
                            <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-600">
                                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                            </div>
                            <div className="ml-6 mb-2">
                                <h1 className="text-3xl font-bold text-slate-900">{user?.name || 'User Name'}</h1>
                                <div className="flex items-center space-x-2 text-slate-500 font-medium">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{user?.role || 'Staff'}</span>
                                    <span>•</span>
                                    <span>Nairobi Main Clinic</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
                        >
                            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 border-t border-slate-100 pt-8">
                        {/* Personal Info */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-2 gap-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                                    <div className="font-semibold text-slate-900">{user?.email || 'email@example.com'}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Job Title</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none"
                                        />
                                    ) : (
                                        <div className="font-semibold text-slate-900">{formData.jobTitle}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none"
                                        />
                                    ) : (
                                        <div className="font-semibold text-slate-900">{formData.phone}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date Hired</label>
                                    <div className="font-semibold text-slate-900">Jan 12, 2023</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Department</label>
                                    <div className="font-semibold text-slate-900">General Nursing</div>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Emergency Contact</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.emergencyContact}
                                            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none"
                                        />
                                    ) : (
                                        <div className="font-semibold text-slate-900">{formData.emergencyContact}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Phone</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.emergencyPhone}
                                            onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none"
                                        />
                                    ) : (
                                        <div className="font-semibold text-slate-900">{formData.emergencyPhone}</div>
                                    )}
                                </div>
                            </div>
                            {isEditing && (
                                <div className="pt-4">
                                    <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg">
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
