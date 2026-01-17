import React from 'react';

const Features: React.FC = () => {
    const features = [
        {
            icon: '👥',
            title: 'Staff Management',
            desc: 'Onboard staff, manage roles, track licenses and certifications seamlessly. Keep all employee data in one secure, compliant place.'
        },
        {
            icon: '📅',
            title: 'Smart Scheduling',
            desc: 'Create shifts, manage coverage gaps, and handle external locums with ease. AI-powered conflict detection ensures zero double-booking.'
        },
        {
            icon: '⏰',
            title: 'Attendance Tracking',
            desc: 'Geofenced clock in/out, automatic status calculation, and review workflows. Say goodbye to manual timesheets forever.'
        },
        {
            icon: '💰',
            title: 'Payroll Export',
            desc: 'Export salary, daily, and hourly payroll with attendance mapping. One-click integration with major accounting software.'
        },
        {
            icon: '🏢',
            title: 'Multi-Branch Control',
            desc: 'Manage multiple branches or locations with unified control. Switch views instantly and get global insights.'
        },
        {
            icon: '✅',
            title: 'Compliance First',
            desc: 'Automated organization and facility verification with document tracking. Alerts for expiring licenses and certifications.'
        },
    ];

    return (
        <section id="features" className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-blue-600 font-bold tracking-wide uppercase text-sm mb-3">Powerful Features</h2>
                    <h3 className="text-3xl md:text-5xl font-bold text-slate-900 font-display mb-6">Everything you need to run a modern workforce</h3>
                    <p className="text-xl text-slate-500 leading-relaxed">
                        HURE Core gives you the tools to manage your staff efficiently, so you can focus on delivering great care.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="group p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-slate-900">{f.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
