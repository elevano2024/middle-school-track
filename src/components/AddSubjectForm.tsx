
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SubjectFormData {
  name: string;
}

interface AddSubjectFormProps {
  onSubjectCreated?: () => void;
}

export const AddSubjectForm = ({ onSubjectCreated }: AddSubjectFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubjectFormData>();

  const onSubmit = async (data: SubjectFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('subjects')
        .insert([{
          name: data.name
        }]);

      if (error) {
        console.error('Error creating subject:', error);
        toast({
          title: "Error",
          description: "Failed to create subject. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Subject created successfully!",
        });
        reset();
        onSubjectCreated?.();
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({
        title: "Error",
        description: "Failed to create subject. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Subject Name</Label>
        <Input
          id="name"
          placeholder="e.g., Mathematics, Science, History, Practical Life, Sensorial"
          {...register('name', { 
            required: 'Subject name is required',
            minLength: { value: 2, message: 'Subject name must be at least 2 characters' }
          })}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Subject'}
      </Button>
    </form>
  );
};
