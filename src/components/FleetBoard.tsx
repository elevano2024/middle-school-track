
import React from 'react';
import { Student, Task, TaskStatus } from '../types/workflow';
import TaskCard from './TaskCard';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

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
  getTasksForStudent
}) => {
  console.log('FleetBoard props:', { students, subjects, tasks });

  const getTasksForStudentAndSubject = (studentId: string, subject: string): Task[] => {
    const studentTasks = tasks.filter(task => task.studentId === studentId);
    const subjectTasks = studentTasks.filter(task => task.subject === subject);
    console.log(`Tasks for student ${studentId} and subject ${subject}:`, subjectTasks);
    return subjectTasks;
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

  return (
    <div className="space-y-6">
      {/* Fleet Board Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-fit">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 min-w-[140px] sticky left-0 bg-gray-50 z-10">
                    Student
                  </th>
                  {subjects.map(subject => (
                    <th key={subject} className="px-4 py-3 text-center text-sm font-medium text-gray-900 min-w-[180px]">
                      {subject}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">
                      {student.name}
                    </td>
                    {subjects.map(subject => {
                      const subjectTasks = getTasksForStudentAndSubject(student.id, subject);
                      return (
                        <td key={`${student.id}-${subject}`} className="px-2 py-2 min-h-[100px] align-top">
                          <div className="space-y-2">
                            {subjectTasks.length > 0 ? (
                              subjectTasks.map(task => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  onUpdateStatus={onUpdateTaskStatus}
                                />
                              ))
                            ) : (
                              <div className="text-center py-4 text-sm text-gray-400">
                                No tasks assigned
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Students Need Attention</h3>
          <ul className="space-y-2">
            {attentionNeeded.map((item, index) => (
              <li key={index} className="text-sm text-yellow-700">
                <strong>{item.studentName}</strong> - {item.subject}: {item.taskTitle} 
                <span className="text-yellow-600"> (needs help for {item.timeNeedingHelp} minutes)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FleetBoard;
