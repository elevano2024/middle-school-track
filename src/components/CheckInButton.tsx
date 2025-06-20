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
        className="bg-gray-50 border-gray-200 text-gray-500"
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
        className="bg-gray-50 border-gray-200 text-gray-500"
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
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
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
        className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
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
      className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
    >
      <Clock className="w-4 h-4 mr-2" />
      {isMarkingAttendance ? "Checking In..." : "Check In"}
    </Button>
  );
};

export default CheckInButton; 