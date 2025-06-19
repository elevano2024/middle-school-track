
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';

interface TaskFormData {
  title: string;
  description: string;
  student_ids: string[];
  subject_id: string;
}

interface AddTaskFormProps {
  onTaskCreated?: () => void;
}

export const AddTaskForm = ({ onTaskCreated }: AddTaskFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const { toast } = useToast();
  const { students, loading: studentsLoading } = useStudents();
  const { subjects, loading: subjectsLoading } = useSubjects();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TaskFormData>();

  const selectedSubjectId = watch('subject_id');

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    let newSelection: string[];
    
    if (checked) {
      newSelection = [...selectedStudents, studentId];
    } else {
      newSelection = selectedStudents.filter(id => id !== studentId);
    }
    
    setSelectedStudents(newSelection);
    setValue('student_ids', newSelection);
  };

  const handleSelectAll = () => {
    const allStudentIds = students.map(s => s.id);
    setSelectedStudents(allStudentIds);
    setValue('student_ids', allStudentIds);
  };

  const handleSelectNone = () => {
    setSelectedStudents([]);
    setValue('student_ids', []);
  };

  const onSubmit = async (data: TaskFormData) => {
    if (!data.student_ids || data.student_ids.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student.",
        variant: "destructive",
      });
      return;
    }

    if (!data.subject_id) {
      toast({
        title: "Error",
        description: "Please select a subject area.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('=== CREATING NEW TASKS FOR MULTIPLE STUDENTS ===');
    console.log('Task data:', data);
    
    try {
      // Create individual task assignments for each selected student
      const taskPromises = data.student_ids.map(studentId => 
        supabase
          .from('tasks')
          .insert({
            title: data.title,
            description: data.description || null,
            student_id: studentId,
            subject_id: data.subject_id,
            status: 'working'
          })
      );

      const results = await Promise.all(taskPromises);
      
      // Check if any assignments failed
      const hasErrors = results.some(result => result.error);
      
      if (hasErrors) {
        const errorResults = results.filter(result => result.error);
        console.error('Some task assignments failed:', errorResults);
        toast({
          title: "Partial Success",
          description: `${results.length - errorResults.length} of ${results.length} assignments completed successfully.`,
          variant: "destructive",
        });
      } else {
        console.log('=== ALL TASKS CREATED SUCCESSFULLY ===');
        
        toast({
          title: "Success",
          description: `Learning activity assigned to ${data.student_ids.length} students successfully!`,
        });
        reset();
        setSelectedStudents([]);
        
        // Call the callback if provided (for manual refresh as backup)
        onTaskCreated?.();
      }
    } catch (error) {
      console.error('Error creating learning activities:', error);
      toast({
        title: "Error",
        description: "Failed to create learning activities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (studentsLoading || subjectsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Loading students and subject areas...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Activity Name</Label>
        <Input
          id="title"
          placeholder="e.g., Pink Tower exploration, Number rods work, Practical life - pouring"
          {...register('title', { 
            required: 'Activity name is required',
            minLength: { value: 3, message: 'Activity name must be at least 3 characters' }
          })}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Learning Objectives & Notes (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Describe the learning goals, materials needed, or specific observations to make..."
          rows={3}
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Students ({selectedStudents.length} selected)</Label>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={handleSelectNone}
              >
                Select None
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-3">
            {students.map((student) => (
              <div key={student.id} className="flex items-center space-x-2">
                <Checkbox
                  id={student.id}
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={(checked) => 
                    handleStudentToggle(student.id, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={student.id} 
                  className="text-sm cursor-pointer flex-1"
                >
                  {student.name} (Grade {student.grade})
                </Label>
              </div>
            ))}
          </div>
          
          {errors.student_ids && (
            <p className="text-sm text-red-600">Please select at least one student</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Subject Area</Label>
          <Select onValueChange={(value) => setValue('subject_id', value)} value={selectedSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject area" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subject_id && (
            <p className="text-sm text-red-600">Please select a subject area</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating...' : `Create Learning Activity for ${selectedStudents.length} Students`}
      </Button>
    </form>
  );
};
