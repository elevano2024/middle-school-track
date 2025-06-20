import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { AddSubjectForm } from '@/components/AddSubjectForm';
import { AddTaskForm } from '@/components/AddTaskForm';
import { SubjectsList } from '@/components/SubjectsList';
import { TasksList } from '@/components/TasksList';
import { BookOpen, ClipboardList, Settings as SettingsIcon } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useTasks } from '@/hooks/useTasks';

const Settings = () => {
  const { isTeacher, isAdmin, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('subjects');
  const { refetch: refetchSubjects } = useSubjects();
  const { refetch: refetchTasks } = useTasks();

  // Wait for role loading to complete before checking permissions
  if (roleLoading) {
    return null; // Let the central loading handle this
  }

  // Only teachers and admins can access this page
  if (!isTeacher && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSubjectCreated = async () => {
    console.log('Subject created, refetching subjects...');
    await refetchSubjects();
  };

  const handleTaskCreated = async () => {
    console.log('Task created, refetching tasks...');
    await refetchTasks();
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">ARCC Task Management</h1>
        </div>
        <p className="text-gray-600">Manage subjects and learning activities for your students</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Learning Activities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-700">Add New Subject Area</CardTitle>
              <CardDescription>
                Create subject areas that align with Montessori principles (e.g., Practical Life, Sensorial, Mathematics, Language, Cultural Studies)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddSubjectForm onSubjectCreated={handleSubjectCreated} />
            </CardContent>
          </Card>

          <SubjectsList />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-700">Create Learning Activity</CardTitle>
              <CardDescription>
                Assign meaningful learning activities to students based on their individual development and interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddTaskForm onTaskCreated={handleTaskCreated} />
            </CardContent>
          </Card>

          <TasksList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
