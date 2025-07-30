import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';
import { useAttendance } from '@/hooks/useAttendance';
import { useSubjects } from '@/hooks/useSubjects';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  Mail, 
  User, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye,
  TrendingUp,
  Award,
  Target,
  Send,
  Loader2
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email?: string;
  grade?: string;
}

interface StudentDetailsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  isOpen,
  onClose
}) => {
  const [emailAddress, setEmailAddress] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { tasks } = useTasks();
  const { attendance } = useAttendance();
  const { subjects } = useSubjects();

  // Calculate student analytics
  const studentAnalytics = useMemo(() => {
    if (!student) return null;

    const studentTasks = tasks.filter(task => task.student_id === student.id);
    const studentAttendance = attendance.filter(record => record.student_id === student.id);

    // Task status breakdown
    const tasksByStatus = {
      completed: studentTasks.filter(task => task.status === 'completed'),
      working: studentTasks.filter(task => task.status === 'working'),
      needHelp: studentTasks.filter(task => task.status === 'need-help'),
      readyReview: studentTasks.filter(task => task.status === 'ready-review')
    };

    // Subject breakdown
    const tasksBySubject = studentTasks.reduce((acc, task) => {
      const subjectName = task.subjects?.name || 'No Subject';
      if (!acc[subjectName]) {
        acc[subjectName] = {
          total: 0,
          completed: 0,
          working: 0,
          needHelp: 0,
          readyReview: 0
        };
      }
      acc[subjectName].total++;
      
      // Map task status to the correct property name
      switch (task.status) {
        case 'completed':
          acc[subjectName].completed++;
          break;
        case 'working':
          acc[subjectName].working++;
          break;
        case 'need-help':
          acc[subjectName].needHelp++;
          break;
        case 'ready-review':
          acc[subjectName].readyReview++;
          break;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Attendance calculations
    const totalAttendanceDays = studentAttendance.length;
    const presentDays = studentAttendance.filter(record => record.is_present).length;
    const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTasks = studentTasks.filter(task => 
      new Date(task.updated_at) >= sevenDaysAgo
    );

    // Performance metrics
    const completionRate = studentTasks.length > 0 ? 
      Math.round((tasksByStatus.completed.length / studentTasks.length) * 100) : 0;

    return {
      totalTasks: studentTasks.length,
      tasksByStatus,
      tasksBySubject,
      attendanceRate,
      totalAttendanceDays,
      presentDays,
      recentTasks: recentTasks.length,
      completionRate,
      averageGrade: 'A-', // Placeholder - you can calculate from actual grades
      subjectCount: Object.keys(tasksBySubject).length
    };
  }, [student, tasks, attendance]);

  const handleExport = async () => {
    if (!student || !studentAnalytics) return;

    setIsExporting(true);
    try {
      // Create a printable HTML content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Student Progress Report - ${student.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .metric-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
            .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .metric-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; }
            .progress-bar { width: 100%; height: 20px; background-color: #e5e7eb; border-radius: 10px; overflow: hidden; }
            .progress-fill { height: 100%; background-color: #10b981; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            th { background-color: #f9fafb; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Progress Report</h1>
            <h2>${student.name}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="metrics">
            <div class="metric-card">
              <div class="metric-value">${studentAnalytics.totalTasks}</div>
              <div class="metric-label">Total Tasks</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${studentAnalytics.completionRate}%</div>
              <div class="metric-label">Completion Rate</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${studentAnalytics.attendanceRate}%</div>
              <div class="metric-label">Attendance Rate</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${studentAnalytics.subjectCount}</div>
              <div class="metric-label">Active Subjects</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Task Progress by Status</div>
            <table>
              <tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
              <tr><td>Completed</td><td>${studentAnalytics.tasksByStatus.completed.length}</td><td>${Math.round((studentAnalytics.tasksByStatus.completed.length / studentAnalytics.totalTasks) * 100) || 0}%</td></tr>
              <tr><td>Working</td><td>${studentAnalytics.tasksByStatus.working.length}</td><td>${Math.round((studentAnalytics.tasksByStatus.working.length / studentAnalytics.totalTasks) * 100) || 0}%</td></tr>
              <tr><td>Need Help</td><td>${studentAnalytics.tasksByStatus.needHelp.length}</td><td>${Math.round((studentAnalytics.tasksByStatus.needHelp.length / studentAnalytics.totalTasks) * 100) || 0}%</td></tr>
              <tr><td>Ready for Review</td><td>${studentAnalytics.tasksByStatus.readyReview.length}</td><td>${Math.round((studentAnalytics.tasksByStatus.readyReview.length / studentAnalytics.totalTasks) * 100) || 0}%</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Performance by Subject</div>
            <table>
              <tr><th>Subject</th><th>Total Tasks</th><th>Completed</th><th>Completion Rate</th></tr>
              ${Object.entries(studentAnalytics.tasksBySubject).map(([subject, data]: [string, any]) => 
                `<tr><td>${subject}</td><td>${data.total}</td><td>${data.completed}</td><td>${Math.round((data.completed / data.total) * 100) || 0}%</td></tr>`
              ).join('')}
            </table>
          </div>

          <div class="footer">
            <p>This report was generated automatically by the Student Progress Tracking System</p>
            <p>For questions or concerns, please contact your teacher or school administrator</p>
          </div>
        </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }

      toast({
        title: "Export Successful",
        description: "Student report has been prepared for printing/saving as PDF"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailShare = async () => {
    if (!emailAddress || !student || !studentAnalytics) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to share the report.",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to send reports.",
          variant: "destructive"
        });
        return;
      }

      // Prepare data for the email service
      const emailData = {
        recipientEmail: emailAddress.trim(),
        studentData: {
          name: student.name,
          email: student.email,
          grade: student.grade,
          id: student.id
        },
        analytics: studentAnalytics,
        senderName: session.user.user_metadata?.full_name || session.user.email
      };

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('send-student-report', {
        body: emailData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Email service error:', error);
        
        // Fallback to mailto if service is not available
        if (error.message?.includes('Email service not configured') || error.message?.includes('RESEND_API_KEY')) {
          toast({
            title: "Email Service Unavailable",
            description: "Falling back to your email client...",
            variant: "destructive"
          });
          
          // Create simplified email content for mailto fallback
          const emailSubject = `Student Progress Report - ${student.name}`;
          const emailBody = `
Dear Parent/Guardian,

Please find below the progress report for ${student.name}:

📊 SUMMARY METRICS:
• Total Tasks: ${studentAnalytics.totalTasks}
• Completion Rate: ${studentAnalytics.completionRate}%
• Attendance Rate: ${studentAnalytics.attendanceRate}%
• Active Subjects: ${studentAnalytics.subjectCount}

📋 TASK BREAKDOWN:
• Completed: ${studentAnalytics.tasksByStatus.completed.length}
• Currently Working: ${studentAnalytics.tasksByStatus.working.length}
• Need Help: ${studentAnalytics.tasksByStatus.needHelp.length}
• Ready for Review: ${studentAnalytics.tasksByStatus.readyReview.length}

📚 SUBJECT PERFORMANCE:
${Object.entries(studentAnalytics.tasksBySubject).map(([subject, data]: [string, any]) => 
  `• ${subject}: ${data.completed}/${data.total} completed (${Math.round((data.completed / data.total) * 100) || 0}%)`
).join('\n')}

📅 ATTENDANCE:
• Present: ${studentAnalytics.presentDays} out of ${studentAnalytics.totalAttendanceDays} days
• Rate: ${studentAnalytics.attendanceRate}%

This report was generated on ${new Date().toLocaleDateString()} by the Student Progress Tracking System.

If you have any questions about your child's progress, please don't hesitate to contact us.

Best regards,
The Teaching Team
          `;

          const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
          window.open(mailtoLink);
          
          toast({
            title: "Email Client Opened",
            description: `Your email client should open with the report for ${emailAddress}`,
          });
        } else {
          toast({
            title: "Failed to Send Email",
            description: error.message || "There was an error sending the email. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      // Success!
      toast({
        title: "Email Sent Successfully! 📧",
        description: `Beautiful progress report sent to ${emailAddress}`,
      });

      setEmailAddress('');
    } catch (error) {
      console.error('Email share error:', error);
      toast({
        title: "Failed to Send Email",
        description: "There was an error sending the email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (!student || !studentAnalytics) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <User className="h-6 w-6 text-blue-600" />
            {student.name} - Detailed Progress Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{studentAnalytics.totalTasks}</div>
                <div className="text-sm text-blue-600">Total Tasks</div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700">{studentAnalytics.completionRate}%</div>
                <div className="text-sm text-emerald-600">Completion Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">{studentAnalytics.attendanceRate}%</div>
                <div className="text-sm text-purple-600">Attendance Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{studentAnalytics.subjectCount}</div>
                <div className="text-sm text-amber-600">Active Subjects</div>
              </CardContent>
            </Card>
          </div>

          {/* Task Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Task Progress Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-lg font-bold text-emerald-700">{studentAnalytics.tasksByStatus.completed.length}</div>
                  <div className="text-sm text-emerald-600">Completed</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-700">{studentAnalytics.tasksByStatus.working.length}</div>
                  <div className="text-sm text-blue-600">Working</div>
                </div>
                <div className="text-center p-3 bg-rose-50 rounded-lg">
                  <div className="text-lg font-bold text-rose-700">{studentAnalytics.tasksByStatus.needHelp.length}</div>
                  <div className="text-sm text-rose-600">Need Help</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-lg font-bold text-amber-700">{studentAnalytics.tasksByStatus.readyReview.length}</div>
                  <div className="text-sm text-amber-600">Ready Review</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Progress</span>
                  <span>{studentAnalytics.completionRate}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${studentAnalytics.completionRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Performance by Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(studentAnalytics.tasksBySubject).map(([subject, data]: [string, any]) => {
                  const completionRate = Math.round((data.completed / data.total) * 100) || 0;
                  return (
                    <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{subject}</div>
                        <div className="text-sm text-gray-600">
                          {data.completed}/{data.total} tasks completed
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 min-w-10">
                          {completionRate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <div className="text-lg font-bold text-emerald-700">{studentAnalytics.presentDays}</div>
                  <div className="text-sm text-emerald-600">Days Present</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg">
                  <div className="text-lg font-bold text-rose-700">{studentAnalytics.totalAttendanceDays - studentAnalytics.presentDays}</div>
                  <div className="text-sm text-rose-600">Days Absent</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-700">{studentAnalytics.attendanceRate}%</div>
                  <div className="text-sm text-purple-600">Attendance Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export and Share Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Share & Export Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export Button */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Generating...' : 'Export as PDF'}
                </Button>
              </div>

              {/* Email Share */}
              <div className="space-y-2">
                <Label htmlFor="email">Share via Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="parent@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="flex-1"
                    disabled={isSharing}
                  />
                  <Button 
                    onClick={handleEmailShare}
                    disabled={isSharing || !emailAddress}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isSharing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Report
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  ✨ Sends a beautifully formatted HTML email with complete progress analytics
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailsModal; 