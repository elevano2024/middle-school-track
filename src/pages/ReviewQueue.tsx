import React, { useMemo, useState } from 'react';
import { CheckCircle, Clock, MessageSquare, RotateCcw, UserRound } from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { TeacherFeedbackDialog } from '@/components/TeacherFeedbackDialog';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task } from '@/types/task';

const getAgeInDays = (dateValue: string) => {
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
};

const formatSubmittedAge = (dateValue: string) => {
  const days = getAgeInDays(dateValue);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

const ReviewQueue = () => {
  const { tasks, loading, updateTask, isUpdating } = useTasks();
  const [feedbackTask, setFeedbackTask] = useState<Task | null>(null);

  const readyReviewTasks = useMemo(() => {
    return tasks
      .filter((task) => task.status === 'ready-review')
      .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
  }, [tasks]);

  const groupedBySubject = useMemo(() => {
    return readyReviewTasks.reduce<Record<string, Task[]>>((groups, task) => {
      const subjectName = task.subjects?.name || 'No Subject';
      if (!groups[subjectName]) groups[subjectName] = [];
      groups[subjectName].push(task);
      return groups;
    }, {});
  }, [readyReviewTasks]);

  const oldestDays = readyReviewTasks.length > 0
    ? Math.max(...readyReviewTasks.map((task) => getAgeInDays(task.updated_at)))
    : 0;

  const handleMarkComplete = (task: Task) => {
    updateTask({
      taskId: task.id,
      updates: { status: 'completed' }
    });
  };

  const handleSendBackToWorking = (task: Task) => {
    updateTask({
      taskId: task.id,
      updates: { status: 'working' }
    });
  };

  return (
    <PermissionGuard
      requiredRoles={['admin', 'teacher']}
      fallbackMessage="You don't have permission to review learning activities."
    >
      <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 min-h-full">
        <Card className="overflow-hidden border-blue-100 bg-white/90 shadow-lg">
          <CardContent className="p-0">
            <div className="flex flex-col gap-5 border-b border-blue-100 bg-gradient-to-r from-white via-blue-50 to-indigo-50 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-blue-600/10 p-3">
                  <CheckCircle className="h-7 w-7 text-blue-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">Review Queue</h1>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    Clear submitted learning activities, send work back when revisions are needed, or complete work with feedback in one focused flow.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center shadow-sm">
                  <div className="text-3xl font-bold text-amber-800">{readyReviewTasks.length}</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Ready Review</div>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center shadow-sm">
                  <div className="text-3xl font-bold text-blue-800">{oldestDays}</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Oldest Days</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Activities Awaiting Teacher Review
                  </h2>
                  <p className="text-sm text-slate-500">
                    Use "Complete + Feedback" to approve work and give the student feedback in one save.
                  </p>
                </div>
              </div>

            {loading ? (
              <div className="py-12 text-center text-blue-600">Loading review queue...</div>
            ) : readyReviewTasks.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                <h3 className="font-semibold text-gray-900">Review queue is clear</h3>
                <p className="text-sm text-gray-600">No activities are waiting for teacher review.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedBySubject).map(([subjectName, subjectTasks]) => (
                  <section key={subjectName} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">{subjectName}</h3>
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        {subjectTasks.length} to review
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {subjectTasks.map((task) => (
                        <article
                          key={task.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                        >
                          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_auto] xl:items-center">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-slate-950">{task.title}</h4>
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                  {formatSubmittedAge(task.updated_at)}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="mt-1 line-clamp-2 text-sm text-slate-500" title={task.description}>
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                              <div className="rounded-full bg-white p-2 shadow-sm">
                                <UserRound className="h-4 w-4 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-slate-900">
                                  {task.students?.name || 'Unknown Student'}
                                </div>
                                {task.students?.email && (
                                  <div className="truncate text-xs text-slate-500">{task.students.email}</div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSendBackToWorking(task)}
                                disabled={isUpdating}
                                className="border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950 disabled:text-slate-700"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Send Back
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkComplete(task)}
                                disabled={isUpdating}
                                className="border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-100 hover:text-emerald-900 disabled:text-emerald-700"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Mark Complete
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setFeedbackTask(task)}
                                disabled={isUpdating}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 hover:text-white disabled:text-white"
                              >
                                <MessageSquare className="h-3 w-3" />
                                Complete + Feedback
                              </Button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        {feedbackTask && (
          <TeacherFeedbackDialog
            task={feedbackTask}
            open={!!feedbackTask}
            completeOnSave
            onOpenChange={(open) => !open && setFeedbackTask(null)}
          />
        )}
      </div>
    </PermissionGuard>
  );
};

export default ReviewQueue;
