
import React from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import { useUserRole } from '@/hooks/useUserRole';

interface AttendanceIndicatorProps {
  studentId: string;
  showControls?: boolean;
}

const AttendanceIndicator: React.FC<AttendanceIndicatorProps> = ({ 
  studentId, 
  showControls = false 
}) => {
  const { getAttendanceForStudent, markAttendance } = useAttendance();
  const { isAdmin, isTeacher } = useUserRole();
  
  const attendanceRecord = getAttendanceForStudent(studentId);
  
  // If no record exists, assume absent (red dot)
  const isPresent = attendanceRecord?.is_present ?? false;
  
  const handleToggleAttendance = async () => {
    if (!isAdmin && !isTeacher) return;
    await markAttendance(studentId, !isPresent);
  };

  const dotColor = isPresent ? 'bg-green-500' : 'bg-red-500';
  const tooltip = isPresent ? 'Present today' : 'Absent today';

  if (showControls && (isAdmin || isTeacher)) {
    return (
      <button
        onClick={handleToggleAttendance}
        className={`w-3 h-3 rounded-full ${dotColor} cursor-pointer hover:opacity-80 transition-opacity`}
        title={`${tooltip} - Click to toggle`}
        aria-label={`Mark student ${isPresent ? 'absent' : 'present'}`}
      />
    );
  }

  return (
    <div
      className={`w-3 h-3 rounded-full ${dotColor}`}
      title={tooltip}
      aria-label={tooltip}
    />
  );
};

export default AttendanceIndicator;
