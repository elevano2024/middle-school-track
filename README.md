# ARCC Student Progress Tracker

A comprehensive real-time student progress tracking and attendance management system designed for middle schools. This application enables teachers to monitor student progress across subjects while allowing students to self-manage their learning journey and attendance.

## 🎯 **Application Overview**

The ARCC Student Progress Tracker is a modern web application that streamlines classroom management by providing:

- **Real-time student progress tracking** across multiple subjects
- **Self-service attendance system** for students (Monday-Friday school days)
- **Interactive task management** with visual status indicators
- **Role-based access control** (Admin, Teacher, Student)
- **Live updates** without page refreshes
- **Fleet board visualization** for teachers to monitor all students at once

## 👥 **User Roles & Features**

### **Students**
- ✅ **Daily Check-In**: Simple header button to mark attendance (Present/Absent)
- ✅ **Task Dashboard**: View assigned tasks organized by subject
- ✅ **Status Updates**: Update task progress (Working → Need Help → Ready for Review → Completed)
- ✅ **Progress Overview**: Visual summary of current task statuses
- ✅ **Real-time Sync**: See updates instantly without refreshing

### **Teachers**
- ✅ **Fleet Board**: Monitor all students' progress in a grid view
- ✅ **Attendance Visibility**: Green/red dots showing real-time attendance status
- ✅ **Task Assignment**: Create and assign tasks to students
- ✅ **Progress Monitoring**: Track individual student progress across subjects
- ✅ **Manual Attendance Override**: Mark student attendance if needed
- ✅ **Subject Management**: Create and manage course subjects

### **Administrators**
- ✅ **User Management**: Create accounts and assign roles
- ✅ **Student Record Sync**: Maintain consistency between user roles and student records
- ✅ **System Oversight**: All teacher permissions plus user administration
- ✅ **Password Reset**: Manage user account security
- ✅ **Data Management**: Full access to all system features

## 🚀 **Key Features**

### **Attendance System**
- **School Days Only**: Attendance tracking limited to Monday-Friday
- **Default Absent**: Students must actively check in to be marked present
- **Daily Reset**: Fresh attendance each school day
- **Real-time Updates**: Teachers see attendance changes instantly
- **Self-Service**: Students manage their own attendance via header button

### **Task Management**
- **Visual Status Tracking**: Color-coded task cards (Blue=Working, Red=Need Help, Yellow=Ready for Review, Green=Completed)
- **Subject Organization**: Tasks organized by academic subjects
- **Optimistic Updates**: Instant UI feedback with error rollback
- **Real-time Collaboration**: Multiple users see changes simultaneously
- **Progress Analytics**: Summary cards showing task distribution

### **Technical Excellence**
- **React Query**: Optimistic updates with automatic error handling
- **Supabase Real-time**: Live database subscriptions for instant updates
- **TypeScript**: Full type safety and developer experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Production-Ready**: Comprehensive error handling and loading states

## 🛠 **Technology Stack**

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **State Management**: React Query (TanStack Query)
- **Real-time**: Supabase Subscriptions
- **Authentication**: Supabase Auth
- **Deployment**: Lovable Platform

## 📋 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account and project

### **Installation**

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd middle-school-track

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase project URL and anon key

# Start development server
npm run dev
```

### **Environment Setup**

Create a `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏗 **Database Schema**

### **Core Tables**
- **profiles**: User information and metadata
- **user_roles**: Role assignments (admin, teacher, student)
- **students**: Student-specific information linked to profiles
- **subjects**: Academic subjects/courses
- **tasks**: Learning assignments with status tracking
- **attendance**: Daily attendance records with timestamps

### **Key Relationships**
- Users can have multiple roles
- Students are linked to profiles via foreign key
- Tasks belong to students and subjects
- Attendance is tracked per student per day

## 📱 **User Interface**

### **Student View**
- Clean, minimal dashboard focused on learning
- Header with check-in button and user info
- Task cards organized by subject
- Progress summary with visual indicators

### **Teacher/Admin View**
- Sidebar navigation for different sections
- Fleet board with comprehensive student overview
- Task management and assignment tools
- User administration (admin only)

## 🔐 **Security Features**

- **Row Level Security (RLS)**: Database-level access control
- **Role-based Permissions**: Users only see appropriate data
- **Authentication Required**: All routes protected
- **Input Validation**: Type-safe data handling
- **Audit Trail**: Attendance and task changes tracked with timestamps

## 📊 **Real-time Features**

- **Live Attendance Updates**: Teachers see check-ins immediately
- **Task Status Changes**: Progress updates across all connected users
- **Optimistic UI**: Instant feedback with error recovery
- **Auto-sync**: No manual refresh needed

## 🎨 **Design Philosophy**

- **Student-Centered**: Simple, distraction-free interface for students
- **Teacher-Efficient**: Comprehensive oversight tools without complexity
- **Mobile-First**: Responsive design for various devices
- **Accessible**: Clear visual indicators and intuitive navigation

## 🚀 **Deployment**

This application is optimized for deployment on the Lovable platform:

1. Push changes to your repository
2. Open your Lovable project dashboard
3. Click "Share" → "Publish"
4. Your app will be live with automatic SSL and CDN

## 📞 **Support**

For technical support or feature requests, please:
1. Check the existing documentation
2. Review the codebase for examples
3. Contact your system administrator

## 🔄 **Development Workflow**

- **Real-time Collaboration**: Multiple developers can work simultaneously
- **Type Safety**: TypeScript catches errors at compile time
- **Hot Reload**: Instant preview of changes during development
- **Production Builds**: Optimized bundles for deployment

---

**Built with ❤️ for middle school education - Empowering teachers and engaging students through technology.**
