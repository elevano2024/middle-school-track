import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Minus, MessageSquare, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task, TeacherFeedbackType } from '@/types/task';

interface FeedbackFormData {
  teacher_feedback_type: TeacherFeedbackType;
  teacher_feedback_message: string;
  teacher_next_steps: string;
}

interface TeacherFeedbackDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TeacherFeedbackDialog = ({ task, open, onOpenChange }: TeacherFeedbackDialogProps) => {
  const { updateTask, isUpdating } = useTasks();
  const { user } = useAuth();
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<TeacherFeedbackType>('thumbs_up');
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FeedbackFormData>({
    defaultValues: {
      teacher_feedback_type: 'thumbs_up',
      teacher_feedback_message: '',
      teacher_next_steps: ''
    }
  });

  // Load existing feedback when dialog opens
  useEffect(() => {
    if (task && open) {
      setSelectedFeedbackType(task.teacher_feedback_type || 'thumbs_up');
      setValue('teacher_feedback_type', task.teacher_feedback_type || 'thumbs_up');
      setValue('teacher_feedback_message', task.teacher_feedback_message || '');
      setValue('teacher_next_steps', task.teacher_next_steps || '');
    }
  }, [task, open, setValue]);

  const onSubmit = async (data: FeedbackFormData) => {
    if (!task) return;

    const feedbackData = {
      ...data,
      teacher_feedback_type: selectedFeedbackType,
      feedback_given_at: new Date().toISOString(),
      feedback_given_by: user.id
    };

    updateTask({ 
      taskId: task.id, 
      updates: feedbackData
    });

    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const getFeedbackTypeConfig = (type: TeacherFeedbackType) => {
    switch (type) {
      case 'thumbs_up':
        return {
          icon: ThumbsUp,
          label: 'Great Work!',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          description: 'Student did excellent work'
        };
      case 'thumbs_down':
        return {
          icon: ThumbsDown,
          label: 'Needs Improvement',
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          description: 'Student needs to revise their work'
        };
      case 'neutral':
        return {
          icon: Minus,
          label: 'Good Effort',
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          description: 'Student made good progress'
        };
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Provide Feedback
          </DialogTitle>
          <DialogDescription>
            Give feedback to help <strong>{task.students?.name}</strong> improve their learning
          </DialogDescription>
        </DialogHeader>

        {/* Task Summary */}
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-blue-900">{task.title}</h4>
              <Badge variant="outline" className="text-xs">
                {task.subjects?.name}
              </Badge>
            </div>
            {task.description && (
              <p className="text-sm text-blue-700 mb-2">{task.description}</p>
            )}
            <div className="text-xs text-blue-600">
              Completed: {new Date(task.updated_at).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Feedback Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Overall Assessment</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['thumbs_up', 'neutral', 'thumbs_down'] as TeacherFeedbackType[]).map((type) => {
                const config = getFeedbackTypeConfig(type);
                const Icon = config.icon;
                const isSelected = selectedFeedbackType === type;
                
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedFeedbackType(type);
                      setValue('teacher_feedback_type', type);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                      isSelected 
                        ? `${config.color} border-current shadow-md scale-105` 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-current' : 'text-gray-400'}`} />
                    <div className={`text-sm font-medium ${isSelected ? 'text-current' : 'text-gray-600'}`}>
                      {config.label}
                    </div>
                    <div className={`text-xs mt-1 ${isSelected ? 'text-current opacity-80' : 'text-gray-500'}`}>
                      {config.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Encouraging Message */}
          <div className="space-y-2">
            <Label htmlFor="feedback_message" className="text-sm font-semibold text-gray-700">
              Encouraging Message
            </Label>
            <Textarea
              id="feedback_message"
              {...register('teacher_feedback_message')}
              placeholder="Write an encouraging message for the student..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {watch('teacher_feedback_message')?.length || 0}/500 characters
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <Label htmlFor="next_steps" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <ArrowRight className="w-4 h-4" />
              Next Steps (Optional)
            </Label>
            <Textarea
              id="next_steps"
              {...register('teacher_next_steps')}
              placeholder="Suggest what the student should work on next..."
              className="min-h-[80px] resize-none"
              maxLength={300}
            />
            <div className="text-xs text-gray-500 text-right">
              {watch('teacher_next_steps')?.length || 0}/300 characters
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? 'Saving...' : 'Save Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 