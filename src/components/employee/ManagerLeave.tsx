import React from 'react';
import LeaveManager from '../employer/LeaveManager';

const ManagerLeave: React.FC = () => {
    // Reusing the robust LeaveManager from Employer Dashboard
    // In a real app, this might be filtered to only show the manager's team
    return <LeaveManager />;
};

export default ManagerLeave;
