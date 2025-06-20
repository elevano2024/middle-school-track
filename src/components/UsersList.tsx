
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  user_roles?: { role: 'admin' | 'teacher' | 'student' }[];
}

interface UsersListProps {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
}

export const UsersList: React.FC<UsersListProps> = ({ profiles, loading, error }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Loading users..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users ({profiles.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {profiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No users found</p>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{profile.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {profile.user_roles && profile.user_roles.length > 0 ? (
                    profile.user_roles.map((userRole, index) => (
                      <Badge key={index} variant="secondary">
                        {userRole.role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">No role assigned</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
