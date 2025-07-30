
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Task } from '@/types/task';

interface Student {
  id: string;
  name: string;
  email?: string;
  grade: string;
}

interface BulkAssignFormData {
  student_ids: string[];
}

interface BulkAssignTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BulkAssignTaskDialog = ({ task, open, onOpenChange }: BulkAssignTaskDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const { toast } = useToast();
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<BulkAssignFormData>();

  const selectedStudentIds = watch('student_ids') || [];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching students:', error);
          setStudents([]);
        } else {
          setStudents(data || []);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    if (open) {
      fetchStudents();
      setSelectedStudents([]);
      setValue('student_ids', []);
    }
  }, [open, setValue]);

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

  const onSubmit = async (data: BulkAssignFormData) => {
    if (!task || !data.student_ids || data.student_ids.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create individual task assignments for each selected student
      const taskPromises = data.student_ids.map(studentId => 
        supabase
          .from('tasks')
          .insert({
            title: task.title,
            description: task.description,
            subject_id: task.subject_id,
            student_id: studentId,
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
        toast({
          title: "Success",
          description: `Learning activity assigned to ${data.student_ids.length} students successfully!`,
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error bulk assigning task:', error);
      toast({
        title: "Error",
        description: "Failed to assign learning activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (studentsLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign to Multiple Students</DialogTitle>
          <DialogDescription>
            Assign "{task?.title}" to multiple students. Select the students you want to assign this activity to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
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
                      {student.email && (
                        <div className="text-xs text-gray-500">{student.email}</div>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              
              {errors.student_ids && (
                <p className="text-sm text-red-600">Please select at least one student</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedStudents.length === 0}
            >
              {isSubmitting ? 'Assigning...' : `Assign to ${selectedStudents.length} Students`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
