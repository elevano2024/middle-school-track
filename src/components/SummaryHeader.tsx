
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Progress Overview</h2>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">{counts.working}</div>
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Working</div>
        </div>
        
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-3xl font-bold text-red-600">{counts.needHelp}</div>
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Need Help</div>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-3xl font-bold text-yellow-600">{counts.readyReview}</div>
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Ready Review</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-3xl font-bold text-green-600">{counts.completed}</div>
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Completed</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span>Working</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Need Help</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span>Ready for Review</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center ml-6">
          <span className="text-gray-400">No Tasks</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryHeader;
