
import React from 'react';
import { Circle } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';

interface AttendanceIndicatorProps {
  studentId: string;
  studentName: string;
  showControls?: boolean;
}

const AttendanceIndicator: React.FC<AttendanceIndicatorProps> = ({ 
  studentId, 
  studentName, 
  showControls = false 
}) => {
  const { getAttendanceForStudent, markAttendance, loading } = useAttendance();
  const { isAdmin, isTeacher } = useUserRole();
  const attendanceRecord = getAttendanceForStudent(studentId);

  const handleMarkPresent = async () => {
    await markAttendance(studentId, true);
  };

  const handleMarkAbsent = async () => {
    await markAttendance(studentId, false);
  };

  if (loading) {
    return <Circle className="h-3 w-3 text-gray-300" />;
  }

  const isPresent = attendanceRecord?.is_present;
  const hasRecord = !!attendanceRecord;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Circle 
          className={`h-3 w-3 ${
            hasRecord 
              ? isPresent 
                ? 'text-green-500 fill-green-500' 
                : 'text-red-500 fill-red-500'
              : 'text-gray-300'
          }`}
        />
        {showControls && (isAdmin || isTeacher) && (
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkPresent}
              className={`h-6 px-2 text-xs ${
                isPresent ? 'bg-green-100 text-green-700' : 'hover:bg-green-50'
              }`}
            >
              Present
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAbsent}
              className={`h-6 px-2 text-xs ${
                hasRecord && !isPresent ? 'bg-red-100 text-red-700' : 'hover:bg-red-50'
              }`}
            >
              Absent
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceIndicator;
