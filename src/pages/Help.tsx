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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));
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
            '1. Log in with your teacher or admin credentials',
            '2. You\'ll land on the Dashboard (FleetBoard) showing all student progress',
            '3. Use the sidebar to navigate between different sections',
            '4. Check the header for your check-in status and user menu'
          ]
        },
        {
          title: 'User Interface Overview',
          content: [
            '• **Sidebar**: Main navigation menu with all available features',
            '• **Header**: Shows current page, check-in button, and user profile',
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
            '1. Navigate to "Manage Tasks" in the sidebar',
            '2. Fill in the task details: title, description, subject',
            '3. Select which students should receive the task',
            '4. Set any due dates or special instructions',
            '5. Click "Create Task" to assign it to selected students'
          ]
        },
        {
          title: 'Task Status Workflow',
          content: [
            'Tasks follow a standard workflow that students can update:',
            '1. **Working**: Student is actively working on the task',
            '2. **Need Help**: Student is stuck and requires assistance',
            '3. **Ready Review**: Student has completed work and wants review',
            '4. **Completed**: Teacher has reviewed and approved the work'
          ]
        },
        {
          title: 'Monitoring Task Progress',
          content: [
            'Use the dashboard to see real-time status updates from students.',
            'Students can change their status independently to communicate their needs.',
            'Teachers can update task status during review or when providing help.'
          ]
        },
        {
          title: 'Editing and Managing Tasks',
          content: [
            'Click on any task card to edit details or update status.',
            'You can modify task descriptions, due dates, and assignments.',
            'Delete tasks that are no longer needed from the task management area.'
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
            'Track which students have perfect attendance.',
            'Monitor overall class attendance percentages.',
            'Generate attendance reports for administration.'
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
            'View key metrics: total students, attendance rates, task completion, students needing help.',
            'Monitor both individual student performance and class-wide trends.'
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
            '• **Completion Rate**: Percentage of assigned tasks completed',
            '• **Attendance Rate**: Percentage of school days student was present',
            '• **Task Breakdown**: Distribution across different status categories',
            '• **Subject Performance**: Progress tracking by academic subject'
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
            'Enter the user\'s email address to generate a new temporary password.',
            'Users should change their password on first login after reset.'
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
            '• Use status filters to focus on specific classroom needs',
            '• Encourage students to update their status honestly',
            '• Review completed work promptly to maintain student engagement'
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Help & User Guide
          </h1>
          <p className="text-gray-600">
            Complete guide to using the Student Progress Tracking System
            {isAdmin && ' (Administrator View)'}
            {isTeacher && !isAdmin && ' (Teacher View)'}
          </p>
        </div>
      </div>

      {/* Quick Start Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Play className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-900">🚀 Quick Start Guide</h2>
              <p className="text-blue-700">Get up and running in just a few steps</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Teacher Quick Start */}
            {(isTeacher || isAdmin) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                    👩‍🏫
                  </div>
                  For Teachers - First Steps
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600 flex-shrink-0 mt-0.5">1</span>
                    <div>
                      <span className="font-medium">Start with the Dashboard</span> - View students and real-time progress
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600 flex-shrink-0 mt-0.5">2</span>
                    <div>
                      <span className="font-medium">Create Tasks</span> - Go to "Manage Tasks" → Add assignments
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-600 flex-shrink-0 mt-0.5">3</span>
                    <div>
                      <span className="font-medium">Use Filters</span> - Click progress tiles to focus on student needs
                    </div>
                  </li>
                </ol>
              </div>
            )}
            
            {/* Admin Quick Start */}
            {isAdmin && (
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs">
                    👨‍💼
                  </div>
                  For Administrators - Setup
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0 mt-0.5">1</span>
                    <div>
                      <span className="font-medium">Add Users</span> - User Management → Create teachers/students
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0 mt-0.5">2</span>
                    <div>
                      <span className="font-medium">Sync Records</span> - Fix data consistency with sync button
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0 mt-0.5">3</span>
                    <div>
                      <span className="font-medium">Monitor Analytics</span> - Track system-wide performance
                    </div>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search help topics... (e.g., 'create task', 'attendance', 'export report')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm('');
                  } else if (e.key === 'Enter' && searchTerm && filteredContent.length > 0) {
                    // Expand all matching sections
                    const newExpanded = new Set(expandedSections);
                    filteredContent.forEach(item => newExpanded.add(item.id));
                    setExpandedSections(newExpanded);
                  }
                }}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              )}
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                
                // Filter categories based on user role
                if (category.id === 'admin' && !isAdmin) return null;
                
                return (
                  <Button
                    key={category.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Search Results Summary */}
          {searchTerm && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Search className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-800">
                    Found <strong>{filteredContent.length}</strong> result{filteredContent.length !== 1 ? 's' : ''} for "{searchTerm}"
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100"
                >
                  Clear search
                </Button>
              </div>
              {filteredContent.length > 0 && (
                <div className="mt-2 text-xs text-yellow-700">
                  💡 Matching sections are automatically expanded and highlighted below
                  <span className="ml-3 text-yellow-600">
                    • Press <kbd className="px-1 py-0.5 bg-yellow-100 rounded text-xs">Enter</kbd> to expand all results
                    • Press <kbd className="px-1 py-0.5 bg-yellow-100 rounded text-xs">Esc</kbd> to clear search
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3">💡 Try searching for:</h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['dashboard', 'create task', 'attendance', 'export report', 'user management', 'status filter', 'student progress'].map(suggestion => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchTerm(suggestion)}
                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {suggestion}
                      </Button>
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
              <Card key={item.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(item.id)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <span dangerouslySetInnerHTML={{ __html: highlightSearchTerm(item.title) }} />
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      {searchTerm && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700">
                          Match
                        </Badge>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
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

      {/* Quick Actions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Quick Start Tips</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-blue-800">For New Teachers:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Start with the Dashboard to see your students</li>
                <li>• Create your first task in "Manage Tasks"</li>
                <li>• Check attendance daily using the Attendance tab</li>
              </ul>
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <p className="font-medium text-blue-800">For Administrators:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Set up users in User Management first</li>
                  <li>• Sync student records after adding users</li>
                  <li>• Monitor system usage in Analytics</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help; 