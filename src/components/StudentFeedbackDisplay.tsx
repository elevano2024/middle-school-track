import React from 'react';
import { ThumbsUp, ThumbsDown, Minus, MessageSquare, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task, TeacherFeedbackType } from '@/types/task';

interface StudentFeedbackDisplayProps {
  task: Task;
  compact?: boolean;
}

export const StudentFeedbackDisplay = ({ task, compact = false }: StudentFeedbackDisplayProps) => {
  if (!task.teacher_feedback_type || !task.feedback_given_at) {
    return null;
  }

  const getFeedbackConfig = (type: TeacherFeedbackType) => {
    switch (type) {
      case 'thumbs_up':
        return {
          icon: ThumbsUp,
          label: 'Great Work!',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          badgeColor: 'bg-emerald-100 text-emerald-800'
        };
      case 'thumbs_down':
        return {
          icon: ThumbsDown,
          label: 'Keep Trying!',
          color: 'text-rose-600',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          badgeColor: 'bg-rose-100 text-rose-800'
        };
      case 'neutral':
        return {
          icon: Minus,
          label: 'Good Effort!',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          badgeColor: 'bg-amber-100 text-amber-800'
        };
    }
  };

  const config = getFeedbackConfig(task.teacher_feedback_type);
  const Icon = config.icon;

  // Compact version for task cards
  if (compact) {
    return (
      <div className={`rounded-lg p-2 border ${config.bgColor} ${config.borderColor} mb-2`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-xs font-semibold ${config.color}`}>
            Teacher Feedback
          </span>
        </div>
        {task.teacher_feedback_message && (
          <p className="text-xs text-gray-700 leading-relaxed">
            {task.teacher_feedback_message}
          </p>
        )}
      </div>
    );
  }

  // Full version for detailed view
  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <span className={`text-sm font-semibold ${config.color}`}>
              {config.label}
            </span>
          </div>
          <Badge className={`text-xs ${config.badgeColor}`}>
            Teacher Feedback
          </Badge>
        </div>

        {/* Feedback Message */}
        {task.teacher_feedback_message && (
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Message for you:</span>
            </div>
            <div className="bg-white/60 rounded-lg p-3 border border-white/50">
              <p className="text-sm text-gray-800 leading-relaxed">
                {task.teacher_feedback_message}
              </p>
            </div>
          </div>
        )}

        {/* Next Steps */}
        {task.teacher_next_steps && (
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-2">
              <ArrowRight className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">What to do next:</span>
            </div>
            <div className="bg-white/60 rounded-lg p-3 border border-white/50">
              <p className="text-sm text-gray-800 leading-relaxed">
                {task.teacher_next_steps}
              </p>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>
            Feedback given {new Date(task.feedback_given_at).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}; 