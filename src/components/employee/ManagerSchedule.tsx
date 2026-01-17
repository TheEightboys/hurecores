import React from 'react';
import ScheduleManager from '../employer/ScheduleManager';

const ManagerSchedule: React.FC = () => {
    return (
        <div className="h-full">
            {/* We reuse the robust ScheduleManager from the Employer Dashboard */}
            {/* In a real app, we might pass a 'readOnly' or 'restricted' prop if needed */}
            <ScheduleManager />
        </div>
    );
};

export default ManagerSchedule;
