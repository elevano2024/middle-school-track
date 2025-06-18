
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types/workflow';
import { Clock, CircleDot } from 'lucide-react';

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
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          label: 'WORKING',
          dotColor: 'bg-blue-500'
        };
      case 'need-help':
        return {
          color: 'bg-red-100 border-red-300 text-red-800',
          label: 'NEED HELP',
          dotColor: 'bg-red-500'
        };
      case 'ready-review':
        return {
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
          label: 'READY REVIEW',
          dotColor: 'bg-yellow-500'
        };
      case 'completed':
        return {
          color: 'bg-green-100 border-green-300 text-green-800',
          label: 'COMPLETED',
          dotColor: 'bg-green-500'
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (isUpdating || newStatus === task.status) return;
    
    setIsUpdating(true);
    setUpdateError(null);
    console.log(`Task "${task.title}" status changing from ${task.status} to ${newStatus}`);
    
    try {
      const success = await onUpdateStatus(task.id, newStatus);
      
      if (success) {
        console.log(`Task "${task.title}" status successfully changed to ${newStatus}`);
        // Automatically collapse the card after successful status change
        setIsExpanded(false);
      } else {
        console.error(`Failed to update task "${task.title}" status to ${newStatus}`);
        setUpdateError(`Failed to update status. Please try again.`);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setUpdateError(`Error updating status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusOptions = (): TaskStatus[] => {
    return ['working', 'need-help', 'ready-review', 'completed'];
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    setUpdateError(null); // Clear any previous errors when expanding
  };

  return (
    <div className={`border rounded-lg p-3 transition-all hover:shadow-md ${statusConfig.color} ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold line-clamp-2 flex-1">{task.title}</h4>
        <div className="flex items-center ml-2">
          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} flex-shrink-0 mr-2 mt-1`}></div>
          <button
            onClick={handleIconClick}
            className="p-1 hover:bg-white/50 rounded-full transition-colors"
            disabled={isUpdating}
          >
            <CircleDot className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="text-xs font-medium mb-2">{statusConfig.label}</div>
      
      {task.timeInStatus > 0 && (
        <div className="flex items-center text-xs text-gray-600 mb-2">
          <Clock className="w-3 h-3 mr-1" />
          {task.timeInStatus}m
        </div>
      )}

      {updateError && (
        <div className="text-xs text-red-600 mb-2 p-2 bg-red-50 rounded">
          {updateError}
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-700 mb-3">{task.description}</p>
          
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
                className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                  status === task.status 
                    ? 'bg-gray-200 font-medium' 
                    : 'hover:bg-gray-100'
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
