
import React from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useUserManagement } from '@/hooks/useUserManagement';
import { CreateUserForm } from '@/components/CreateUserForm';
import { RoleAssignmentForm } from '@/components/RoleAssignmentForm';
import { PasswordResetForm } from '@/components/PasswordResetForm';
import { UsersList } from '@/components/UsersList';
import { useUserRole } from '@/hooks/useUserRole';

const UserManagement = () => {
  const { isAdmin } = useUserRole();
  const {
    profiles,
    loading,
    error,
    assignRole,
    resetUserPassword,
    createNewUser
  } = useUserManagement();

  return (
    <PermissionGuard 
      requiredRoles={['admin', 'teacher']}
      fallbackMessage="You don't have permission to access user management. Please contact an administrator if you believe this is an error."
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>

        {isAdmin && (
          <>
            <CreateUserForm onCreateUser={createNewUser} />
            <RoleAssignmentForm profiles={profiles} onAssignRole={assignRole} />
            <PasswordResetForm onResetPassword={resetUserPassword} />
          </>
        )}

        <UsersList profiles={profiles} loading={loading} error={error} />
      </div>
    </PermissionGuard>
  );
};

export default UserManagement;
