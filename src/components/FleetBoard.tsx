
import React, { useState, useMemo } from 'react';
import { Student, Task, TaskStatus } from '../types/workflow';
import TaskCard from './TaskCard';
import { ChevronRight, ChevronDown } from 'lucide-react';

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

  // State to track which columns are collapsed
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

  const getTasksForStudentAndSubject = (studentId: string, subject: string): Task[] => {
    const studentTasks = tasks.filter(task => task.studentId === studentId);
    const subjectTasks = studentTasks.filter(task => task.subject === subject);
    console.log(`Tasks for student ${studentId} and subject ${subject}:`, subjectTasks);
    return subjectTasks;
  };

  // Determine which subjects have no tasks across all students
  const subjectsWithNoTasks = useMemo(() => {
    const emptySubjects = new Set<string>();
    
    subjects.forEach(subject => {
      const hasAnyTasks = students.some(student => {
        const subjectTasks = getTasksForStudentAndSubject(student.id, subject);
        return subjectTasks.length > 0;
      });
      
      if (!hasAnyTasks) {
        emptySubjects.add(subject);
      }
    });
    
    return emptySubjects;
  }, [subjects, students, tasks]);

  // Initialize collapsed state for subjects with no tasks
  React.useEffect(() => {
    setCollapsedColumns(new Set(subjectsWithNoTasks));
  }, [subjectsWithNoTasks]);

  const toggleColumn = (subject: string) => {
    const newCollapsed = new Set(collapsedColumns);
    if (newCollapsed.has(subject)) {
      newCollapsed.delete(subject);
    } else {
      newCollapsed.add(subject);
    }
    setCollapsedColumns(newCollapsed);
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

  // Filter visible subjects (non-collapsed ones)
  const visibleSubjects = subjects.filter(subject => !collapsedColumns.has(subject));

  return (
    <div className="space-y-6">
      {/* Subject Toggle Controls */}
      {subjects.length > visibleSubjects.length && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Collapsed Subjects</h3>
          <div className="flex flex-wrap gap-2">
            {subjects
              .filter(subject => collapsedColumns.has(subject))
              .map(subject => (
                <button
                  key={subject}
                  onClick={() => toggleColumn(subject)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  <ChevronRight className="h-3 w-3 mr-1" />
                  {subject}
                  {subjectsWithNoTasks.has(subject) && (
                    <span className="ml-1 text-gray-500">(empty)</span>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Fleet Board Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[140px]">
                  Student
                </th>
                {visibleSubjects.map(subject => (
                  <th key={subject} className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[180px]">
                    <div className="flex items-center justify-center space-x-2">
                      <span>{subject}</span>
                      <button
                        onClick={() => toggleColumn(subject)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Collapse column"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                    {student.name}
                  </td>
                  {visibleSubjects.map(subject => {
                    const subjectTasks = getTasksForStudentAndSubject(student.id, subject);
                    return (
                      <td key={`${student.id}-${subject}`} className="px-2 py-2 border-r border-gray-200 min-h-[100px] align-top">
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
