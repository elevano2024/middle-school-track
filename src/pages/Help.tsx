import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  UserPlus, 
  CheckCircle, 
  ClipboardCheck,
  Eye, 
  Filter, 
  Download, 
  Mail, 
  Shield, 
  Clock, 
  Target, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Play,
  Lightbulb,
  Star
} from 'lucide-react';

const Help = () => {
  const { isAdmin, isTeacher, isStudent } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started', 'review-queue']));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const helpContent = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Play,
      category: 'basics',
      roles: ['teacher', 'admin'],
      sections: [
        {
          title: 'Welcome to ARCC Student Progress Tracker',
          content: [
            'This comprehensive system helps you track student progress, manage tasks, monitor attendance, and generate detailed reports.',
            'The interface is designed to be intuitive and efficient for classroom management.'
          ]
        },
        {
          title: 'First Login & Navigation',
          content: [
            '1. Log in with your teacher or admin credentials.',
            '2. You\'ll land on the Dashboard (FleetBoard) showing all student progress.',
            '3. Use the sidebar to navigate between Dashboard, Attendance, Review Queue, Manage Tasks, Analytics, and Help.',
            '4. Watch the Review Queue badge to see how many submitted activities are waiting for review.'
          ]
        },
        {
          title: 'User Interface Overview',
          content: [
            '• **Sidebar**: Main navigation menu with all available features',
            '• **Review Queue Badge**: Shows how many activities are currently waiting for teacher review',
            '• **Main Content**: Displays the selected page content',
            '• **Notifications**: Toast messages appear for important updates'
          ]
        }
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard (FleetBoard)',
      icon: Eye,
      category: 'core',
      roles: ['teacher', 'admin'],
      sections: [
        {
          title: 'Understanding the Student Grid',
          content: [
            'The main dashboard shows a real-time view of all students and their current task status.',
            'Each student card displays their name and current tasks organized by subject.',
            'Color-coded status indicators help you quickly identify who needs attention.'
          ]
        },
        {
          title: 'Status Color System',
          content: [
            '• **Blue (Working)**: Student is actively working on tasks',
            '• **Red (Need Help)**: Student requires assistance',
            '• **Orange (Ready Review)**: Student has completed work and needs review',
            '• **Green (Completed)**: Task has been completed and reviewed',
            '• **Gray**: No current status or inactive'
          ]
        },
        {
          title: 'Using Status Filters',
          content: [
            '1. Click on any progress tile (Working, Need Help, etc.) at the top',
            '2. The view will filter to show only students with tasks in that status',
            '3. This helps you focus on specific classroom needs',
            '4. Click the same tile again or "Show All" to clear the filter'
          ]
        },
        {
          title: 'Real-time Updates',
          content: [
            'The dashboard updates automatically when students change their task status.',
            'No need to refresh - changes appear instantly across all connected devices.',
            'Perfect for classroom TV displays and teacher monitoring.'
          ]
        },
        {
          title: 'Students Need Attention',
          content: [
            'The dashboard highlights students who may need follow-up based on task age.',
            'Need Help tasks are flagged when they have been waiting for help for more than 30 minutes.',
            'Ready Review tasks are flagged when they have been waiting for review for more than a week.',
            'Use these alerts to decide whether to help a student, review their work, or send the task back for revisions.'
          ]
        }
      ]
    },
    {
      id: 'review-queue',
      title: 'Review Queue',
      icon: ClipboardCheck,
      category: 'core',
      roles: ['teacher', 'admin'],
      isNew: true,
      sections: [
        {
          title: 'What the Review Queue Is For',
          content: [
            'The Review Queue shows all learning activities that students have marked as Ready Review.',
            'It is the main place for teachers to clear submitted work, provide feedback, and move tasks to Completed.',
            'The number badge in the sidebar shows how many activities are waiting for review.'
          ]
        },
        {
          title: 'Review Actions',
          content: [
            '• **Send Back**: Moves the activity back to Working when the student needs to revise or continue.',
            '• **Mark Complete**: Approves the activity without adding written feedback.',
            '• **Complete + Feedback**: Opens the feedback dialog and saves feedback while marking the task Completed in one step.'
          ]
        },
        {
          title: 'Recommended Review Workflow',
          content: [
            '1. Open Review Queue at the start or end of each work cycle.',
            '2. Start with the oldest submissions first so work does not sit unreviewed.',
            '3. Use Complete + Feedback when students need encouragement or next steps.',
            '4. Use Send Back when a task is not ready to complete yet.',
            '5. After review, check Analytics to see updated completion and feedback metrics.'
          ]
        }
      ]
    },
    {
      id: 'tasks',
      title: 'Task Management',
      icon: CheckCircle,
      category: 'core',
      roles: ['teacher', 'admin'],
      sections: [
        {
          title: 'Creating New Tasks',
          content: [
            '1. Navigate to "Manage Tasks" in the sidebar.',
            '2. Fill in the activity name, learning objectives or notes, and subject area.',
            '3. Select which students should receive the activity.',
            '4. Click "Create Task" to assign it to selected students.',
            '5. Created activities begin in TO DO and appear on each student\'s dashboard.'
          ]
        },
        {
          title: 'Task Status Workflow',
          content: [
            'Tasks follow a standard workflow that students can update:',
            '1. **TO DO**: Activity has been assigned but not started.',
            '2. **Working**: Student is actively working on the task.',
            '3. **Need Help**: Student is stuck and requires assistance.',
            '4. **Ready Review**: Student has submitted work for teacher review.',
            '5. **Completed**: Teacher has reviewed and approved the work.'
          ]
        },
        {
          title: 'Monitoring Task Progress',
          content: [
            'Use the dashboard to see real-time status updates from students.',
            'Students can change their status independently to communicate their needs.',
            'Use the Review Queue for work that is Ready Review.',
            'Teachers can update task status during review or when providing help.'
          ]
        },
        {
          title: 'Editing and Managing Tasks',
          content: [
            'Click on any task card to edit details or update status.',
            'Use Manage Tasks to edit, reassign, bulk assign, or delete learning activities.',
            'When deleting one instance of a learning activity, matching activities with the same title and subject are removed from all assigned students.'
          ]
        }
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance System',
      icon: Calendar,
      category: 'core',
      roles: ['teacher', 'admin'],
      sections: [
        {
          title: 'Student Self Check-in',
          content: [
            'Students can check themselves in using the button in the header.',
            'They can mark themselves as Present or Absent for the current school day.',
            'Students can update their status throughout the day if needed.'
          ]
        },
        {
          title: 'Teacher Attendance Management',
          content: [
            '1. Go to "Attendance" in the sidebar to view the attendance management table',
            '2. See all students\' attendance status for today and previous days',
            '3. Use "Mark All Present Today" for quick bulk updates',
            '4. Click individual status toggles to update specific students',
            '5. Use date picker and filters to view historical attendance'
          ]
        },
        {
          title: 'Attendance Analytics',
          content: [
            'View attendance rates and trends in the Analytics section.',
            'Use Attendance Insights to see monthly attendance trends and per-student attendance rates.',
            'Students below 90% attendance are flagged for follow-up.',
            'Export attendance insights as CSV or print them for administration.'
          ]
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: BarChart3,
      category: 'reporting',
      roles: ['teacher', 'admin'],
      sections: [
        {
          title: 'Dashboard Overview',
          content: [
            'The Analytics page provides comprehensive insights into student progress.',
            'View key metrics: total students, attendance rates, task completion, students needing help, and feedback activity.',
            'Monitor both individual student performance and class-wide trends.',
            'Attendance Insights shows historical attendance patterns beyond today.'
          ]
        },
        {
          title: 'Attendance Insights',
          isNew: true,
          content: [
            'Use the Attendance Insights section to review historical attendance, not just today\'s check-ins.',
            'Set a start and end date to focus on a specific time period.',
            'Review monthly attendance trends and the per-student attendance table.',
            'Students below 90% attendance are flagged so administrators can follow up.',
            'Use CSV export for spreadsheets or Print for a quick report.'
          ]
        },
        {
          title: 'Student Performance Table',
          content: [
            'Click on any student row to open detailed individual reports.',
            'View completion rates, task breakdowns, and attendance summaries.',
            'Color-coded indicators show performance levels at a glance.',
            'Export individual student reports for parent conferences.'
          ]
        },
        {
          title: 'Exporting Student Reports',
          content: [
            '1. Click on a student row in the analytics table',
            '2. Review the detailed progress information',
            '3. Click "Export as PDF" to generate a printable report',
            '4. Or enter a parent email and click "Send" to share via email',
            '5. Reports include all task progress, attendance, and performance metrics'
          ]
        },
        {
          title: 'Understanding Metrics',
          content: [
            '• **Completion Rate**: Percentage of assigned tasks completed after teacher review',
            '• **Attendance Rate**: Percentage of tracked attendance records marked present',
            '• **Task Breakdown**: Distribution across different status categories',
            '• **Subject Performance**: Progress tracking by academic subject',
            '• **Feedback Response Time**: Shows "No data yet" until feedback exists'
          ]
        }
      ]
    },
    {
      id: 'user-management',
      title: 'User Management',
      icon: UserPlus,
      category: 'admin',
      roles: ['admin'],
      sections: [
        {
          title: 'Adding New Users',
          content: [
            '1. Navigate to "User Management" in the sidebar',
            '2. Click "Create New User" to add teachers, students, or admins',
            '3. Fill in required information: name, email, password',
            '4. Assign appropriate roles (Student, Teacher, or Admin)',
            '5. New users can log in immediately with provided credentials'
          ]
        },
        {
          title: 'Managing User Roles',
          content: [
            'Use the role assignment form to change user permissions.',
            '• **Students**: Can update task status and check attendance',
            '• **Teachers**: Full classroom management + student features',
            '• **Admins**: All features + user management + system settings'
          ]
        },
        {
          title: 'Student Record Synchronization',
          content: [
            'Use "Sync Student Records" to ensure all student users have proper database entries.',
            'This fixes any data inconsistencies between user profiles and student records.',
            'Run this periodically to maintain system integrity.'
          ]
        },
        {
          title: 'Password Management',
          content: [
            'Reset user passwords using the password reset form.',
            'Enter the user\'s email address to send a secure reset link.',
            'If reset email delivery is unavailable, an administrator can set a temporary password through Supabase admin tools.',
            'Users should change temporary passwords after logging in.'
          ]
        }
      ]
    },
    {
      id: 'settings',
      title: 'Settings & Configuration',
      icon: Settings,
      category: 'admin',
      roles: ['admin', 'teacher'],
      sections: [
        {
          title: 'System Settings',
          content: [
            'Access system-wide configuration options from the Settings page.',
            'Configure school schedules, grading periods, and academic subjects.',
            'Set up notification preferences and system defaults.'
          ]
        },
        {
          title: 'Profile Management',
          content: [
            'Update your personal profile information and contact details.',
            'Change your password and notification preferences.',
            'Configure your dashboard layout and display options.'
          ]
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: AlertCircle,
      category: 'support',
      roles: ['teacher', 'admin'],
      sections: [
        {
          title: 'Common Issues',
          content: [
            '**Students not showing up**: Check that student users have been properly created and synced.',
            '**Real-time updates not working**: Refresh the page or check internet connection.',
            '**Attendance not saving**: Ensure student has a profile record in the system.',
            '**Tasks not appearing**: Verify task was assigned to the correct students.'
          ]
        },
        {
          title: 'Performance Tips',
          content: [
            'Keep browser tabs up to date for best real-time performance.',
            'Use Chrome or Firefox for optimal compatibility.',
            'Clear browser cache if experiencing display issues.',
            'Ensure stable internet connection for real-time features.'
          ]
        },
        {
          title: 'Getting Help',
          content: [
            'Contact your system administrator for technical issues.',
            'Report bugs or feature requests to the development team.',
            'Use this help guide as your first resource for questions.'
          ]
        }
      ]
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: Star,
      category: 'tips',
      roles: ['teacher', 'admin'],
      sections: [
        {
          title: 'Classroom Management Tips',
          content: [
            '• Check the dashboard regularly to identify students needing help',
            '• Use the Review Queue daily so Ready Review work does not pile up',
            '• Use status filters to focus on specific classroom needs',
            '• Encourage students to update their status honestly',
            '• Provide feedback promptly to maintain student engagement'
          ]
        },
        {
          title: 'Task Assignment Strategy',
          content: [
            '• Create clear, specific task descriptions',
            '• Set realistic deadlines and expectations',
            '• Assign tasks to appropriate skill levels',
            '• Use subjects to organize curriculum areas effectively'
          ]
        },
        {
          title: 'Report Generation',
          content: [
            '• Generate progress reports regularly for parent communication',
            '• Use analytics to identify students who need additional support',
            '• Export attendance data for administrative requirements',
            '• Share individual reports during parent-teacher conferences'
          ]
        }
      ]
    }
  ];

  // Filter content based on user role and search term
  const filteredContent = useMemo(() => {
    let userRole = 'student';
    if (isAdmin) userRole = 'admin';
    else if (isTeacher) userRole = 'teacher';

    let filtered = helpContent.filter(item => {
      // Filter by role
      if (!item.roles.includes(userRole)) return false;
      
      // Filter by category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      
      return true;
    });

    // Apply search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchLower);
        const contentMatch = item.sections.some(section => 
          section.title.toLowerCase().includes(searchLower) ||
          section.content.some(content => content.toLowerCase().includes(searchLower))
        );
        return titleMatch || contentMatch;
      });
    }

    return filtered;
  }, [isAdmin, isTeacher, helpContent, selectedCategory, searchTerm]);

  // Auto-expand sections when searching
  React.useEffect(() => {
    if (searchTerm && filteredContent.length > 0) {
      const newExpanded = new Set(expandedSections);
      const searchLower = searchTerm.toLowerCase();
      
      filteredContent.forEach(item => {
        const hasMatch = item.sections.some(section => 
          section.title.toLowerCase().includes(searchLower) ||
          section.content.some(content => content.toLowerCase().includes(searchLower))
        ) || item.title.toLowerCase().includes(searchLower);
        
        if (hasMatch) {
          newExpanded.add(item.id);
        }
      });
      
      setExpandedSections(newExpanded);
    }
  }, [searchTerm, filteredContent]);

  // Function to highlight search terms in text
  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const searchLower = searchTerm.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (!textLower.includes(searchLower)) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  const categories = [
    { id: 'all', label: 'All Topics', icon: BookOpen },
    { id: 'basics', label: 'Getting Started', icon: Play },
    { id: 'core', label: 'Core Features', icon: Target },
    { id: 'reporting', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'admin', label: 'Administration', icon: Shield },
    { id: 'tips', label: 'Best Practices', icon: Lightbulb },
    { id: 'support', label: 'Support', icon: HelpCircle }
  ];

  return (
    <div className="min-h-full space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 p-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <HelpCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Help &amp; User Guide</h1>
              <p className="mt-1 text-blue-100">
                Everything you need to run ARCC
                {isAdmin ? ' as an administrator.' : isTeacher ? ' as a teacher.' : '.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick start steps */}
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {(isTeacher || isAdmin) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
                <Target className="h-4 w-4 text-blue-600" /> Teachers — first steps
              </h3>
              <ol className="space-y-2.5 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
                  <span><span className="font-medium text-slate-900">Dashboard</span> — watch live student progress.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
                  <span><span className="font-medium text-slate-900">Manage Tasks</span> — create and assign activities.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
                  <span><span className="font-medium text-slate-900">Review Queue</span> — clear submitted work and give feedback.</span>
                </li>
              </ol>
            </div>
          )}

          {isAdmin && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
                <Shield className="h-4 w-4 text-indigo-600" /> Administrators — setup
              </h3>
              <ol className="space-y-2.5 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">1</span>
                  <span><span className="font-medium text-slate-900">User Management</span> — create teachers and students.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">2</span>
                  <span><span className="font-medium text-slate-900">Sync Records</span> — fix data consistency in one click.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">3</span>
                  <span><span className="font-medium text-slate-900">Analytics</span> — track school-wide performance.</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* What's New */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600/10 p-2.5">
            <Star className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-900">
              What's New
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">New</Badge>
            </h2>
            <p className="text-sm text-emerald-700">Two new ways to keep work moving — tap a card to jump in.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setExpandedSections((prev) => new Set(prev).add('review-queue'));
            }}
            className="group flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 transition-colors group-hover:bg-emerald-200">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-semibold text-slate-900">Review Queue</div>
              <p className="mt-0.5 text-sm text-slate-600">
                Approve submitted work, send it back, or complete it with feedback in one place.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setExpandedSections((prev) => new Set(prev).add('analytics'));
            }}
            className="group flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 transition-colors group-hover:bg-emerald-200">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-semibold text-slate-900">Attendance Insights</div>
              <p className="mt-0.5 text-sm text-slate-600">
                See historical trends and per-student rates, with low-attendance flags.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search help topics… (e.g. 'review queue', 'attendance', 'create task')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchTerm('');
              } else if (e.key === 'Enter' && searchTerm && filteredContent.length > 0) {
                const newExpanded = new Set(expandedSections);
                filteredContent.forEach(item => newExpanded.add(item.id));
                setExpandedSections(newExpanded);
              }
            }}
            className="h-11 rounded-xl border-slate-200 pl-11"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map(category => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            if (category.id === 'admin' && !isAdmin) return null;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Search Results Summary */}
        {searchTerm && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
            <span className="text-amber-800">
              Found <strong>{filteredContent.length}</strong> result{filteredContent.length !== 1 ? 's' : ''} for "{searchTerm}"
            </span>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="rounded-md px-2 py-1 text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-900"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Help Content */}
      <div className="space-y-4">
        {filteredContent.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? `No results found for "${searchTerm}"` : 'No results found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms or browse categories above.' : 'Try adjusting your search terms or category filter.'}
              </p>
              
              {searchTerm && (
                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-3 font-medium text-blue-900">Try searching for:</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['review queue', 'attendance', 'create task', 'export report', 'user management', 'student progress'].map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setSearchTerm(suggestion)}
                        className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-900"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredContent.map(item => {
            const Icon = item.icon;
            const isExpanded = expandedSections.has(item.id);
            
            return (
              <Card key={item.id} className={`overflow-hidden rounded-2xl border-slate-200 transition-shadow ${isExpanded ? 'shadow-md' : 'hover:shadow-md'}`}>
                <CardHeader
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => toggleSection(item.id)}
                >
                  <CardTitle className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="truncate text-base font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: highlightSearchTerm(item.title) }} />
                      {'isNew' in item && item.isNew && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-xs text-white hover:from-emerald-500 hover:to-green-500">
                          New
                        </Badge>
                      )}
                      {searchTerm && (
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-xs text-amber-700">
                          Match
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      {item.sections.map((section, index) => {
                        // Check if this section has search matches
                        const sectionHasMatch = searchTerm && (
                          section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          section.content.some(content => content.toLowerCase().includes(searchTerm.toLowerCase()))
                        );

                        return (
                          <div key={index} className={`border-l-4 pl-4 ${sectionHasMatch ? 'border-yellow-300 bg-yellow-50/30' : 'border-blue-200'}`}>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                                {index + 1}
                              </div>
                              <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(section.title) }} />
                              {'isNew' in section && section.isNew && (
                                <Badge className="text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-500 hover:to-green-500">
                                  New
                                </Badge>
                              )}
                              {sectionHasMatch && (
                                <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-400 text-yellow-700 ml-2">
                                  🔍
                                </Badge>
                              )}
                            </h4>
                            <div className="space-y-2">
                              {section.content.map((paragraph, pIndex) => {
                                const contentHasMatch = searchTerm && paragraph.toLowerCase().includes(searchTerm.toLowerCase());
                                
                                return (
                                  <div key={pIndex} className={`text-gray-700 leading-relaxed ${contentHasMatch ? 'bg-yellow-50 p-2 rounded border border-yellow-200' : ''}`}>
                                    {paragraph.includes('•') || paragraph.includes('**') ? (
                                      <div dangerouslySetInnerHTML={{
                                        __html: highlightSearchTerm(paragraph)
                                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                          .replace(/^(\d+\.\s)/gm, '<span class="font-medium text-blue-600">$1</span>')
                                          .replace(/^(•\s)/gm, '<span class="text-blue-600">$1</span>')
                                      }} />
                                    ) : (
                                      <div dangerouslySetInnerHTML={{ __html: highlightSearchTerm(paragraph) }} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          Still stuck? Search above or contact your administrator.
        </div>
        <p className="text-xs text-slate-400">ARCC Student Progress Tracker</p>
      </div>
    </div>
  );
};

export default Help; 