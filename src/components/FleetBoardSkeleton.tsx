
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const FleetBoardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Summary Header Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fleet Board Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, studentIndex) => (
              <div key={studentIndex} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, taskIndex) => (
                    <div key={taskIndex} className="border rounded p-3">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-2" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetBoardSkeleton;
