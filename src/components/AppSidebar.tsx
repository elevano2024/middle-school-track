import React from 'react';
import { Home, Users, LogOut, Settings, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const items = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Attendance', url: '/attendance', icon: UserCheck, teacherOnly: true },
  { title: 'Manage Tasks', url: '/settings', icon: Settings, teacherOnly: true },
  { title: 'User Management', url: '/users', icon: Users, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();

  const isCollapsed = state === 'collapsed';
  const { toggleSidebar } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
  };

  // Only filter items if we have role data loaded
  const filteredItems = items.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.teacherOnly && !isTeacher && !isAdmin) return false;
    return true;
  });

  return (
    <Sidebar className="bg-white border-r border-blue-100 shadow-sm" collapsible="icon">
      <SidebarHeader className={`border-b border-blue-100 ${isCollapsed ? 'p-2' : 'p-4'} relative`}>
        {/* Toggle Button - positioned on the right edge */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 bg-white border border-blue-200 rounded-full shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-blue-600" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-blue-600" />
          )}
        </Button>

        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
              <img 
                src="https://risingsunmontessori.org/wp-content/uploads/2022/02/logo-e1709591143216.jpg" 
                alt="Rising Sun Montessori School Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">ARCC</h2>
              <p className="text-xs text-blue-600 font-medium">Student Progress Tracker</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
              <img 
                src="https://risingsunmontessori.org/wp-content/uploads/2022/02/logo-e1709591143216.jpg" 
                alt="Rising Sun Montessori School Logo"
                className="w-5 h-5 object-contain"
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    to={item.url} 
                    end 
                    className={({ isActive }) =>
                      `sidebar-nav-link ${isActive ? 'active' : ''} flex items-center transition-all duration-200 ${
                        isCollapsed 
                          ? 'justify-center p-2 m-1 aspect-square rounded-lg' 
                          : 'gap-3 px-3 py-2.5 mx-2 rounded-lg'
                      } text-sm font-medium ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md' 
                          : 'hover:bg-blue-50'
                      }`
                    }
                    title={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className={`${isCollapsed ? 'h-4 w-4' : 'h-4 w-4'} flex-shrink-0`} />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-blue-100 ${isCollapsed ? 'p-1' : 'p-4'}`}>
        {!isCollapsed && user && (
          <div className="space-y-3">
            <div className="text-xs text-blue-600 bg-blue-50 rounded-lg p-3">
              <p className="font-medium truncate">
                {user.email?.split('@')[0]}
              </p>
              <p className="text-blue-500 mt-1">
                {isAdmin ? 'Administrator' : 'Teacher'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="text-blue-700 hover:bg-blue-50 p-2 rounded-lg"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
