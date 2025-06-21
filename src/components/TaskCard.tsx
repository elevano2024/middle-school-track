import React, { useState } from 'react';
import { CircleDot, Clock } from 'lucide-react';
import { Task, TaskStatus } from '../types/workflow';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'working':
        return {
          color: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-800',
          label: 'WORKING',
          dotColor: 'bg-blue-500',
          ring: 'hover:ring-blue-300'
        };
      case 'need-help':
        return {
          color: 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 text-rose-800',
          label: 'NEED HELP',
          dotColor: 'bg-rose-500',
          ring: 'hover:ring-rose-300'
        };
      case 'ready-review':
        return {
          color: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-800',
          label: 'READY REVIEW',
          dotColor: 'bg-amber-500',
          ring: 'hover:ring-amber-300'
        };
      case 'completed':
        return {
          color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800',
          label: 'COMPLETED',
          dotColor: 'bg-emerald-500',
          ring: 'hover:ring-emerald-300'
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status || isUpdating) return;
    
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      const success = await onUpdateStatus(task.id, newStatus);
      if (success) {
        setIsExpanded(false);
      } else {
        setUpdateError('Failed to update task status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setUpdateError('Failed to update task status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusOptions = (): TaskStatus[] => {
    return ['working', 'need-help', 'ready-review', 'completed'];
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUpdating) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`w-64 min-w-64 max-w-64 border rounded-xl p-3 transition-all duration-200 hover:shadow-md ${statusConfig.color} ${statusConfig.ring} hover:ring-2 ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold line-clamp-2 flex-1 pr-2">{task.title}</h4>
        <div className="flex items-center flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} flex-shrink-0 mr-2 mt-1 shadow-sm`}></div>
          <button
            onClick={handleIconClick}
            className="p-1 hover:bg-white/60 rounded-full transition-colors duration-200 flex-shrink-0"
            disabled={isUpdating}
          >
            <CircleDot className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="text-xs font-medium mb-2 px-2 py-1 bg-white/50 rounded-md inline-block">{statusConfig.label}</div>
      
      {task.timeInStatus > 0 && (
        <div className="flex items-center text-xs text-gray-600 mb-2 bg-white/30 rounded-md px-2 py-1">
          <Clock className="w-3 h-3 mr-1" />
          {task.timeInStatus}m
        </div>
      )}

      {updateError && (
        <div className="text-xs text-rose-700 mb-2 p-2 bg-rose-100/70 rounded border border-rose-200">
          {updateError}
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/30">
          <p className="text-xs text-gray-700 mb-3 bg-white/40 rounded-md p-2 break-words">{task.description}</p>
          
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 mb-2">Change Status:</div>
            {getStatusOptions().map(status => (
              <button
                key={status}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(status);
                }}
                disabled={isUpdating || status === task.status}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                  status === task.status 
                    ? 'bg-white/80 font-medium shadow-sm' 
                    : 'hover:bg-white/60'
                } ${isUpdating ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {getStatusConfig(status).label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
