import React from 'react';
import { Task, TaskStatusCounts } from '../types/workflow';
import { TaskStatus } from '@/types/task';

type StatusFilter = TaskStatus | 'all';

interface SummaryHeaderProps {
  tasks: Task[];
  onStatusFilter?: (status: StatusFilter) => void;
  activeFilter?: StatusFilter;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({ 
  tasks, 
  onStatusFilter,
  activeFilter = 'all'
}) => {
  const getCounts = (): TaskStatusCounts => {
    return tasks.reduce((counts, task) => {
      switch (task.status) {
        case 'todo':
          counts.todo++;
          break;
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
    }, { todo: 0, working: 0, needHelp: 0, readyReview: 0, completed: 0 });
  };

  const counts = getCounts();

  // Handle tile click
  const handleTileClick = (status: TaskStatus) => {
    if (onStatusFilter) {
      // If clicking the same filter, clear it. Otherwise, set the new filter
      const newFilter = activeFilter === status ? 'all' : status;
      onStatusFilter(newFilter);
    }
  };

  // Get tile styles based on active state
  const getTileStyles = (status: TaskStatus, baseClasses: string) => {
    const isActive = activeFilter === status;
    const clickable = !!onStatusFilter;
    
    let classes = baseClasses;
    
    if (clickable) {
      classes += ' cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md';
      
      if (isActive) {
        classes += ' ring-2 ring-offset-2 shadow-lg';
        
        // Add specific ring colors for each status
        switch (status) {
          case 'todo':
            classes += ' ring-gray-400';
            break;
          case 'working':
            classes += ' ring-blue-400';
            break;
          case 'need-help':
            classes += ' ring-rose-400';
            break;
          case 'ready-review':
            classes += ' ring-amber-400';
            break;
          case 'completed':
            classes += ' ring-emerald-400';
            break;
        }
      }
    }
    
    return classes;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 p-4 md:p-8 mb-4 md:mb-6">
      {onStatusFilter && activeFilter !== 'all' && (
        <div className="flex justify-center md:justify-end mb-4 md:mb-6">
          <div className="text-xs md:text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Click the same tile again to clear filter
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <div 
          className={getTileStyles(
            'todo',
            "text-center p-3 md:p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200/50 shadow-sm"
          )}
          onClick={() => handleTileClick('todo')}
          role={onStatusFilter ? "button" : undefined}
          tabIndex={onStatusFilter ? 0 : undefined}
          title={onStatusFilter ? "Filter by TO DO tasks" : undefined}
        >
          <div className="text-2xl md:text-3xl font-bold text-gray-700">{counts.todo}</div>
          <div className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mt-1">TO DO</div>
        </div>

        <div 
          className={getTileStyles(
            'working',
            "text-center p-3 md:p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50 shadow-sm"
          )}
          onClick={() => handleTileClick('working')}
          role={onStatusFilter ? "button" : undefined}
          tabIndex={onStatusFilter ? 0 : undefined}
          title={onStatusFilter ? "Filter by Working tasks" : undefined}
        >
          <div className="text-2xl md:text-3xl font-bold text-blue-700">{counts.working}</div>
          <div className="text-xs md:text-sm font-semibold text-blue-600 uppercase tracking-wide mt-1">WORKING</div>
        </div>

        <div 
          className={getTileStyles(
            'need-help',
            "text-center p-3 md:p-5 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl border border-rose-200/50 shadow-sm"
          )}
          onClick={() => handleTileClick('need-help')}
          role={onStatusFilter ? "button" : undefined}
          tabIndex={onStatusFilter ? 0 : undefined}
          title={onStatusFilter ? "Filter by Need Help tasks" : undefined}
        >
          <div className="text-2xl md:text-3xl font-bold text-rose-700">{counts.needHelp}</div>
          <div className="text-xs md:text-sm font-semibold text-rose-600 uppercase tracking-wide mt-1">NEED HELP</div>
        </div>

        <div 
          className={getTileStyles(
            'ready-review',
            "text-center p-3 md:p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200/50 shadow-sm"
          )}
          onClick={() => handleTileClick('ready-review')}
          role={onStatusFilter ? "button" : undefined}
          tabIndex={onStatusFilter ? 0 : undefined}
          title={onStatusFilter ? "Filter by Ready for Review tasks" : undefined}
        >
          <div className="text-2xl md:text-3xl font-bold text-amber-700">{counts.readyReview}</div>
          <div className="text-xs md:text-sm font-semibold text-amber-600 uppercase tracking-wide mt-1">READY REVIEW</div>
        </div>

        <div 
          className={getTileStyles(
            'completed',
            "text-center p-3 md:p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200/50 shadow-sm"
          )}
          onClick={() => handleTileClick('completed')}
          role={onStatusFilter ? "button" : undefined}
          tabIndex={onStatusFilter ? 0 : undefined}
          title={onStatusFilter ? "Filter by Completed tasks" : undefined}
        >
          <div className="text-2xl md:text-3xl font-bold text-emerald-700">{counts.completed}</div>
          <div className="text-xs md:text-sm font-semibold text-emerald-600 uppercase tracking-wide mt-1">COMPLETED</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryHeader;
