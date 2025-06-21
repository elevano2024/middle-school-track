import React from 'react';
import { Student, Task, TaskStatus } from '../types/workflow';
import TaskCard from './TaskCard';
import AttendanceIndicator from './AttendanceIndicator';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

type StatusFilter = TaskStatus | 'all';

interface FleetBoardProps {
  students: Student[];
  subjects: string[];
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
  getTasksForStudent: (studentId: string) => Task[];
  statusFilter?: StatusFilter;
}

const FleetBoard: React.FC<FleetBoardProps> = ({
  students,
  subjects,
  tasks,
  onUpdateTaskStatus,
  getTasksForStudent,
  statusFilter = 'all'
}) => {
  console.log('FleetBoard props:', { students, subjects, tasks, statusFilter });

  const getTasksForStudentAndSubject = (studentId: string, subject: string): Task[] => {
    const studentTasks = tasks.filter(task => task.studentId === studentId);
    const subjectTasks = studentTasks.filter(task => task.subject === subject);
    
    // Filter by status if a filter is active
    const filteredTasks = statusFilter === 'all' 
      ? subjectTasks 
      : subjectTasks.filter(task => task.status === statusFilter);
    
    console.log(`Tasks for student ${studentId} and subject ${subject} (filter: ${statusFilter}):`, filteredTasks);
    return filteredTasks;
  };

  const getStudentsNeedingAttention = () => {
    const needingHelp = tasks.filter(task => 
      task.status === 'need-help' && task.timeInStatus >= 5
    );
    
    return needingHelp.map(task => {
      const student = students.find(s => s.id === task.studentId);
      return {
        studentName: student?.name || 'Unknown',
        taskTitle: task.title,
        subject: task.subject,
        timeNeedingHelp: task.timeInStatus
      };
    });
  };

  const attentionNeeded = getStudentsNeedingAttention();

  // Get the display text for the current filter
  const getFilterDisplayText = () => {
    switch (statusFilter) {
      case 'working': return 'Working';
      case 'need-help': return 'Need Help';
      case 'ready-review': return 'Ready for Review';
      case 'completed': return 'Completed';
      default: return 'tasks';
    }
  };

  return (
    <div className="space-y-6">
      {/* Fleet Board Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        {/* Filter indicator for the table */}
        {statusFilter !== 'all' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 border-b border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Filtered View:</span> Only showing{' '}
              <span className="font-semibold">{getFilterDisplayText()}</span> tasks and relevant students/subjects
            </p>
          </div>
        )}
        
        <ScrollArea className="w-full">
          <div className="min-w-fit">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900 min-w-[140px] sticky left-0 bg-gradient-to-r from-blue-50 to-indigo-50 z-10 border-r border-blue-200">
                    Student
                  </th>
                  {subjects.map(subject => (
                    <th key={subject} className="px-4 py-4 text-center text-sm font-semibold text-blue-900 min-w-[180px] border-r border-blue-100 last:border-r-0">
                      {subject}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 bg-blue-50/50 sticky left-0 z-10 border-r border-blue-200">
                      <div className="flex items-center gap-3">
                        <AttendanceIndicator studentId={student.id} showControls={true} />
                        <span className="text-blue-900">{student.name}</span>
                      </div>
                    </td>
                    {subjects.map(subject => {
                      const subjectTasks = getTasksForStudentAndSubject(student.id, subject);
                      return (
                        <td key={`${student.id}-${subject}`} className="px-3 py-3 min-h-[100px] align-top border-r border-blue-100 last:border-r-0">
                          <div className="space-y-2">
                            {subjectTasks.length > 0 ? (
                              subjectTasks.map(task => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onUpdateStatus={onUpdateTaskStatus}
                                />
                              ))
                            ) : statusFilter === 'all' ? (
                              <div className="text-center py-4 text-sm text-gray-400">
                                No tasks assigned
                              </div>
                            ) : (
                              <div className="text-center py-4 text-sm text-gray-300 italic">
                                —
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Students Need Attention Section */}
      {attentionNeeded.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            Students Need Attention
          </h3>
          <ul className="space-y-3">
            {attentionNeeded.map((item, index) => (
              <li key={index} className="text-sm text-amber-700 bg-white/60 rounded-lg p-3 border border-amber-200">
                <strong className="text-amber-900">{item.studentName}</strong> - {item.subject}: {item.taskTitle} 
                <span className="text-amber-600 font-medium"> (needs help for {item.timeNeedingHelp} minutes)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FleetBoard;
