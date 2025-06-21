import React, { useState } from 'react';
import { useSubjects } from '@/hooks/useSubjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EditSubjectDialog } from '@/components/EditSubjectDialog';
import { DeleteSubjectDialog } from '@/components/DeleteSubjectDialog';
import type { Subject } from '@/hooks/useSubjects';

export const SubjectsList = () => {
  const { subjects, loading, refetch } = useSubjects();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    console.log('=== MANUAL REFRESH TRIGGERED FOR SUBJECTS ===');
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error during manual refresh of subjects:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Existing Subjects
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh subjects</span>
            </Button>
          </div>
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
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-blue-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Existing Subjects ({subjects.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0 hover:bg-blue-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh subjects</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 bg-blue-500 shadow-sm"
                    />
                    <span className="font-semibold text-blue-900 text-sm">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSubject(subject)}
                      className="h-7 w-7 p-0 hover:bg-blue-100 text-blue-600"
                    >
                      <Edit className="h-3 w-3" />
                      <span className="sr-only">Edit subject</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingSubject(subject)}
                      className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="sr-only">Delete subject</span>
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                  {new Date(subject.created_at).toLocaleDateString()}
                </Badge>
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
