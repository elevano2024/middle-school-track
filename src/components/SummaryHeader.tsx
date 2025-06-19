
import React from 'react';
import { Task, TaskStatusCounts } from '../types/workflow';

interface SummaryHeaderProps {
  tasks: Task[];
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ tasks }) => {
  const getCounts = (): TaskStatusCounts => {
    return tasks.reduce((counts, task) => {
      switch (task.status) {
        case 'working':
          counts.working++;
          break;
        case 'need-help':
          counts.needHelp++;
          break;
        case 'ready-review':
          counts.readyReview++;
          break;
        case 'completed':
          counts.completed++;
          break;
      }
      return counts;
    }, { working: 0, needHelp: 0, readyReview: 0, completed: 0 });
  };

  const counts = getCounts();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Progress Overview</h2>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200/50">
          <div className="text-2xl font-bold text-blue-600 mb-1">{counts.working}</div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Working</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200/50">
          <div className="text-2xl font-bold text-red-600 mb-1">{counts.needHelp}</div>
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">Need Help</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200/50">
          <div className="text-2xl font-bold text-yellow-600 mb-1">{counts.readyReview}</div>
          <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Ready Review</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200/50">
          <div className="text-2xl font-bold text-green-600 mb-1">{counts.completed}</div>
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Completed</div>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-8 text-sm bg-gray-50 rounded-full px-6 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-gray-700">Working</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-medium text-gray-700">Need Help</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="font-medium text-gray-700">Ready for Review</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-gray-700">Completed</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="font-medium text-gray-500">No Tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryHeader;
