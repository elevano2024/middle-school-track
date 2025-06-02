
import React, { useState } from 'react';
import FleetBoard from '../components/FleetBoard';
import SummaryHeader from '../components/SummaryHeader';
import { Student, Task, TaskStatus } from '../types/workflow';

// Mock data for demonstration
const mockStudents: Student[] = [
  { id: '1', name: 'Alex Chen', grade: 7 },
  { id: '2', name: 'Sarah Martinez', grade: 7 },
  { id: '3', name: 'Michael Johnson', grade: 8 },
  { id: '4', name: 'Emma Davis', grade: 8 },
  { id: '5', name: 'James Wilson', grade: 7 },
  { id: '6', name: 'Olivia Brown', grade: 8 },
];

const subjects = ['Math', 'Science', 'English', 'History', 'Art', 'PE'];

const mockTasks: Task[] = [
  // Alex Chen's tasks
  { id: '1', title: 'Algebra Ch.5', description: 'Complete chapter 5 exercises', studentId: '1', subject: 'Math', status: 'working', timeInStatus: 15 },
  { id: '2', title: 'Fractions Quiz', description: 'Practice fractions quiz', studentId: '1', subject: 'Math', status: 'working', timeInStatus: 8 },
  { id: '3', title: 'Lab Report #3', description: 'Write up science lab results', studentId: '1', subject: 'Science', status: 'completed', timeInStatus: 0 },
  { id: '4', title: 'Essay Draft', description: 'First draft of persuasive essay', studentId: '1', subject: 'English', status: 'ready-review', timeInStatus: 5 },
  { id: '5', title: 'Timeline Project', description: 'Create historical timeline', studentId: '1', subject: 'History', status: 'working', timeInStatus: 20 },
  { id: '6', title: 'Warm-up Run', description: 'Complete fitness warm-up', studentId: '1', subject: 'PE', status: 'completed', timeInStatus: 0 },

  // Sarah Martinez's tasks
  { id: '7', title: 'Word Problems', description: 'Solve math word problems', studentId: '2', subject: 'Math', status: 'need-help', timeInStatus: 12 },
  { id: '8', title: 'Cell Structure', description: 'Study cell parts diagram', studentId: '2', subject: 'Science', status: 'working', timeInStatus: 6 },
  { id: '9', title: 'Book Report', description: 'Write book analysis', studentId: '2', subject: 'English', status: 'completed', timeInStatus: 0 },
  { id: '10', title: 'Map Assignment', description: 'Label world map', studentId: '2', subject: 'History', status: 'ready-review', timeInStatus: 3 },
  { id: '11', title: 'Color Wheel', description: 'Create color mixing chart', studentId: '2', subject: 'Art', status: 'completed', timeInStatus: 0 },
  { id: '12', title: 'Basketball Skills', description: 'Practice dribbling drills', studentId: '2', subject: 'PE', status: 'working', timeInStatus: 10 },

  // Michael Johnson's tasks
  { id: '13', title: 'Geometry Quiz', description: 'Complete shapes quiz', studentId: '3', subject: 'Math', status: 'ready-review', timeInStatus: 7 },
  { id: '14', title: 'Chemistry Lab', description: 'Lab safety experiment', studentId: '3', subject: 'Science', status: 'need-help', timeInStatus: 15 },
  { id: '15', title: 'Paragraph Writing', description: 'Write topic sentences', studentId: '3', subject: 'English', status: 'working', timeInStatus: 9 },
  { id: '16', title: 'Civil War Notes', description: 'Take chapter notes', studentId: '3', subject: 'History', status: 'completed', timeInStatus: 0 },
  { id: '17', title: 'Sculpture Project', description: 'Clay modeling exercise', studentId: '3', subject: 'Art', status: 'working', timeInStatus: 25 },
  { id: '18', title: 'Fitness Test', description: 'Complete fitness assessment', studentId: '3', subject: 'PE', status: 'completed', timeInStatus: 0 },
];

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, timeInStatus: 0 }
          : task
      )
    );
    console.log(`Task ${taskId} status updated to ${newStatus}`);
  };

  const getTasksForStudent = (studentId: string) => {
    return tasks.filter(task => task.studentId === studentId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Student Progress Overview</h1>
      </div>
      
      <div className="p-6">
        <SummaryHeader tasks={tasks} />
        <FleetBoard 
          students={mockStudents}
          subjects={subjects}
          tasks={tasks}
          onUpdateTaskStatus={updateTaskStatus}
          getTasksForStudent={getTasksForStudent}
        />
      </div>
    </div>
  );
};

export default Index;
