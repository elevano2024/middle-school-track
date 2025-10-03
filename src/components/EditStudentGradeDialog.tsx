import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, GraduationCap } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: string;
}

interface EditStudentGradeDialogProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const GRADE_LEVELS = ['7', '8', '9', '10', '11', '12'] as const;

const EditStudentGradeDialog: React.FC<EditStudentGradeDialogProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (student) {
      setSelectedGrade(student.grade);
    }
  }, [student]);

  const handleUpdateGrade = async () => {
    if (!student || !selectedGrade) {
      toast({
        title: "Error",
        description: "Please select a grade level.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ 
          grade: selectedGrade as '7' | '8' | '9' | '10' | '11' | '12',
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (error) {
        console.error('Error updating student grade:', error);
        toast({
          title: "Failed to Update Grade",
          description: error.message || "There was an error updating the grade. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Grade Updated Successfully! 🎓",
        description: `${student.name}'s grade has been updated to Grade ${selectedGrade}.`
      });

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating grade:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Edit Student Grade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="font-medium text-gray-900">{student.name}</div>
            <div className="text-sm text-gray-600">Current Grade: Grade {student.grade}</div>
          </div>

          {/* Grade Selection */}
          <div className="space-y-2">
            <Label htmlFor="grade-select">Select New Grade Level</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger id="grade-select" className="w-full">
                <SelectValue placeholder="Choose a grade level" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info Note */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <strong>Note:</strong> Updating the grade level will change how this student appears in grade-based reports and filters.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpdateGrade}
            disabled={isUpdating || !selectedGrade || selectedGrade === student.grade}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Grade'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentGradeDialog;

