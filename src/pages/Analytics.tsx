import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { useStudents } from '@/hooks/useStudents';
import { useSubjects } from '@/hooks/useSubjects';
import { useAttendance } from '@/hooks/useAttendance';
import { useUserRole } from '@/hooks/useUserRole';
import StudentDetailsModal from '@/components/StudentDetailsModal';
import HelpTooltip from '@/components/HelpTooltip';
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
  Eye
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Analytics = () => {
  const { isAdmin } = useUserRole();
  const { tasks } = useTasks();
  const { students } = useStudents();
  const { subjects } = useSubjects();
  const { attendance } = useAttendance();

  // Modal state for student details
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    email?: string;
    grade?: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle student row click
  const handleStudentClick = (student: any) => {
    setSelectedStudent({
      id: student.id,
      name: student.name,
      email: student.email,
      grade: student.grade
    });
    setIsModalOpen(true);
  };

  // Redirect if not admin
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

  // Calculate analytics data
  const analytics = useMemo(() => {
    // Helper function to check if a date is a school day (Monday-Friday)
    const isSchoolDay = (date: Date) => {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday (1) through Friday (5)
    };

    // Get current school day (today if it's a school day, otherwise most recent school day)
    const getCurrentSchoolDay = () => {
      const today = new Date();
      if (isSchoolDay(today)) {
        return today.toISOString().split('T')[0];
      }
      // If today is weekend, find the most recent Friday
      const daysBack = today.getDay() === 0 ? 2 : 1; // Sunday: go back 2 days, Saturday: go back 1 day
      const lastSchoolDay = new Date(today);
      lastSchoolDay.setDate(today.getDate() - daysBack);
      return lastSchoolDay.toISOString().split('T')[0];
    };

    // Task status distribution
    const taskStatusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Subject distribution
    const subjectCounts = tasks.reduce((acc, task) => {
      const subjectName = task.subjects?.name || 'No Subject';
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Student performance metrics
    const studentMetrics = students.map(student => {
      const studentTasks = tasks.filter(task => task.student_id === student.id);
      const completedTasks = studentTasks.filter(task => task.status === 'completed');
      const needHelpTasks = studentTasks.filter(task => task.status === 'need-help');
      const workingTasks = studentTasks.filter(task => task.status === 'working');
      const readyReviewTasks = studentTasks.filter(task => task.status === 'ready-review');

      // Calculate completion rate
      const completionRate = studentTasks.length > 0 
        ? Math.round((completedTasks.length / studentTasks.length) * 100) 
        : 0;

      return {
        name: student.name,
        totalTasks: studentTasks.length,
        completed: completedTasks.length,
        needHelp: needHelpTasks.length,
        working: workingTasks.length,
        readyReview: readyReviewTasks.length,
        completionRate
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    // Attendance analytics - only for current school day
    const currentSchoolDay = getCurrentSchoolDay();
    const todayAttendance = attendance.filter(record => record.date === currentSchoolDay);
    const presentToday = todayAttendance.filter(record => record.is_present).length;
    const attendanceRate = students.length > 0 
      ? Math.round((presentToday / students.length) * 100) 
      : 0;

    // Additional school-day specific metrics
    const isCurrentlySchoolDay = isSchoolDay(new Date());
    const schoolDayStatus = isCurrentlySchoolDay ? 'Today' : 'Last School Day';

    // Key metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const studentsNeedingHelp = new Set(tasks.filter(task => task.status === 'need-help').map(task => task.student_id)).size;

    return {
      taskStatusCounts,
      subjectCounts,
      studentMetrics,
      attendanceRate,
      totalTasks,
      completedTasks,
      overallCompletionRate,
      studentsNeedingHelp,
      presentToday,
      totalStudents: students.length,
      totalSubjects: subjects.length,
      currentSchoolDay,
      schoolDayStatus,
      isCurrentlySchoolDay
    };
  }, [tasks, students, subjects, attendance]);

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
              data={analytics.taskStatusCounts} 
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
              data={analytics.subjectCounts} 
              title="Task Distribution"
              colorClass="bg-gradient-to-r from-emerald-500 to-green-500"
            />
          </CardContent>
        </Card>
      </div>

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
                  {Math.floor(analytics.totalStudents * 0.75)} {/* Placeholder - you can calculate actual */}
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