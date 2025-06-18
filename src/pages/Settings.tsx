
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
  const { isTeacher, isAdmin, loading } = useUserRole();
  const [activeTab, setActiveTab] = useState('subjects');
  const { refetch: refetchSubjects } = useSubjects();
  const { refetch: refetchTasks } = useTasks();

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

  const handleSubjectCreated = () => {
    refetchSubjects();
  };

  const handleTaskCreated = () => {
    refetchTasks();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-display-small font-medium text-foreground">Montessori Settings</h1>
            <p className="text-body-large text-muted-foreground">Manage subjects and learning activities for your students</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-xl">
          <TabsTrigger value="subjects" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:elevation-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-label-large">Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:elevation-1">
            <ClipboardList className="h-4 w-4" />
            <span className="text-label-large">Learning Activities</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-8 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-headline-medium text-primary flex items-center gap-3">
                <BookOpen className="h-6 w-6" />
                Add New Subject Area
              </CardTitle>
              <CardDescription className="text-body-medium">
                Create subject areas that align with Montessori principles (e.g., Practical Life, Sensorial, Mathematics, Language, Cultural Studies)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddSubjectForm onSubjectCreated={handleSubjectCreated} />
            </CardContent>
          </Card>

          <SubjectsList />
        </TabsContent>

        <TabsContent value="tasks" className="mt-8 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-headline-medium text-primary flex items-center gap-3">
                <ClipboardList className="h-6 w-6" />
                Create Learning Activity
              </CardTitle>
              <CardDescription className="text-body-medium">
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
