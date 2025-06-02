
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';

interface TaskFormData {
  title: string;
  description: string;
  student_id: string;
  subject_id: string;
}

export const AddTaskForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { students, loading: studentsLoading } = useStudents();
  const { subjects, loading: subjectsLoading } = useSubjects();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TaskFormData>();

  const selectedStudentId = watch('student_id');
  const selectedSubjectId = watch('subject_id');

  const onSubmit = async (data: TaskFormData) => {
    if (!data.student_id || !data.subject_id) {
      toast({
        title: "Error",
        description: "Please select both a student and a subject.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: data.title,
          description: data.description || null,
          student_id: data.student_id,
          subject_id: data.subject_id,
          status: 'working'
        }]);

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Error",
          description: "Failed to create task. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Task created successfully!",
        });
        reset();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (studentsLoading || subjectsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Loading students and subjects...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          placeholder="e.g., Complete Chapter 5 worksheet"
          {...register('title', { 
            required: 'Task title is required',
            minLength: { value: 3, message: 'Task title must be at least 3 characters' }
          })}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Task Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Additional details about the task..."
          rows={3}
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Student</Label>
          <Select onValueChange={(value) => setValue('student_id', value)} value={selectedStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} (Grade {student.grade})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.student_id && (
            <p className="text-sm text-red-600">Please select a student</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Subject</Label>
          <Select onValueChange={(value) => setValue('subject_id', value)} value={selectedSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    {subject.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subject_id && (
            <p className="text-sm text-red-600">Please select a subject</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Task'}
      </Button>
    </form>
  );
};
