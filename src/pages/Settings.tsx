
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { AddSubjectForm } from '@/components/AddSubjectForm';
import { AddTaskForm } from '@/components/AddTaskForm';
import { BookOpen, ClipboardList, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const { isTeacher, isAdmin, loading } = useUserRole();
  const [activeTab, setActiveTab] = useState('subjects');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Only teachers and admins can access this page
  if (!isTeacher && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Montessori Settings</h1>
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

        <TabsContent value="subjects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-700">Add New Subject Area</CardTitle>
              <CardDescription>
                Create subject areas that align with Montessori principles (e.g., Practical Life, Sensorial, Mathematics, Language, Cultural Studies)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddSubjectForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-700">Create Learning Activity</CardTitle>
              <CardDescription>
                Assign meaningful learning activities to students based on their individual development and interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddTaskForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
