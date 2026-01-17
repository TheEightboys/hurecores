import React from 'react';

const SettingsView: React.FC = () => {
    return (
        <div className="p-8 max-w-3xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                <p className="text-slate-500">Manage general organization preferences.</p>
            </div>

            <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">General Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Organization Name</label>
                            <input type="text" defaultValue="MedCare Clinics Group" className="w-full px-4 py-2 border rounded-xl font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Contact Email</label>
                            <input type="email" defaultValue="admin@medcare.com" className="w-full px-4 py-2 border rounded-xl font-medium" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Save Changes</button>
                    </div>
                </div>

                <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
                    <h3 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h3>
                    <p className="text-red-700 mb-6 text-sm">
                        Deactivating your organization will restrict access for all staff members.
                        This action can be reversed by a Super Admin, but data may be archived.
                    </p>
                    <button className="px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50">
                        Deactivate Organization
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
