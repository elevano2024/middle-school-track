
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { Subject } from '@/hooks/useSubjects';
import TaskCard from './TaskCard';

interface StudentTaskBoardProps {
  subjects: Subject[];
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: any) => Promise<void>;
}

const StudentTaskBoard: React.FC<StudentTaskBoardProps> = ({
  subjects,
  tasks,
  onUpdateTaskStatus
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'need-help':
        return <HelpCircle className="h-4 w-4 text-red-600" />;
      case 'ready-review':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-blue-50 border-blue-200';
      case 'need-help':
        return 'bg-red-50 border-red-200';
      case 'ready-review':
        return 'bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Group tasks by subject
  const tasksBySubject = subjects.reduce((acc, subject) => {
    acc[subject.id] = {
      subject,
      tasks: tasks.filter(task => task.subject_id === subject.id)
    };
    return acc;
  }, {} as Record<string, { subject: Subject; tasks: Task[] }>);

  // Only show subjects that have tasks
  const subjectsWithTasks = Object.values(tasksBySubject).filter(item => item.tasks.length > 0);

  if (subjectsWithTasks.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Tasks Assigned</h3>
          <p className="text-gray-500">You don't have any tasks assigned yet. Check back later!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {subjectsWithTasks.map(({ subject, tasks: subjectTasks }) => {
        // Group tasks by status for this subject
        const statusGroups = {
          working: subjectTasks.filter(task => task.status === 'working'),
          'need-help': subjectTasks.filter(task => task.status === 'need-help'),
          'ready-review': subjectTasks.filter(task => task.status === 'ready-review'),
          completed: subjectTasks.filter(task => task.status === 'completed')
        };

        return (
          <Card key={subject.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-6 w-6" />
                  <span className="text-xl font-bold">{subject.name}</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {subjectTasks.length} task{subjectTasks.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Working Column */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-blue-200">
                    {getStatusIcon('working')}
                    <h4 className="font-semibold text-blue-700">Working</h4>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      {statusGroups.working.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {statusGroups.working.map(task => (
                      <div key={task.id} className={`p-3 rounded-lg border-2 ${getStatusColor('working')}`}>
                        <TaskCard
                          task={{
                            id: task.id,
                            title: task.title,
                            description: task.description || '',
                            studentId: task.student_id,
                            subject: subject.name,
                            status: task.status,
                            timeInStatus: task.time_in_status || 0,
                            createdAt: task.created_at
                          }}
                          onUpdateStatus={onUpdateTaskStatus}
                        />
                      </div>
                    ))}
                    {statusGroups.working.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No tasks in progress</p>
                    )}
                  </div>
                </div>

                {/* Need Help Column */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-red-200">
                    {getStatusIcon('need-help')}
                    <h4 className="font-semibold text-red-700">Need Help</h4>
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      {statusGroups['need-help'].length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {statusGroups['need-help'].map(task => (
                      <div key={task.id} className={`p-3 rounded-lg border-2 ${getStatusColor('need-help')}`}>
                        <TaskCard
                          task={{
                            id: task.id,
                            title: task.title,
                            description: task.description || '',
                            studentId: task.student_id,
                            subject: subject.name,
                            status: task.status,
                            timeInStatus: task.time_in_status || 0,
                            createdAt: task.created_at
                          }}
                          onUpdateStatus={onUpdateTaskStatus}
                        />
                      </div>
                    ))}
                    {statusGroups['need-help'].length === 0 && (
                      <p className="text-sm text-gray-500 italic">No help needed</p>
                    )}
                  </div>
                </div>

                {/* Ready for Review Column */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-yellow-200">
                    {getStatusIcon('ready-review')}
                    <h4 className="font-semibold text-yellow-700">Ready for Review</h4>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                      {statusGroups['ready-review'].length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {statusGroups['ready-review'].map(task => (
                      <div key={task.id} className={`p-3 rounded-lg border-2 ${getStatusColor('ready-review')}`}>
                        <TaskCard
                          task={{
                            id: task.id,
                            title: task.title,
                            description: task.description || '',
                            studentId: task.student_id,
                            subject: subject.name,
                            status: task.status,
                            timeInStatus: task.time_in_status || 0,
                            createdAt: task.created_at
                          }}
                          onUpdateStatus={onUpdateTaskStatus}
                        />
                      </div>
                    ))}
                    {statusGroups['ready-review'].length === 0 && (
                      <p className="text-sm text-gray-500 italic">Nothing ready for review</p>
                    )}
                  </div>
                </div>

                {/* Completed Column */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-green-200">
                    {getStatusIcon('completed')}
                    <h4 className="font-semibold text-green-700">Completed</h4>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      {statusGroups.completed.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {statusGroups.completed.map(task => (
                      <div key={task.id} className={`p-3 rounded-lg border-2 ${getStatusColor('completed')}`}>
                        <TaskCard
                          task={{
                            id: task.id,
                            title: task.title,
                            description: task.description || '',
                            studentId: task.student_id,
                            subject: subject.name,
                            status: task.status,
                            timeInStatus: task.time_in_status || 0,
                            createdAt: task.created_at
                          }}
                          onUpdateStatus={onUpdateTaskStatus}
                        />
                      </div>
                    ))}
                    {statusGroups.completed.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No completed tasks</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentTaskBoard;
