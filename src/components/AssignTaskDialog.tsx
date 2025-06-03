
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Task } from '@/hooks/useTasks';

interface Student {
  id: string;
  name: string;
  email?: string;
  grade: string;
}

interface AssignFormData {
  student_id: string;
}

interface AssignTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssignTaskDialog = ({ task, open, onOpenChange }: AssignTaskDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const { toast } = useToast();
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<AssignFormData>();

  const selectedStudentId = watch('student_id');

  // Fetch students directly without using the hook to avoid subscription conflicts
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
    }
  }, [open]);

  const onSubmit = async (data: AssignFormData) => {
    if (!task || !data.student_id) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ student_id: data.student_id })
        .eq('id', task.id);

      if (error) {
        console.error('Error assigning task:', error);
        toast({
          title: "Error",
          description: "Failed to assign learning activity. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Learning activity assigned successfully!",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error assigning task:', error);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Learning Activity</DialogTitle>
          <DialogDescription>
            Assign "{task?.title}" to a student. The activity will appear in their dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select onValueChange={(value) => setValue('student_id', value)} value={selectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedStudentId}>
              {isSubmitting ? 'Assigning...' : 'Assign Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
