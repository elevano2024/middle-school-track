import React from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useUserManagement } from '@/hooks/useUserManagement';
import { CreateUserForm } from '@/components/CreateUserForm';
import { RoleAssignmentForm } from '@/components/RoleAssignmentForm';
import { PasswordResetForm } from '@/components/PasswordResetForm';
import { UsersList } from '@/components/UsersList';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';

const UserManagement = () => {
  const { isAdmin } = useUserRole();
  const {
    profiles,
    loading,
    error,
    assignRole,
    removeRole,
    resetUserPassword,
    createNewUser,
    syncStudentRecords,
    deleteUser
  } = useUserManagement();

  const handleSyncStudents = async () => {
    await syncStudentRecords();
  };

  return (
    <PermissionGuard 
      requiredRoles={['admin', 'teacher']}
      fallbackMessage="You don't have permission to access user management. Please contact an administrator if you believe this is an error."
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
          </div>
          {isAdmin && (
            <Button onClick={handleSyncStudents} variant="outline">
              Sync Student Records
            </Button>
          )}
        </div>

        <UsersList 
          profiles={profiles} 
          loading={loading} 
          error={error}
          onAssignRole={assignRole}
          onRemoveRole={removeRole}
          onResetPassword={resetUserPassword}
          onDeleteUser={isAdmin ? deleteUser : undefined}
        />

        {isAdmin && (
          <>
            <CreateUserForm onCreateUser={createNewUser} />
            <RoleAssignmentForm profiles={profiles} onAssignRole={assignRole} />
            <PasswordResetForm onResetPassword={resetUserPassword} profiles={profiles} />
          </>
        )}
      </div>
    </PermissionGuard>
  );
};

export default UserManagement;
