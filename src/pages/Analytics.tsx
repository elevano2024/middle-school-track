import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { useStudents } from '@/hooks/useStudents';
import type { Student } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { useAttendance } from '@/hooks/useAttendance';
import { useAttendanceHistory } from '@/hooks/useAttendanceHistory';
import { useUserRole } from '@/hooks/useUserRole';
import StudentDetailsModal from '@/components/StudentDetailsModal';
import HelpTooltip from '@/components/HelpTooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  BookOpen, 
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Award,
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Star,
  TrendingDown,
  Activity,
  UserCheck,
  FileText,
  Zap,
  Download
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const Analytics = () => {
  const { isAdmin } = useUserRole();
  const { tasks } = useTasks();
  const { students } = useStudents();
  const { subjects } = useSubjects();
  const { attendance } = useAttendance();
  const { attendanceHistory } = useAttendanceHistory(isAdmin);

  // Modal state for student details
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    email?: string;
    grade?: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attendanceStartDate, setAttendanceStartDate] = useState('');
  const [attendanceEndDate, setAttendanceEndDate] = useState('');

  // Handle student row click
  const handleStudentClick = (student: Student) => {
    setSelectedStudent({
      id: student.id,
      name: student.name,
      email: student.email,
      grade: student.grade
    });
    setIsModalOpen(true);
  };

  // Calculate analytics data
  const analytics = useMemo(() => {
    // Helper function to check if a date is a school day (Monday-Friday)
    const isSchoolDay = (date: Date) => {
      const dayOfWeek = date.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday is 1, Friday is 5
    };

    // Get current school day for attendance calculations
    const getCurrentSchoolDay = () => {
      const today = new Date();
      if (isSchoolDay(today)) {
        return today.toISOString().split('T')[0];
      } else {
        // Find the most recent school day
        const lastSchoolDay = new Date(today);
        while (!isSchoolDay(lastSchoolDay)) {
          lastSchoolDay.setDate(lastSchoolDay.getDate() - 1);
        }
        return lastSchoolDay.toISOString().split('T')[0];
      }
    };

    const averageHoursBetween = (records: Array<{ created_at?: string; updated_at?: string; feedback_given_at?: string | null }>, endField: 'updated_at' | 'feedback_given_at') => {
      const durations = records
        .map((record) => {
          const start = record.created_at ? new Date(record.created_at).getTime() : NaN;
          const endValue = record[endField];
          const end = endValue ? new Date(endValue).getTime() : NaN;
          if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
          return (end - start) / (1000 * 60 * 60);
        })
        .filter((duration): duration is number => duration !== null);

      if (durations.length === 0) return null;
      return Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
    };

    const formatHours = (hours: number | null) => {
      if (hours === null) return 'No data yet';
      if (hours < 24) return `${hours}h`;
      const days = Math.round((hours / 24) * 10) / 10;
      return `${days}d`;
    };

    // Enhanced student performance metrics with feedback analysis
    const studentMetrics = students.map(student => {
      const studentTasks = tasks.filter(task => task.student_id === student.id);
      const todoTasks = studentTasks.filter(task => task.status === 'todo');
      const workingTasks = studentTasks.filter(task => task.status === 'working');
      const needHelpTasks = studentTasks.filter(task => task.status === 'need-help');
      const readyReviewTasks = studentTasks.filter(task => task.status === 'ready-review');
      const completedTasks = studentTasks.filter(task => task.status === 'completed');
      
      // Feedback analysis
      const tasksWithFeedback = studentTasks.filter(task => task.teacher_feedback_type);
      const positiveFeedback = studentTasks.filter(task => task.teacher_feedback_type === 'thumbs_up');
      const negativeFeedback = studentTasks.filter(task => task.teacher_feedback_type === 'thumbs_down');
      const neutralFeedback = studentTasks.filter(task => task.teacher_feedback_type === 'neutral');
      
      // Performance indicators
      const completionRate = studentTasks.length > 0 
        ? Math.round((completedTasks.length / studentTasks.length) * 100) 
        : 0;
      
      const feedbackRate = completedTasks.length > 0
        ? Math.round((tasksWithFeedback.length / completedTasks.length) * 100)
        : 0;
      
      const positivityScore = tasksWithFeedback.length > 0
        ? Math.round((positiveFeedback.length / tasksWithFeedback.length) * 100)
        : 0;

      const avgCompletionTime = averageHoursBetween(completedTasks, 'updated_at');

      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        totalTasks: studentTasks.length,
        todo: todoTasks.length,
        working: workingTasks.length,
        needHelp: needHelpTasks.length,
        readyReview: readyReviewTasks.length,
        completed: completedTasks.length,
        completionRate,
        feedbackRate,
        positivityScore,
        avgCompletionTime: formatHours(avgCompletionTime),
        positiveFeedback: positiveFeedback.length,
        negativeFeedback: negativeFeedback.length,
        neutralFeedback: neutralFeedback.length,
        tasksWithFeedback: tasksWithFeedback.length
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    const feedbackTasks = tasks.filter(task => task.teacher_feedback_type);
    const completedTasksForFeedback = tasks.filter(task => task.status === 'completed');

    // Teacher feedback analytics
    const feedbackAnalytics = {
      totalFeedbackGiven: feedbackTasks.length,
      completedTasksWithFeedback: tasks.filter(task => 
        task.status === 'completed' && task.teacher_feedback_type
      ).length,
      completedTasksTotal: completedTasksForFeedback.length,
      positiveFeedback: tasks.filter(task => task.teacher_feedback_type === 'thumbs_up').length,
      negativeFeedback: tasks.filter(task => task.teacher_feedback_type === 'thumbs_down').length,
      neutralFeedback: tasks.filter(task => task.teacher_feedback_type === 'neutral').length,
      averageResponseTime: formatHours(averageHoursBetween(feedbackTasks, 'feedback_given_at')),
      feedbackCompletionRate: completedTasksForFeedback.length > 0 ?
        Math.round((tasks.filter(task => task.status === 'completed' && task.teacher_feedback_type).length / 
                   completedTasksForFeedback.length) * 100) : 0
    };

    // Subject performance analysis
    const subjectAnalytics = subjects.map(subject => {
      const subjectTasks = tasks.filter(task => task.subject_id === subject.id);
      const completedSubjectTasks = subjectTasks.filter(task => task.status === 'completed');
      const needHelpSubjectTasks = subjectTasks.filter(task => task.status === 'need-help');
      const positiveFeedbackTasks = subjectTasks.filter(task => task.teacher_feedback_type === 'thumbs_up');
      
      return {
        name: subject.name,
        totalTasks: subjectTasks.length,
        completedTasks: completedSubjectTasks.length,
        completionRate: subjectTasks.length > 0 ? 
          Math.round((completedSubjectTasks.length / subjectTasks.length) * 100) : 0,
        struggleRate: subjectTasks.length > 0 ?
          Math.round((needHelpSubjectTasks.length / subjectTasks.length) * 100) : 0,
        satisfactionRate: completedSubjectTasks.length > 0 ?
          Math.round((positiveFeedbackTasks.length / completedSubjectTasks.length) * 100) : 0
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    // Attendance analytics - only for current school day
    const currentSchoolDay = getCurrentSchoolDay();
    const todayAttendance = attendance.filter(record => record.date === currentSchoolDay);
    const presentToday = todayAttendance.filter(record => record.is_present).length;
    const attendanceRate = students.length > 0 
      ? Math.round((presentToday / students.length) * 100) 
      : 0;

    // Performance insights
    const topPerformers = studentMetrics.filter(s => s.completionRate >= 80).slice(0, 5);
    const strugglingStudents = studentMetrics.filter(s => s.needHelp > 0 || s.completionRate < 50).slice(0, 5);
    const mostPositiveFeedback = studentMetrics.filter(s => s.positiveFeedback > 0)
      .sort((a, b) => b.positiveFeedback - a.positiveFeedback).slice(0, 3);

    // Additional school-day specific metrics
    const isCurrentlySchoolDay = isSchoolDay(new Date());
    const schoolDayStatus = isCurrentlySchoolDay ? 'Today' : 'Last School Day';

    // Key metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const studentsNeedingHelp = new Set(tasks.filter(task => task.status === 'need-help').map(task => task.student_id)).size;
    
    // Engagement metrics
    const activeStudents = new Set(tasks.map(task => task.student_id)).size;
    const engagementRate = students.length > 0 ? Math.round((activeStudents / students.length) * 100) : 0;

    const filteredAttendanceHistory = attendanceHistory.filter((record) => {
      if (attendanceStartDate && record.date < attendanceStartDate) return false;
      if (attendanceEndDate && record.date > attendanceEndDate) return false;
      return true;
    });

    const monthlyAttendance = Object.values(
      filteredAttendanceHistory.reduce<Record<string, { month: string; present: number; total: number }>>((acc, record) => {
        const month = record.date.slice(0, 7);
        if (!acc[month]) acc[month] = { month, present: 0, total: 0 };
        acc[month].total += 1;
        if (record.is_present) acc[month].present += 1;
        return acc;
      }, {})
    ).map((month) => ({
      ...month,
      rate: month.total > 0 ? Math.round((month.present / month.total) * 100) : 0,
    })).sort((a, b) => a.month.localeCompare(b.month));

    const studentAttendanceRates = students.map((student) => {
      const records = filteredAttendanceHistory.filter(record => record.student_id === student.id);
      const present = records.filter(record => record.is_present).length;
      const rate = records.length > 0 ? Math.round((present / records.length) * 100) : null;

      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        present,
        absent: records.length - present,
        total: records.length,
        rate,
        chronicFlag: rate !== null && rate < 90
      };
    }).sort((a, b) => {
      if (a.rate === null && b.rate === null) return a.name.localeCompare(b.name);
      if (a.rate === null) return 1;
      if (b.rate === null) return -1;
      return a.rate - b.rate;
    });

    const attendanceInsights = {
      totalRecords: filteredAttendanceHistory.length,
      monthlyAttendance,
      studentAttendanceRates,
      chronicAbsenceCount: studentAttendanceRates.filter(student => student.chronicFlag).length,
      perfectAttendanceCount: studentAttendanceRates.filter(student => student.rate === 100).length,
      averageHistoricalRate: filteredAttendanceHistory.length > 0
        ? Math.round((filteredAttendanceHistory.filter(record => record.is_present).length / filteredAttendanceHistory.length) * 100)
        : null
    };

    return {
      totalStudents: students.length,
      activeStudents,
      engagementRate,
      attendanceRate,
      presentToday,
      schoolDayStatus,
      totalTasks,
      completedTasks,
      overallCompletionRate,
      studentsNeedingHelp,
      studentMetrics,
      feedbackAnalytics,
      subjectAnalytics,
      attendanceInsights,
      topPerformers,
      strugglingStudents,
      mostPositiveFeedback,
      currentSchoolDay: getCurrentSchoolDay(),
      isCurrentlySchoolDay
    };
  }, [students, tasks, subjects, attendance, attendanceHistory, attendanceStartDate, attendanceEndDate]);

  // Simple bar chart component
  const SimpleBarChart = ({ data, title, colorClass = "bg-blue-500" }: { data: Record<string, number>, title: string, colorClass?: string }) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-600 truncate capitalize">
                {key.replace('-', ' ')}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${colorClass} transition-all duration-500`}
                  style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                />
              </div>
              <div className="w-8 text-xs text-gray-600 text-right">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleExportAttendanceCsv = () => {
    const rows = analytics.attendanceInsights.studentAttendanceRates.map((student) => ({
      Student: student.name,
      Grade: student.grade,
      Present: student.present,
      Absent: student.absent,
      Total: student.total,
      'Attendance Rate': student.rate === null ? 'No data' : `${student.rate}%`,
      Flag: student.chronicFlag ? 'Below 90%' : ''
    }));

    const headers = Object.keys(rows[0] || {
      Student: '',
      Grade: '',
      Present: '',
      Absent: '',
      Total: '',
      'Attendance Rate': '',
      Flag: ''
    });

    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => headers.map((header) => escapeCsv(row[header as keyof typeof row])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-insights-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Redirect if not admin. Keep this after all hooks to preserve hook order.
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Access denied. Analytics dashboard is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive insights into student progress and school performance</p>
        </div>
        <HelpTooltip
          title="Analytics & Reports"
          content={[
            "View comprehensive analytics for all students and school-wide performance.",
            "Click any student row in the performance table to view detailed individual reports.",
            "Export student reports as PDF or share them via email with parents.",
            "Monitor attendance trends, task completion rates, and identify students needing support."
          ]}
        />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Present {analytics.schoolDayStatus}</p>
                <p className="text-3xl font-bold text-emerald-900">
                  {analytics.presentToday}
                  <span className="text-lg text-emerald-700">/{analytics.totalStudents}</span>
                </p>
                <p className="text-emerald-600 text-xs">
                  ({analytics.attendanceRate}%) • {analytics.isCurrentlySchoolDay ? 'Live' : analytics.currentSchoolDay}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Task Completion</p>
                <p className="text-3xl font-bold text-amber-900">{analytics.overallCompletionRate}%</p>
                <p className="text-amber-600 text-xs">{analytics.completedTasks} of {analytics.totalTasks} tasks</p>
              </div>
              <Target className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-600 text-sm font-medium">Need Help</p>
                <p className="text-3xl font-bold text-rose-900">{analytics.studentsNeedingHelp}</p>
                <p className="text-rose-600 text-xs">students requiring assistance</p>
              </div>
              <AlertCircle className="h-8 w-8 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Task Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart 
              data={tasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)} 
              title="Tasks by Status"
              colorClass="bg-gradient-to-r from-blue-500 to-indigo-500"
            />
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              Tasks by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart 
              data={analytics.subjectAnalytics.reduce((acc, subject) => {
                acc[subject.name] = subject.totalTasks;
                return acc;
              }, {} as Record<string, number>)} 
              title="Task Distribution"
              colorClass="bg-gradient-to-r from-emerald-500 to-green-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Teacher Feedback Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Teacher Feedback Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <ThumbsUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-700">{analytics.feedbackAnalytics.positiveFeedback}</div>
                <div className="text-sm text-emerald-600">Positive</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                <Minus className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-700">{analytics.feedbackAnalytics.neutralFeedback}</div>
                <div className="text-sm text-amber-600">Neutral</div>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-200">
                <ThumbsDown className="h-6 w-6 text-rose-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-rose-700">{analytics.feedbackAnalytics.negativeFeedback}</div>
                <div className="text-sm text-rose-600">Needs Work</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{analytics.feedbackAnalytics.totalFeedbackGiven}</div>
                <div className="text-sm text-blue-600">Total Given</div>
              </div>
            </div>

            {/* Feedback Completion Rate */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Feedback Completion Rate</span>
                  <span>{analytics.feedbackAnalytics.feedbackCompletionRate}% of completed tasks have feedback</span>
                </div>
                <Progress value={analytics.feedbackAnalytics.feedbackCompletionRate} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-600">Tasks with Feedback</div>
                  <div className="text-lg font-bold text-gray-900">{analytics.feedbackAnalytics.completedTasksWithFeedback}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-600">Avg Response Time</div>
                  <div className="text-lg font-bold text-gray-900">{analytics.feedbackAnalytics.averageResponseTime}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Top Performers */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Top Performers
              </h4>
              <div className="space-y-2">
                {analytics.topPerformers.slice(0, 3).map((student, index) => (
                  <div key={student.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-900">{student.name}</span>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                      {student.completionRate}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Students Needing Support */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                Needs Support
              </h4>
              <div className="space-y-2">
                {analytics.strugglingStudents.slice(0, 3).map((student) => (
                  <div key={student.name} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{student.name}</span>
                    <div className="flex gap-1">
                      {student.needHelp > 0 && (
                        <Badge variant="outline" className="text-rose-600 border-rose-200 text-xs">
                          {student.needHelp} help
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-gray-600 border-gray-200 text-xs">
                        {student.completionRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Positive Feedback */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                Most Positive Feedback
              </h4>
              <div className="space-y-2">
                {analytics.mostPositiveFeedback.map((student) => (
                  <div key={student.name} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{student.name}</span>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                      {student.positiveFeedback} 👍
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Subject Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Total Tasks</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Completion Rate</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Struggle Rate</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Satisfaction Rate</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.subjectAnalytics.map((subject) => (
                  <tr key={subject.name} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{subject.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-gray-700">{subject.totalTasks}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${subject.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-10 text-right">{subject.completionRate}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${subject.struggleRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-10 text-right">{subject.struggleRate}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${subject.satisfactionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-10 text-right">{subject.satisfactionRate}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge 
                        variant="outline" 
                        className={`${
                          subject.completionRate >= 80 ? 'text-emerald-600 border-emerald-200' :
                          subject.completionRate >= 60 ? 'text-amber-600 border-amber-200' :
                          'text-rose-600 border-rose-200'
                        }`}
                      >
                        {subject.completionRate >= 80 ? 'Excellent' :
                         subject.completionRate >= 60 ? 'Good' : 'Needs Focus'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Student Performance Table - Improved */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Student Performance Overview
            </div>
            <div className="text-sm text-gray-600">
              Showing all {analytics.studentMetrics.length} students
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">Total Tasks</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">Completed</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">Working</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">Need Help</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">Ready Review</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Completion Rate</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.studentMetrics.map((student, index) => {
                  // Find the actual student object from students array
                  const studentData = students.find(s => s.name === student.name);
                  
                  return (
                    <tr 
                      key={student.name} 
                      className="hover:bg-blue-50 transition-colors cursor-pointer group"
                      onClick={() => studentData && handleStudentClick(studentData)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            student.totalTasks === 0 ? 'bg-gray-300' :
                            student.completionRate >= 80 ? 'bg-emerald-500' :
                            student.completionRate >= 60 ? 'bg-amber-500' :
                            student.completionRate >= 40 ? 'bg-orange-500' : 'bg-rose-500'
                          }`} />
                          <span className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-medium ${
                          student.totalTasks === 0 ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {student.totalTasks}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-medium ${
                          student.completed === 0 ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {student.completed}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-medium ${
                          student.working === 0 ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {student.working}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-medium ${
                          student.needHelp === 0 ? 'bg-gray-100 text-gray-500' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {student.needHelp}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-medium ${
                          student.readyReview === 0 ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {student.readyReview}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex-1 max-w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                student.totalTasks === 0 ? 'bg-gray-300' :
                                student.completionRate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                student.completionRate >= 60 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                                student.completionRate >= 40 ? 'bg-gradient-to-r from-orange-500 to-red-400' :
                                'bg-gradient-to-r from-rose-500 to-red-500'
                              }`}
                              style={{ width: `${student.completionRate}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium min-w-8 ${
                            student.totalTasks === 0 ? 'text-gray-500' :
                            student.completionRate >= 80 ? 'text-emerald-700' :
                            student.completionRate >= 60 ? 'text-amber-700' :
                            student.completionRate >= 40 ? 'text-orange-700' : 'text-rose-700'
                          }`}>
                            {student.totalTasks === 0 ? 'N/A' : `${student.completionRate}%`}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <div className="flex items-center justify-center">
                          <Eye className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Click instruction */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Eye className="h-4 w-4" />
              <span>💡 Click on any student row to view detailed progress report with export and sharing options</span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Excellent (80%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Good (60-79%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Fair (40-59%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Needs Attention (&lt;40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span>No Tasks Assigned</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Overview - Simplified and Clear */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              {analytics.schoolDayStatus} Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-700">{analytics.presentToday}</div>
                <div className="text-sm text-emerald-600">Present</div>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-200">
                <div className="text-2xl font-bold text-rose-700">{analytics.totalStudents - analytics.presentToday}</div>
                <div className="text-sm text-rose-600">Absent</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{analytics.attendanceRate}%</div>
                <div className="text-sm text-blue-600">Attendance Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-700">{analytics.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Attendance Progress</span>
                <span>{analytics.attendanceRate}% of students present</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${analytics.attendanceRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* School Day Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${analytics.isCurrentlySchoolDay ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-blue-700">
                  {analytics.isCurrentlySchoolDay ? 
                    `Live attendance data for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` :
                    `Latest data from ${new Date(analytics.currentSchoolDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} (last school day)`
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Students with Perfect Attendance</span>
                <span className="font-medium text-emerald-600">
                  {analytics.attendanceInsights.perfectAttendanceCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Daily Attendance</span>
                <span className="font-medium text-blue-600">{analytics.attendanceRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Students Needing Help</span>
                <span className="font-medium text-rose-600">{analytics.studentsNeedingHelp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Task Completion Rate</span>
                <span className="font-medium text-amber-600">{analytics.overallCompletionRate}%</span>
              </div>
            </div>

            {/* School Hours Reminder */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 text-center">
                <div className="font-medium mb-1">📚 School Schedule</div>
                <div>Monday - Friday</div>
                <div className="text-gray-500">Weekends excluded from analytics</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Insights - Historical */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              Attendance Insights
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExportAttendanceCsv}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <FileText className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-gray-700">From</label>
              <Input
                type="date"
                value={attendanceStartDate}
                onChange={(event) => setAttendanceStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-gray-700">To</label>
              <Input
                type="date"
                value={attendanceEndDate}
                onChange={(event) => setAttendanceEndDate(event.target.value)}
              />
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm text-emerald-700">Historical Rate</div>
              <div className="text-2xl font-bold text-emerald-900">
                {analytics.attendanceInsights.averageHistoricalRate === null
                  ? 'No data'
                  : `${analytics.attendanceInsights.averageHistoricalRate}%`}
              </div>
              <div className="text-xs text-emerald-700">{analytics.attendanceInsights.totalRecords} records</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm text-amber-700">Below 90%</div>
              <div className="text-2xl font-bold text-amber-900">{analytics.attendanceInsights.chronicAbsenceCount}</div>
              <div className="text-xs text-amber-700">students to monitor</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <SimpleBarChart
                data={analytics.attendanceInsights.monthlyAttendance.reduce((acc, month) => {
                  acc[month.month] = month.rate;
                  return acc;
                }, {} as Record<string, number>)}
                title="Monthly Attendance Rate"
                colorClass="bg-gradient-to-r from-emerald-500 to-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-800">{analytics.attendanceInsights.perfectAttendanceCount}</div>
                <div className="text-sm text-blue-700">Perfect Attendance</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{analytics.attendanceInsights.monthlyAttendance.length}</div>
                <div className="text-sm text-gray-700">Months Tracked</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Present</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Absent</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Rate</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.attendanceInsights.studentAttendanceRates.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">Grade {student.grade}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">{student.present}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">{student.absent}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          student.rate === null
                            ? 'border-gray-200 text-gray-600'
                            : student.rate < 90
                              ? 'border-amber-200 text-amber-700'
                              : 'border-emerald-200 text-emerald-700'
                        }
                      >
                        {student.rate === null ? 'No data' : `${student.rate}%`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.chronicFlag ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Below 90%</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
      />
    </div>
  );
};

export default Analytics; 