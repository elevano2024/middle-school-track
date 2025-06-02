
import React, { useEffect, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import { supabase } from '@/integrations/supabase/client';
import TaskCard from './TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { setupStudentTestData } from '@/utils/setupTestData';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, updateTaskStatus } = useTasks();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const [studentRecord, setStudentRecord] = useState<any>(null);
  const [studentLoading, setStudentLoading] = useState(true);

  // Fetch the student record for the current user
  useEffect(() => {
    const fetchStudentRecord = async () => {
      if (!user) return;

      try {
        // First, try to find student by email match with user email
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          // Look for a student with matching name or email
          const { data: studentData, error } = await supabase
            .from('students')
            .select('*')
            .ilike('name', `%${profileData.full_name || user.email}%`)
            .limit(1);

          if (error) {
            console.error('Error fetching student record:', error);
          } else if (studentData && studentData.length > 0) {
            console.log('Found student record:', studentData[0]);
            setStudentRecord(studentData[0]);
          } else {
            console.log('No student record found for user');
          }
        }
      } catch (error) {
        console.error('Error fetching student record:', error);
      } finally {
        setStudentLoading(false);
      }
    };

    fetchStudentRecord();
  }, [user]);

  // Set up test data on component mount for development
  useEffect(() => {
    if (user && user.email === 'ravigillsingh12@gmail.com') {
      console.log('Setting up test data for student user');
      setupStudentTestData();
    }
  }, [user]);

  if (tasksLoading || subjectsLoading || studentLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Loading your tasks...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Current user:', user?.email);
  console.log('Student record:', studentRecord);
  console.log('All tasks fetched:', tasks);
  console.log('User ID:', user?.id);

  // Filter tasks to only show the current student's tasks using the student record ID
  const studentTasks = studentRecord 
    ? tasks.filter(task => {
        console.log('Comparing task student_id:', task.student_id, 'with student record ID:', studentRecord.id);
        return task.student_id === studentRecord.id;
      })
    : [];

  console.log('Filtered student tasks:', studentTasks);

  // Group tasks by subject
  const tasksBySubject = studentTasks.reduce((acc, task) => {
    const subjectName = task.subjects?.name || 'Unknown Subject';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: any) => {
    console.log(`Student updating task ${taskId} to status ${newStatus}`);
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      console.log(`Task ${taskId} status updated to ${newStatus}`);
    } else {
      console.error(`Failed to update task ${taskId} status to ${newStatus}`);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      working: 0,
      'need-help': 0,
      'ready-review': 0,
      completed: 0
    };
    
    studentTasks.forEach(task => {
      counts[task.status as keyof typeof counts]++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your progress and update your task status</p>
        <p className="text-sm text-gray-500 mt-1">Logged in as: {user?.email}</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.working}</div>
            <div className="text-sm text-gray-600">Working</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts['need-help']}</div>
            <div className="text-sm text-gray-600">Need Help</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts['ready-review']}</div>
            <div className="text-sm text-gray-600">Ready for Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Information */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p className="text-sm">Total tasks found: {tasks.length}</p>
          <p className="text-sm">Student tasks: {studentTasks.length}</p>
          <p className="text-sm">User ID: {user?.id}</p>
          <p className="text-sm">Student Record ID: {studentRecord?.id || 'Not found'}</p>
          <p className="text-sm">Student Name: {studentRecord?.name || 'Not found'}</p>
        </CardContent>
      </Card>

      {/* Tasks by Subject */}
      {!studentRecord ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No student record found for your account.</p>
            <p className="text-sm text-gray-400 mt-2">
              Please contact your teacher to set up your student profile.
            </p>
          </CardContent>
        </Card>
      ) : Object.keys(tasksBySubject).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No tasks assigned yet. Check back later!</p>
            <p className="text-sm text-gray-400 mt-2">
              If you should have tasks, try refreshing the page or contact your teacher.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(tasksBySubject).map(([subjectName, subjectTasks]) => (
            <Card key={subjectName}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-lg font-semibold">{subjectName}</span>
                  <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {subjectTasks.length} task{subjectTasks.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {subjectTasks.map(task => {
                    // Transform task to match TaskCard interface
                    const transformedTask = {
                      id: task.id,
                      title: task.title,
                      description: task.description || '',
                      studentId: task.student_id,
                      subject: subjectName,
                      status: task.status,
                      timeInStatus: task.time_in_status || 0,
                      createdAt: task.created_at
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
