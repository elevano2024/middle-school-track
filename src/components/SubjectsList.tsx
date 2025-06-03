
import React, { useState } from 'react';
import { useSubjects } from '@/hooks/useSubjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EditSubjectDialog } from '@/components/EditSubjectDialog';
import { DeleteSubjectDialog } from '@/components/DeleteSubjectDialog';
import type { Subject } from '@/hooks/useSubjects';

export const SubjectsList = () => {
  const { subjects, loading } = useSubjects();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Existing Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2">Loading subjects...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Existing Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              No subjects found. Create your first subject using the form above.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Existing Subjects ({subjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: '#3B82F6' }}
                  />
                  <span className="font-medium text-gray-900 truncate">{subject.name}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {new Date(subject.created_at).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSubject(subject)}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Edit subject</span>
                    📝
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingSubject(subject)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <span className="sr-only">Delete subject</span>
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EditSubjectDialog
        subject={editingSubject}
        open={!!editingSubject}
        onOpenChange={(open) => !open && setEditingSubject(null)}
      />

      <DeleteSubjectDialog
        subject={deletingSubject}
        open={!!deletingSubject}
        onOpenChange={(open) => !open && setDeletingSubject(null)}
      />
    </>
  );
};
