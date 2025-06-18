
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { AddSubjectForm } from '@/components/AddSubjectForm';
import { AddTaskForm } from '@/components/AddTaskForm';

const AddContent = () => {
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
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Content</h1>
        <p className="text-gray-600 mt-2">Create subjects and assign tasks to students</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subjects">Add Subject</TabsTrigger>
          <TabsTrigger value="tasks">Add Task</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Subject</CardTitle>
              <CardDescription>
                Add a new subject that can be assigned to students
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
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>
                Assign a new task to a student for a specific subject
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

export default AddContent;
