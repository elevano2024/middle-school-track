
import React from 'react';
import { Home, Users, LogOut, Plus, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const items = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Manage Tasks', url: '/settings', icon: Settings, teacherOnly: true },
  { title: 'User Management', url: '/users', icon: Users, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const currentPath = location.pathname;

  const isCollapsed = state === 'collapsed';
  const canAccessUsers = isAdmin || isTeacher;

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50';

  const handleSignOut = async () => {
    await signOut();
  };

  const filteredItems = items.filter(item => {
    if (item.adminOnly && !canAccessUsers) return false;
    if (item.teacherOnly && !isTeacher && !isAdmin) return false;
    return true;
  });

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarHeader className="p-4">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-semibold text-blue-700">Montessori Tracker</h2>
            <p className="text-xs text-gray-500">Learning Journey Manager</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClassName}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!isCollapsed && user && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
        {isCollapsed && (
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
