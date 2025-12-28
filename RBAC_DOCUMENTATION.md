# Role-Based Access Control (RBAC) System

This project includes a comprehensive Role-Based Access Control system for managing user permissions.

## Features

- **Role Management**: Create, edit, and delete roles
- **Permission Management**: Granular permissions for each module
- **Employee Role Assignment**: Assign roles to employees
- **Permission Checking**: Middleware and hooks for checking permissions
- **Audit Logging**: Track all permission changes

## Database Schema

The RBAC system adds the following tables:

1. **roles**: Store all available roles
2. **modules**: Store all system modules/features
3. **permissions**: Store granular permissions (show, create, edit, delete, etc.)
4. **role_permissions**: Map roles to module permissions
5. **role_permission_audit_log**: Track permission changes

## Installation

1. Run the migration script:
```bash
npx tsx scripts/run-rbac-migration.ts
```

2. The migration will:
   - Create all necessary tables
   - Insert default modules (40+ modules)
   - Insert default permissions (9 permission types)
   - Create 7 default roles (Admin, Manager, Accountant, Sales Executive, Purchase Officer, HR Manager, Viewer)
   - Configure default permissions for each role
   - Update existing tables (employees, users) with role_id

## Default Roles

### Admin
- Full system access with all permissions

### Manager
- All permissions except permanently delete

### Accountant
- Full access to accounting modules (ledgers, vouchers, reports)

### Sales Executive
- Access to CRM, customers, sales, products, projects

### Purchase Officer
- Access to vendors, purchase, products, advance payables, constructors

### HR Manager
- Access to employees, users, role manager

### Viewer
- Read-only access to most modules

## Usage

### Access the Role Manager

Navigate to `/dashboard/role-manager` to:
- View all roles
- Create new roles
- Edit existing roles
- Manage permissions for each role
- See which users/employees are assigned to each role

### Assign Roles to Employees

In the Employee Management page (`/dashboard/employees`):
- When creating or editing an employee, select their role
- The role determines what permissions the employee has

### Check Permissions in Code

#### Server-side (API Routes)
```typescript
import { hasPermission } from "@/lib/permissions"

// Check if user has permission
const canEdit = await hasPermission(userId, "employees", "edit")

if (!canEdit) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
```

#### Client-side (React Components)
```typescript
import { usePermissions } from "@/lib/providers/permission-provider"

function MyComponent() {
  const { hasPermission, canAccess } = usePermissions()
  
  if (!canAccess("employees")) {
    return <div>Access Denied</div>
  }
  
  return (
    <div>
      {hasPermission("employees", "create") && (
        <Button>Create Employee</Button>
      )}
    </div>
  )
}
```

### Middleware

The system includes permission-checking middleware that:
- Protects API routes based on HTTP method (GET = show, POST = create, etc.)
- Protects dashboard routes based on module access
- Redirects unauthorized users

## Permission Types

The system includes 9 permission types:

1. **module_show**: Can access the module
2. **show**: Can view records
3. **create**: Can create new records
4. **edit**: Can edit existing records
5. **delete**: Can soft delete records
6. **pdf**: Can generate PDF exports
7. **trash_show**: Can view deleted records
8. **restore**: Can restore deleted records
9. **permanently_delete**: Can permanently delete records

## API Endpoints

### Roles
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create new role
- `PUT /api/roles` - Update role
- `DELETE /api/roles?id=X` - Delete role

### Permissions
- `GET /api/roles/permissions?roleId=X` - Get permissions for a role
- `POST /api/roles/permissions` - Update single permission
- `PUT /api/roles/permissions` - Bulk update permissions

### Modules
- `GET /api/modules` - List all modules
- `POST /api/modules` - Create new module

### User Permissions
- `GET /api/user/permissions` - Get current user's permissions

## Adding New Modules

To add a new module to the system:

1. Insert into the modules table:
```sql
INSERT INTO modules (module_name, display_name, description, sort_order)
VALUES ('my_module', 'My Module', 'Description', 100);
```

2. Update the middleware to protect the route (if needed):
```typescript
// In middleware-permissions.ts
const apiPermissions = {
  "/api/my-module": { module: "my_module", permission: "show" },
  // ...
}
```

3. Use permission checks in your components and API routes

## Security Notes

- All permission changes are logged in the audit table
- Roles cannot be deleted if they're assigned to users/employees
- The Admin role has full access by default
- Middleware automatically checks permissions on API and dashboard routes

## Troubleshooting

### Migration fails
- Check DATABASE_URL in .env.local
- Ensure database is accessible
- Check for conflicting table/column names

### Permissions not working
- Ensure user has a role assigned
- Check role permissions in the Role Manager
- Clear browser cache and reload

### Can't access Role Manager
- Ensure your user has the Admin or HR Manager role
- Check middleware configuration
