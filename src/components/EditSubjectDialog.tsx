
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Subject } from '@/hooks/useSubjects';

interface SubjectFormData {
  name: string;
}

interface EditSubjectDialogProps {
  subject: Subject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSubjectDialog = ({ subject, open, onOpenChange }: EditSubjectDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubjectFormData>();

  useEffect(() => {
    if (subject) {
      reset({ name: subject.name });
    }
  }, [subject, reset]);

  const onSubmit = async (data: SubjectFormData) => {
    if (!subject) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ name: data.name })
        .eq('id', subject.id);

      if (error) {
        console.error('Error updating subject:', error);
        toast({
          title: "Error",
          description: "Failed to update subject. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Subject updated successfully!",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      toast({
        title: "Error",
        description: "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Update the subject name. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                placeholder="e.g., Mathematics, Science, History"
                {...register('name', { 
                  required: 'Subject name is required',
                  minLength: { value: 2, message: 'Subject name must be at least 2 characters' }
                })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
