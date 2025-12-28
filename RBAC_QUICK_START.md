# Role-Based Access Control (RBAC) - Quick Start Guide

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

Open your terminal and run:

```bash
npx tsx scripts/run-rbac-migration.ts
```

This will:
- Create all necessary database tables
- Insert 40+ default modules
- Create 7 default roles with pre-configured permissions
- Update existing tables with role support

### Step 2: Verify Installation

After the migration completes, you should see:
- ✅ 4 new tables created (roles, modules, permissions, role_permissions)
- ✅ 7 default roles inserted
- ✅ 40+ modules configured
- ✅ Thousands of permission mappings created

### Step 3: Access the Role Manager

1. Login to your ERP system
2. Navigate to **Dashboard > Employees > Role Manager**
3. You'll see all available roles and their permissions

## 📋 Default Roles Overview

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | System Administrator | Full access to everything |
| **Manager** | Management Level | All permissions except permanent delete |
| **Accountant** | Finance & Accounting | Full access to accounting modules |
| **Sales Executive** | Sales Team | Access to CRM, customers, sales, products |
| **Purchase Officer** | Procurement Team | Access to vendors, purchases, inventory |
| **HR Manager** | Human Resources | Access to employees, users, roles |
| **Viewer** | Read-Only User | View-only access to most modules |

## 🎯 Common Tasks

### Assign a Role to an Employee

1. Go to **Dashboard > Employees > Employee List**
2. Click "Add Employee" or edit existing employee
3. Select a role from the "Role" dropdown
4. Save the employee

### Create a New Custom Role

1. Go to **Dashboard > Employees > Role Manager**
2. Click "Add Role"
3. Enter role name and description
4. Click "Save"
5. Click "Permissions" button on the new role
6. Configure module access and permissions
7. Grant or revoke permissions as needed

### Modify Permissions for an Existing Role

1. Go to **Dashboard > Employees > Role Manager**
2. Find the role you want to modify
3. Click the "Permissions" button
4. Check/uncheck permissions for each module
5. Use "Grant All" or "Revoke All" for quick changes
6. Close the dialog (changes are saved automatically)

## 🔐 Using Permissions in Your Code

### In React Components

```tsx
import { usePermission } from "@/hooks/use-permission"

function MyComponent() {
  const { canCreate, canEdit, canDelete } = usePermission()
  
  return (
    <div>
      {canCreate("employees") && (
        <Button>Add Employee</Button>
      )}
    </div>
  )
}
```

### In API Routes

```typescript
import { hasPermission } from "@/lib/permissions"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  
  if (!await hasPermission(user.id, "employees", "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  // Proceed with the operation
}
```

### Using Permission Gates

```tsx
import { PermissionGate } from "@/components/permission-gate"

<PermissionGate module="products" permission="create">
  <Button>Create Product</Button>
</PermissionGate>
```

## 📊 Permission Types Reference

| Permission | Code | Description |
|------------|------|-------------|
| Module Access | `module_show` | Can view/access the module |
| View | `show` | Can view records |
| Create | `create` | Can create new records |
| Edit | `edit` | Can edit existing records |
| Delete | `delete` | Can soft delete records |
| PDF Export | `pdf` | Can generate PDF exports |
| View Trash | `trash_show` | Can view deleted records |
| Restore | `restore` | Can restore deleted records |
| Permanent Delete | `permanently_delete` | Can permanently delete |

## 🛠️ Troubleshooting

### "Migration failed" error
- Check that your `DATABASE_URL` is set in `.env.local`
- Ensure database is accessible
- Check database user has CREATE TABLE permissions

### Can't see Role Manager
- Ensure your user account has a role assigned
- Admin users should have full access by default
- Check that the admin user was updated in the migration

### Permissions not working
1. Clear browser cache and reload
2. Check if user has a role assigned
3. Verify role has the correct permissions in Role Manager
4. Check browser console for errors

### Employee can't access modules
1. Ensure employee has a role assigned
2. Check role permissions in Role Manager
3. Verify the module name matches exactly

## 📝 Adding New Modules

To add a new module to the permission system:

1. **Via UI** (Recommended for admins):
   - Contact a developer to add the module via SQL

2. **Via SQL**:
```sql
INSERT INTO modules (module_name, display_name, description, sort_order)
VALUES ('my_new_module', 'My New Module', 'Description here', 999);
```

3. **Update Code**:
   - Add permission checks in your API routes
   - Add permission gates in your UI components
   - Update middleware if needed

## 🎓 Best Practices

1. **Always assign roles to new employees** - Don't leave employees without roles
2. **Use descriptive role names** - Make it clear what each role does
3. **Review permissions regularly** - Ensure users have appropriate access
4. **Use least privilege principle** - Only grant necessary permissions
5. **Test permission changes** - Verify changes work as expected
6. **Document custom roles** - Keep track of custom role purposes
7. **Use audit logs** - Review permission changes in the audit log table

## 📚 Next Steps

- Read the full documentation: [RBAC_DOCUMENTATION.md](./RBAC_DOCUMENTATION.md)
- See usage examples: [RBAC_USAGE_EXAMPLES.tsx](./RBAC_USAGE_EXAMPLES.tsx)
- Explore the Role Manager UI
- Assign roles to your team members
- Customize permissions for your organization

## 🆘 Need Help?

If you encounter issues:
1. Check the logs in your terminal
2. Review the [RBAC_DOCUMENTATION.md](./RBAC_DOCUMENTATION.md)
3. Look at [RBAC_USAGE_EXAMPLES.tsx](./RBAC_USAGE_EXAMPLES.tsx)
4. Check the audit log table for permission changes

## 🎉 You're All Set!

Your RBAC system is now ready to use. Start by:
1. ✅ Logging in as admin
2. ✅ Visiting the Role Manager
3. ✅ Assigning roles to employees
4. ✅ Testing different permission levels
