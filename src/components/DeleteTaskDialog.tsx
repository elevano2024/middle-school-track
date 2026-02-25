import React, { useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useStudents } from '@/hooks/useStudents';
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
import type { Task } from '@/types/task';

interface DeleteTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteTaskDialog = ({ task, open, onOpenChange }: DeleteTaskDialogProps) => {
  const { deleteTask, isDeleting, tasks } = useTasks();
  const { students } = useStudents();

  // Resolve the subject_id defensively. If the incoming task has an empty
  // subject_id (e.g. from TaskCard's WorkflowTask → ApiTask conversion when
  // data hasn't fully loaded), fall back to looking it up by ID in the cache.
  const resolvedSubjectId = useMemo(() => {
    if (!task) return '';
    if (task.subject_id) return task.subject_id;
    // Fallback: find the canonical row by ID
    const canonical = tasks.find((t) => t.id === task.id);
    return canonical?.subject_id ?? '';
  }, [task, tasks]);

  // Find every task row that shares the same title + subject.
  // These are the sibling assignments that were bulk-created together.
  const affectedTasks = useMemo(() => {
    if (!task || !resolvedSubjectId) return [];
    return tasks.filter(
      (t) => t.title === task.title && t.subject_id === resolvedSubjectId
    );
  }, [task, tasks, resolvedSubjectId]);

  // Resolve student names for the preview list
  const affectedStudentNames = useMemo(() => {
    return affectedTasks
      .map((t) => {
        // Prefer the joined student name, fall back to the students list
        if (t.students?.name) return t.students.name;
        const student = students.find((s) => s.id === t.student_id);
        return student?.name ?? 'Unknown Student';
      })
      .sort((a, b) => a.localeCompare(b));
  }, [affectedTasks, students]);

  const handleDelete = async () => {
    if (!task || !resolvedSubjectId) return;

    console.log('=== DELETING TASK GROUP ===');
    console.log('Title:', task.title);
    console.log('Subject ID:', resolvedSubjectId);
    console.log('Affected task count:', affectedTasks.length);

    // Pass title + subject_id so the mutation deletes all matching rows
    deleteTask({ title: task.title, subject_id: resolvedSubjectId });

    // Close dialog immediately — optimistic update handles the UI
    onOpenChange(false);
  };

  const count = affectedTasks.length;
  const taskLabel = count === 1 ? 'task' : 'tasks';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Learning Activity</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This will permanently delete{' '}
                <span className="font-semibold text-foreground">"{task?.title}"</span> from{' '}
                <span className="font-semibold text-foreground">{count}</span>{' '}
                {count === 1 ? 'student' : 'students'}:
              </p>

              {affectedStudentNames.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-md border bg-muted/40 p-3">
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {affectedStudentNames.map((name, idx) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="font-semibold text-red-600">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || count === 0}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting
              ? 'Deleting…'
              : count === 0
                ? 'No tasks found'
                : `Delete ${count} ${taskLabel}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
