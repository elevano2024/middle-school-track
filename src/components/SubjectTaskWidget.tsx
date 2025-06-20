import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskCard from './TaskCard';
import { Task } from '@/hooks/useTasks';
import { TaskStatus } from '@/types/task';

interface SubjectTaskWidgetProps {
  subjectName: string;
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
}

const SubjectTaskWidget: React.FC<SubjectTaskWidgetProps> = ({
  subjectName,
  tasks,
  onUpdateTaskStatus
}) => {
  const getStatusCounts = () => {
    const counts = {
      working: 0,
      'need-help': 0,
      'ready-review': 0,
      completed: 0
    };
    
    tasks.forEach(task => {
      counts[task.status as keyof typeof counts]++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    console.log(`SubjectTaskWidget updating task ${taskId} to status ${newStatus}`);
    
    try {
      const success = await onUpdateTaskStatus(taskId, newStatus);
      if (success) {
        console.log(`Task ${taskId} status updated successfully to ${newStatus}`);
        return true;
      } else {
        console.error(`Failed to update task ${taskId} status to ${newStatus}`);
        return false;
      }
    } catch (error) {
      console.error('Error in SubjectTaskWidget handleUpdateTaskStatus:', error);
      return false;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold text-gray-800">{subjectName}</span>
          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
        
        {/* Status summary for this subject */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">{statusCounts.working}</div>
            <div className="text-xs text-gray-600">Working</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-lg font-bold text-red-600">{statusCounts['need-help']}</div>
            <div className="text-xs text-gray-600">Need Help</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-lg font-bold text-yellow-600">{statusCounts['ready-review']}</div>
            <div className="text-xs text-gray-600">Ready Review</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map(task => {
            // Transform task to match TaskCard interface
            const transformedTask = {
              id: task.id,
              title: task.title,
              description: task.description || '',
              studentId: task.student_id,
              subject: subjectName,
              status: task.status,
              timeInStatus: task.time_in_status || 0,
              createdAt: task.created_at,
              // Include teacher feedback fields
              teacher_feedback_type: task.teacher_feedback_type,
              teacher_feedback_message: task.teacher_feedback_message,
              teacher_next_steps: task.teacher_next_steps,
              feedback_given_at: task.feedback_given_at,
              feedback_given_by: task.feedback_given_by
            };

            return (
              <TaskCard
                key={task.id}
                task={transformedTask}
                onUpdateStatus={handleUpdateTaskStatus}
              />
            );
          })}
        </div>
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks for this subject yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectTaskWidget;
