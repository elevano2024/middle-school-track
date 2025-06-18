
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { AddSubjectForm } from '@/components/AddSubjectForm';
import { AddTaskForm } from '@/components/AddTaskForm';
import { BookOpen, ClipboardList, Plus } from 'lucide-react';

const AddContent = () => {
  const { isTeacher, isAdmin, loading } = useUserRole();
  const [activeTab, setActiveTab] = useState('subjects');

  if (loading) {
    return (
      <div className="min-h-screen surface-container-lowest flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body-large text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only teachers and admins can access this page
  if (!isTeacher && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-display-small font-medium text-foreground">Add Content</h1>
            <p className="text-body-large text-muted-foreground">Create subjects and assign tasks to students</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-xl">
          <TabsTrigger value="subjects" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:elevation-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-label-large">Add Subject</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:elevation-1">
            <ClipboardList className="h-4 w-4" />
            <span className="text-label-large">Add Task</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-headline-medium flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                Create New Subject
              </CardTitle>
              <CardDescription className="text-body-medium">
                Add a new subject that can be assigned to students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddSubjectForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-headline-medium flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-primary" />
                Create New Task
              </CardTitle>
              <CardDescription className="text-body-medium">
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
