
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, BookOpen } from 'lucide-react';
import AttendanceIndicator from './AttendanceIndicator';
import type { TaskStatus } from '@/types/task';

interface Student {
  id: string;
  name: string;
  grade: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  studentId: string;
  subject: string;
  status: TaskStatus;
  timeInStatus: number;
  createdAt: string;
}

interface FleetBoardProps {
  students: Student[];
  subjects: string[];
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
  getTasksForStudent: (studentId: string) => Task[];
}

const FleetBoard: React.FC<FleetBoardProps> = ({
  students,
  subjects,
  tasks,
  onUpdateTaskStatus,
  getTasksForStudent,
}) => {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'working':
        return 'bg-blue-500';
      case 'need-help':
        return 'bg-red-500';
      case 'ready-review':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'working':
        return 'Working';
      case 'need-help':
        return 'Need Help';
      case 'ready-review':
        return 'Ready Review';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await onUpdateTaskStatus(taskId, newStatus);
  };

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-blue-700">Student Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No students found. Add students to see their progress here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Fleet Board ({students.length} students)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => {
              const studentTasks = getTasksForStudent(student.id);
              const workingTasks = studentTasks.filter(task => task.status === 'working');
              const needHelpTasks = studentTasks.filter(task => task.status === 'need-help');
              const readyReviewTasks = studentTasks.filter(task => task.status === 'ready-review');
              const completedTasks = studentTasks.filter(task => task.status === 'completed');

              return (
                <Card key={student.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AttendanceIndicator 
                          studentId={student.id} 
                          studentName={student.name}
                          showControls={true}
                        />
                        <div>
                          <CardTitle className="text-sm font-medium">{student.name}</CardTitle>
                          <p className="text-xs text-gray-500">Grade {student.grade}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Total Tasks:</span>
                        <Badge variant="outline" className="text-xs">
                          {studentTasks.length}
                        </Badge>
                      </div>

                      {studentTasks.length > 0 && (
                        <div className="space-y-1">
                          {workingTasks.length > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-blue-600">Working:</span>
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {workingTasks.length}
                              </Badge>
                            </div>
                          )}
                          {needHelpTasks.length > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-red-600">Need Help:</span>
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                {needHelpTasks.length}
                              </Badge>
                            </div>
                          )}
                          {readyReviewTasks.length > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-yellow-600">Ready Review:</span>
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                {readyReviewTasks.length}
                              </Badge>
                            </div>
                          )}
                          {completedTasks.length > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-600">Completed:</span>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {completedTasks.length}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {studentTasks.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No tasks assigned</p>
                      )}

                      {/* Recent Tasks */}
                      {studentTasks.length > 0 && (
                        <div className="mt-3 pt-2 border-t">
                          <p className="text-xs font-medium text-gray-600 mb-1">Recent Tasks:</p>
                          <div className="space-y-1">
                            {studentTasks.slice(0, 2).map((task) => (
                              <div key={task.id} className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate" title={task.title}>
                                    {task.title}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <BookOpen className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">{task.subject}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-2">
                                  <div className="flex gap-1">
                                    {(['working', 'need-help', 'ready-review', 'completed'] as TaskStatus[]).map((status) => (
                                      <Button
                                        key={status}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStatusChange(task.id, status)}
                                        className={`h-4 w-4 p-0 rounded-full ${
                                          task.status === status 
                                            ? getStatusColor(status) 
                                            : 'bg-gray-200 hover:bg-gray-300'
                                        }`}
                                        title={getStatusLabel(status)}
                                      />
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      {Math.floor(task.timeInStatus / 60)}m
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {studentTasks.length > 2 && (
                            <p className="text-xs text-gray-500 mt-1">
                              +{studentTasks.length - 2} more tasks
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetBoard;
