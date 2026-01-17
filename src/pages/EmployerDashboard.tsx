import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import EmployerSidebar from '../components/employer/EmployerSidebar';
import EmployerTopBar from '../components/employer/EmployerTopBar';

import DashboardHome from '../components/employer/DashboardHome';
import StaffManagement from '../components/employer/StaffManagement';
import ScheduleManager from '../components/employer/ScheduleManager';
import AttendanceView from '../components/employer/AttendanceView';
import PayrollView from '../components/employer/PayrollView';
import LeaveManager from '../components/employer/LeaveManager';
import BillingView from '../components/employer/BillingView';
import OrgDetails from '../components/employer/OrgDetails';
import LocationsManager from '../components/employer/LocationsManager';
import PermissionsManager from '../components/employer/PermissionsManager';
import SettingsView from '../components/employer/SettingsView';

// Placeholder components for tabs (will be implemented in separate files)
// const Permissions = () => <div className="p-8"><h2 className="text-2xl font-bold">Roles & Permissions</h2></div>;
// const Settings = () => <div className="p-8"><h2 className="text-2xl font-bold">Settings</h2></div>;

interface EmployerDashboardProps {
  user: any;
}

const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 font-inter overflow-hidden">
      <EmployerSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        userRole={user.role}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <EmployerTopBar
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/schedule" element={<ScheduleManager />} />
            <Route path="/attendance" element={<AttendanceView />} />
            <Route path="/payroll" element={<PayrollView />} />
            <Route path="/leave" element={<LeaveManager />} />
            <Route path="/billing" element={<BillingView />} />
            <Route path="/organization" element={<OrgDetails />} />
            <Route path="/locations" element={<LocationsManager />} />
            <Route path="/permissions" element={<PermissionsManager />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default EmployerDashboard;
