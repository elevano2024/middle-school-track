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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen } from 'lucide-react';

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
        
        // Properly reset all form fields including subject selection
        reset({
          title: '',
          description: '',
          subject_id: '',
          student_ids: []
        });
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
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading students and subject areas...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Activity Details Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="title" className="text-base font-medium">Activity Name</Label>
          <Input
            id="title"
            placeholder="e.g., Pink Tower exploration, Number rods work, Practical life - pouring"
            className="text-base py-3"
            {...register('title', { 
              required: 'Activity name is required',
              minLength: { value: 3, message: 'Activity name must be at least 3 characters' }
            })}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="description" className="text-base font-medium">Learning Objectives & Notes</Label>
          <p className="text-sm text-gray-600">Optional: Describe the learning goals, materials needed, or specific observations to make</p>
          <Textarea
            id="description"
            placeholder="Enter learning objectives and notes here..."
            rows={4}
            className="text-base"
            {...register('description')}
          />
        </div>
      </div>

      {/* Assignment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Students Selection */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
              <Users className="h-5 w-5 text-blue-600" />
              Select Students
              <span className="text-sm font-normal text-blue-600">
                ({selectedStudents.length} selected)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
                className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Select All
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleSelectNone}
                className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Clear All
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              {students.map((student) => (
                <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-white/60 rounded-md transition-colors">
                  <Checkbox
                    id={student.id}
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={(checked) => 
                      handleStudentToggle(student.id, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={student.id} 
                    className="cursor-pointer flex-1 text-sm"
                  >
                    <div className="font-medium text-blue-900">{student.name}</div>
                    <div className="text-xs text-blue-600">Grade {student.grade}</div>
                  </Label>
                </div>
              ))}
            </div>
            
            {errors.student_ids && (
              <p className="text-sm text-red-600">Please select at least one student</p>
            )}
          </CardContent>
        </Card>

        {/* Subject Selection */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Subject Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Select onValueChange={(value) => setValue('subject_id', value)} value={selectedSubjectId}>
                <SelectTrigger className="h-12 text-base border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Choose a subject area" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id} className="text-base py-3">
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject_id && (
                <p className="text-sm text-red-600">Please select a subject area</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting || selectedStudents.length === 0} 
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {isSubmitting ? 'Creating Activity...' : `Create Learning Activity for ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </form>
  );
};
