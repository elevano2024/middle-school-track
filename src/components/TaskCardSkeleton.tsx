import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const TaskCardSkeleton: React.FC = () => {
  return (
    <div className="w-64 min-w-64 max-w-64 border rounded-xl p-3 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <Skeleton className="h-4 w-32 flex-1 pr-2" />
        <div className="flex items-center flex-shrink-0">
          <Skeleton className="w-2 h-2 rounded-full mr-2 mt-1" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
      </div>
      
      <Skeleton className="h-6 w-20 mb-2 rounded-md" />
      
      <div className="flex items-center mb-2">
        <Skeleton className="w-3 h-3 mr-1 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  );
};

export default TaskCardSkeleton;
