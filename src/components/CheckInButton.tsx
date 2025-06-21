import React from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

const CheckInButton: React.FC = () => {
  const { user } = useAuth();
  const { getMyAttendance, markAttendance, isMarkingAttendance, isSchoolDay, loading } = useAttendance();

  if (!user) return null;

  // Show loading state while attendance data is being fetched
  if (loading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
        disabled
      >
        <Clock className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  // If it's not a school day (weekend), show disabled button
  if (!isSchoolDay) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-gray-50 border-gray-200 text-gray-500 shadow-sm"
        disabled
      >
        <Calendar className="w-4 h-4 mr-2" />
        Weekend
      </Button>
    );
  }

  const myAttendance = getMyAttendance();
  const isPresent = myAttendance?.is_present ?? false;
  const hasMarkedAttendance = myAttendance !== null && myAttendance !== undefined;

  const handleCheckIn = async () => {
    const success = await markAttendance(user.id, true);
    if (success) {
      console.log('Check-in successful!');
    }
  };

  if (hasMarkedAttendance && isPresent) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm"
        disabled
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Checked In
      </Button>
    );
  }

  if (hasMarkedAttendance && !isPresent) {
    return (
      <Button
        onClick={handleCheckIn}
        disabled={isMarkingAttendance}
        variant="outline"
        size="sm"
        className="bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-sm"
      >
        <XCircle className="w-4 h-4 mr-2" />
        {isMarkingAttendance ? "Updating..." : "Check In"}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleCheckIn}
      disabled={isMarkingAttendance}
      variant="outline"
      size="sm"
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 shadow-sm"
    >
      <Clock className="w-4 h-4 mr-2" />
      {isMarkingAttendance ? "Checking In..." : "Check In"}
    </Button>
  );
};

export default CheckInButton; 