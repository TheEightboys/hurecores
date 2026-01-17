import React, { useState } from 'react';

const ManagerStaff: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('All');

    const staff = [
        { id: 1, name: 'Sarah Johnson', role: 'Nurse', email: 'sarah.j@medcare.com', phone: '+254 712 345 678', location: 'Nairobi Main', status: 'Active' },
        { id: 2, name: 'James Mwangi', role: 'Receptionist', email: 'james.m@medcare.com', phone: '+254 722 000 000', location: 'Nairobi West', status: 'Active' },
        { id: 3, name: 'Grace Wanjiku', role: 'Nurse', email: 'grace.w@medcare.com', phone: '+254 733 111 222', location: 'Mombasa Branch', status: 'On Leave' },
        { id: 4, name: 'David Kimani', role: 'Lab Tech', email: 'david.k@medcare.com', phone: '+254 744 333 444', location: 'Nairobi Main', status: 'Active' },
    ];

    const filteredStaff = staff.filter(s =>
        (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (locationFilter === 'All' || s.location === locationFilter)
    );

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col animate-in fade-in duration-500">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Staff Directory</h2>
                    <p className="text-slate-500">View contact details and status for all staff members.</p>
                </div>
                <div className="flex space-x-4">
                    <input
                        type="text"
                        placeholder="Search staff..."
                        className="px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                    >
                        <option value="All">All Locations</option>
                        <option value="Nairobi Main">Nairobi Main</option>
                        <option value="Nairobi West">Nairobi West</option>
                        <option value="Mombasa Branch">Mombasa Branch</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStaff.map((person) => (
                            <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                                            {person.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="font-bold text-slate-900">{person.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-600">{person.role}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm">
                                        <div className="font-semibold text-slate-900">{person.email}</div>
                                        <div className="text-slate-500">{person.phone}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{person.location}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${person.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {person.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManagerStaff;
