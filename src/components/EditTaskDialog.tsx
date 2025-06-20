import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubjects } from '@/hooks/useSubjects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Task } from '@/types/task';

interface TaskFormData {
  title: string;
  description: string;
  subject_id: string;
}

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTaskDialog = ({ task, open, onOpenChange }: EditTaskDialogProps) => {
  const { updateTask, isUpdating } = useTasks();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TaskFormData>();

  const selectedSubjectId = watch('subject_id');

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        subject_id: task.subject_id
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    if (!task) return;
    
    const updates = {
      title: data.title,
      description: data.description || null,
      subject_id: data.subject_id
    };

    // Use optimistic update method
    updateTask({ taskId: task.id, updates });
    
    // Close dialog immediately - optimistic update handles the UI
    onOpenChange(false);
  };

  if (subjectsLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Learning Activity</DialogTitle>
          <DialogDescription>
            Update the learning activity details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Activity Name</Label>
              <Input
                id="title"
                placeholder="e.g., Pink Tower exploration, Number rods work"
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
