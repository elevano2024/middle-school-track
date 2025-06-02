
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SubjectFormData {
  name: string;
  color: string;
}

const predefinedColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1'
];

export const AddSubjectForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SubjectFormData>({
    defaultValues: {
      color: predefinedColors[0]
    }
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: SubjectFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('subjects')
        .insert([{
          name: data.name,
          color: data.color
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

      <div className="space-y-2">
        <Label>Subject Color</Label>
        <div className="grid grid-cols-5 gap-2">
          {predefinedColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                selectedColor === color 
                  ? 'border-gray-900 scale-110' 
                  : 'border-gray-300 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Subject'}
      </Button>
    </form>
  );
};
