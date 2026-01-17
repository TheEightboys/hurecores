import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import EmployeeSidebar from '../components/employee/EmployeeSidebar';
import EmployeeTopBar from '../components/employee/EmployeeTopBar';

import MySchedule from '../components/employee/MySchedule';
import MyAttendance from '../components/employee/MyAttendance';
import MyLeave from '../components/employee/MyLeave';
import MyProfile from '../components/employee/MyProfile';

import ManagerDashboard from '../components/employee/ManagerDashboard';
import ManagerSchedule from '../components/employee/ManagerSchedule';
import ManagerStaff from '../components/employee/ManagerStaff';
import ManagerLeave from '../components/employee/ManagerLeave';
import ManagerPayroll from '../components/employee/ManagerPayroll';
import ManagerDocuments from '../components/employee/ManagerDocuments';

// Placeholder components for Manager tabs
// const ManagerDashboard = () => <div className="p-8"><h2 className="text-2xl font-bold">Manager Dashboard</h2></div>;
// const ManagerSchedule = () => <div className="p-8"><h2 className="text-2xl font-bold">Team Schedule</h2></div>;
// const ManagerStaff = () => <div className="p-8"><h2 className="text-2xl font-bold">Staff Directory</h2></div>;
// const ManagerLeave = () => <div className="p-8"><h2 className="text-2xl font-bold">Leave Approvals</h2></div>;
// const ManagerPayroll = () => <div className="p-8"><h2 className="text-2xl font-bold">Payroll View</h2></div>;
// const ManagerDocuments = () => <div className="p-8"><h2 className="text-2xl font-bold">Documents</h2></div>;

interface EmployeeDashboardProps {
   user: any;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
   const [sidebarOpen, setSidebarOpen] = useState(true);

   return (
      <div className="flex h-screen bg-slate-50 font-inter overflow-hidden">
         <EmployeeSidebar
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
            userRole={user.role}
         />

         <div className="flex-1 flex flex-col min-w-0">
            <EmployeeTopBar
               user={user}
               sidebarOpen={sidebarOpen}
               setSidebarOpen={setSidebarOpen}
            />

            <main className="flex-1 overflow-y-auto">
               <Routes>
                  {/* Personal Routes */}
                  <Route path="/" element={<MySchedule />} />
                  <Route path="/attendance" element={<MyAttendance />} />
                  <Route path="/leave" element={<MyLeave />} />
                  <Route path="/profile" element={<MyProfile />} />

                  {/* Manager Routes */}
                  <Route path="/manager" element={<ManagerDashboard />} />
                  <Route path="/manager/schedule" element={<ManagerSchedule />} />
                  <Route path="/manager/staff" element={<ManagerStaff />} />
                  <Route path="/manager/leave" element={<ManagerLeave />} />
                  <Route path="/manager/payroll" element={<ManagerPayroll />} />
                  <Route path="/manager/documents" element={<ManagerDocuments />} />
               </Routes>
            </main>
         </div>
      </div>
   );
};

export default EmployeeDashboard;
