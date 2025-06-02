
import React, { useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import SubjectTaskWidget from './SubjectTaskWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock, HelpCircle, BookOpen } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError, updateTaskStatus } = useTasks();
  const { subjects, loading: subjectsLoading } = useSubjects();

  // Add debugging to see what's happening
  useEffect(() => {
    console.log('StudentDashboard - Current user:', user);
    console.log('StudentDashboard - User ID:', user?.id);
    console.log('StudentDashboard - User email:', user?.email);
    console.log('StudentDashboard - Tasks loaded:', tasks);
    console.log('StudentDashboard - Tasks loading:', tasksLoading);
    console.log('StudentDashboard - Tasks error:', tasksError);
    console.log('StudentDashboard - Subjects loaded:', subjects);
    console.log('StudentDashboard - Subjects loading:', subjectsLoading);
  }, [user, tasks, tasksLoading, tasksError, subjects, subjectsLoading]);

  if (tasksLoading || subjectsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 animate-spin" />
              <p>Loading your tasks and subjects...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if there's a tasks error
  if (tasksError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {tasksError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log('Current user ID:', user?.id);
  console.log('Current user email:', user?.email);
  console.log('All tasks fetched for student dashboard:', tasks);
  console.log('All subjects fetched:', subjects);

  // Since useTasks already filters by student ID, we can use tasks directly
  const studentTasks = tasks;

  console.log('Student tasks (should be filtered by user ID):', studentTasks);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: any) => {
    console.log(`Student updating task ${taskId} to status ${newStatus}`);
    const success = await updateTaskStatus(taskId, newStatus);
    if (success) {
      console.log(`Task ${taskId} status updated to ${newStatus}`);
    } else {
      console.error(`Failed to update task ${taskId} status to ${newStatus}`);
    }
  };

  const getGlobalStatusCounts = () => {
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

  const globalStatusCounts = getGlobalStatusCounts();

  // Group tasks by subject, now using the fetched subjects
  const tasksBySubject: Record<string, typeof tasks> = {};
  
  // First, create entries for all subjects (even those without tasks)
  subjects.forEach(subject => {
    tasksBySubject[subject.name] = [];
  });
  
  // Then, populate with tasks
  studentTasks.forEach(task => {
    // Try to find subject name from subjects array
    const subject = subjects.find(s => s.id === task.subject_id);
    const subjectName = subject?.name || 'Unknown Subject';
    
    if (!tasksBySubject[subjectName]) {
      tasksBySubject[subjectName] = [];
    }
    tasksBySubject[subjectName].push(task);
  });

  console.log('Tasks grouped by subject:', tasksBySubject);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Learning Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your progress and update your task status</p>
        <p className="text-sm text-gray-500 mt-1">Logged in as: {user?.email}</p>
      </div>

      {/* Global Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{globalStatusCounts.working}</div>
              <div className="text-sm text-gray-600">Working</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{globalStatusCounts['need-help']}</div>
              <div className="text-sm text-gray-600">Need Help</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{globalStatusCounts['ready-review']}</div>
              <div className="text-sm text-gray-600">Ready for Review</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{globalStatusCounts.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject-based Task Widgets */}
      {Object.keys(tasksBySubject).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No subjects or tasks found</h3>
            <p className="text-gray-500 mb-4">Check back later or contact your teacher if you think you should have tasks assigned.</p>
            
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h4 className="font-semibold text-gray-700 mb-2">Debug Information:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Total tasks found:</strong> {studentTasks.length}</p>
                <p><strong>Total subjects found:</strong> {subjects.length}</p>
                <p><strong>Looking for tasks with student_id:</strong> {user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Success Message */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Found {studentTasks.length} task{studentTasks.length !== 1 ? 's' : ''} across {Object.keys(tasksBySubject).length} subject{Object.keys(tasksBySubject).length !== 1 ? 's' : ''}.
            </AlertDescription>
          </Alert>

          {/* Subject Widgets */}
          <div className="space-y-6">
            {Object.entries(tasksBySubject).map(([subjectName, subjectTasks]) => (
              <SubjectTaskWidget
                key={subjectName}
                subjectName={subjectName}
                tasks={subjectTasks}
                onUpdateTaskStatus={handleUpdateTaskStatus}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
