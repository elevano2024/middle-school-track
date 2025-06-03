
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Subject } from '@/hooks/useSubjects';

interface DeleteSubjectDialogProps {
  subject: Subject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteSubjectDialog = ({ subject, open, onOpenChange }: DeleteSubjectDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!subject) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subject.id);

      if (error) {
        console.error('Error deleting subject:', error);
        toast({
          title: "Error",
          description: "Failed to delete subject. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Subject deleted successfully!",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: "Failed to delete subject. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the subject "{subject?.name}" 
            and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
