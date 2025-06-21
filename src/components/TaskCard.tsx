import React, { useState } from 'react';
import { MoreVertical, Clock, Edit, Trash2, UserPlus, Users } from 'lucide-react';
import { Task as WorkflowTask, TaskStatus } from '../types/workflow';
import { Task as ApiTask } from '@/types/task';
import { useUserRole } from '@/hooks/useUserRole';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { DeleteTaskDialog } from '@/components/DeleteTaskDialog';
import { AssignTaskDialog } from '@/components/AssignTaskDialog';
import { BulkAssignTaskDialog } from '@/components/BulkAssignTaskDialog';

interface TaskCardProps {
  task: WorkflowTask;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Dialog states for task management
  const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<ApiTask | null>(null);
  const [assigningTask, setAssigningTask] = useState<ApiTask | null>(null);
  const [bulkAssigningTask, setBulkAssigningTask] = useState<ApiTask | null>(null);
  
  const { isAdmin, isTeacher } = useUserRole();
  
  // Only teachers and admins can manage tasks
  const canManageTasks = isAdmin || isTeacher;

  // Convert WorkflowTask to ApiTask format for dialogs
  const convertTaskForDialog = (workflowTask: WorkflowTask): ApiTask => {
    return {
      id: workflowTask.id,
      title: workflowTask.title,
      description: workflowTask.description || null,
      student_id: workflowTask.studentId,
      subject_id: '', // We don't have this in WorkflowTask, dialogs will need to handle this
      status: workflowTask.status,
      time_in_status: workflowTask.timeInStatus || null,
      created_at: workflowTask.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subjects: {
        name: workflowTask.subject
      }
    };
  };

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

  // Task management action handlers
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(convertTaskForDialog(task));
    setIsExpanded(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTask(convertTaskForDialog(task));
    setIsExpanded(false);
  };

  const handleAssign = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAssigningTask(convertTaskForDialog(task));
    setIsExpanded(false);
  };

  const handleBulkAssign = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBulkAssigningTask(convertTaskForDialog(task));
    setIsExpanded(false);
  };

  return (
    <div className={`w-64 min-w-64 max-w-64 border rounded-xl p-3 transition-all duration-200 hover:shadow-md ${statusConfig.color} ${statusConfig.ring} hover:ring-2 ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold line-clamp-2 flex-1 pr-2">{task.title}</h4>
        <div className="flex items-center flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} flex-shrink-0 mr-2 mt-1 shadow-sm`}></div>
          <button
            onClick={handleIconClick}
            className={`p-1.5 rounded-full transition-all duration-200 flex-shrink-0 border ${
              isExpanded 
                ? 'bg-white/90 shadow-sm border-white/70 text-gray-800' 
                : 'hover:bg-white/80 hover:shadow-sm border-transparent hover:border-white/50 text-gray-600 hover:text-gray-800'
            }`}
            disabled={isUpdating}
            title={canManageTasks ? "Task options" : "Change status"}
          >
            <MoreVertical className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
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
        <div className="mt-4 pt-4 border-t border-white/40 space-y-4">
          {/* Task Description */}
          <div className="bg-white/50 rounded-lg p-3 border border-white/30 shadow-sm">
            <p className="text-xs text-gray-700 leading-relaxed">{task.description}</p>
          </div>
          
          {/* Status Change Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Change Status</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {getStatusOptions().map(status => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(status);
                  }}
                  disabled={isUpdating || status === task.status}
                  className={`text-center px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    status === task.status 
                      ? 'bg-white/90 shadow-md border-2 border-white/80 text-gray-800 ring-2 ring-white/40' 
                      : 'bg-white/60 hover:bg-white/80 border border-white/50 hover:border-white/70 text-gray-700 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]'
                  } ${isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  {getStatusConfig(status).label}
                </button>
              ))}
            </div>
          </div>

          {/* Task Management Section - Only for Teachers/Admins */}
          {canManageTasks && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Task Management</div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-blue-700 bg-blue-50/70 hover:bg-blue-100/80 rounded-lg transition-all duration-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] border border-blue-100/60 hover:border-blue-200/80 group"
                >
                  <Edit className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Edit Task Details</span>
                </button>
                <button
                  onClick={handleAssign}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80 rounded-lg transition-all duration-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] border border-emerald-100/60 hover:border-emerald-200/80 group"
                >
                  <UserPlus className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Reassign Student</span>
                </button>
                <button
                  onClick={handleBulkAssign}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-purple-700 bg-purple-50/70 hover:bg-purple-100/80 rounded-lg transition-all duration-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] border border-purple-100/60 hover:border-purple-200/80 group"
                >
                  <Users className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Assign to Multiple</span>
                </button>
                
                {/* Destructive Action Separator */}
                <div className="pt-2 mt-3 border-t border-white/40">
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 rounded-lg transition-all duration-200 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] border border-rose-100/60 hover:border-rose-200/80 group hover:ring-2 hover:ring-rose-200/50"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Delete Task</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Management Dialogs */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}

      {deletingTask && (
        <DeleteTaskDialog
          task={deletingTask}
          open={!!deletingTask}
          onOpenChange={(open) => !open && setDeletingTask(null)}
        />
      )}

      {assigningTask && (
        <AssignTaskDialog
          task={assigningTask}
          open={!!assigningTask}
          onOpenChange={(open) => !open && setAssigningTask(null)}
        />
      )}

      {bulkAssigningTask && (
        <BulkAssignTaskDialog
          task={bulkAssigningTask}
          open={!!bulkAssigningTask}
          onOpenChange={(open) => !open && setBulkAssigningTask(null)}
        />
      )}
    </div>
  );
};

export default TaskCard;