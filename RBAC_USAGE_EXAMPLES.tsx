// @ts-nocheck
// ============================================
// RBAC System Usage Examples
// ============================================

// ============================================
// 1. SERVER-SIDE USAGE (API Routes)
// ============================================

import { hasPermission, getUserPermissions } from "@/lib/permissions"
import { getCurrentUser } from "@/lib/auth"
import { NextResponse } from "next/server"

// Example: Check single permission in API route
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user can create employees
  const canCreate = await hasPermission(user.id, "employees", "create")
  
  if (!canCreate) {
    return NextResponse.json(
      { error: "You don't have permission to create employees" },
      { status: 403 }
    )
  }

  // Proceed with creating employee
  // ...
}

// Example: Get all permissions for a user
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const permissions = await getUserPermissions(user.id)
  
  // permissions = {
  //   employees: { show: true, create: true, edit: true, ... },
  //   customers: { show: true, create: false, ... },
  //   ...
  // }
  
  return NextResponse.json({ permissions })
}

// ============================================
// 2. CLIENT-SIDE USAGE (React Components)
// ============================================

"use client"

import { usePermission } from "@/hooks/use-permission"
import { PermissionGate, ModuleGate } from "@/components/permission-gate"
import { Button } from "@/components/ui/button"

// Example: Using the usePermission hook
function EmployeeManagement() {
  const { 
    canView, 
    canCreate, 
    canEdit, 
    canDelete,
    loading 
  } = usePermission()
  
  if (loading) {
    return <div>Loading permissions...</div>
  }
  
  if (!canView("employees")) {
    return <div>Access Denied</div>
  }
  
  return (
    <div>
      <h1>Employees</h1>
      
      {canCreate("employees") && (
        <Button>Create New Employee</Button>
      )}
      
      {/* Employee list */}
      <table>
        <tbody>
          <tr>
            <td>John Doe</td>
            <td>
              {canEdit("employees") && (
                <Button>Edit</Button>
              )}
              {canDelete("employees") && (
                <Button variant="destructive">Delete</Button>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// Example: Using PermissionGate component
function ProductPage() {
  return (
    <div>
      <h1>Products</h1>
      
      {/* Only show this button if user can create products */}
      <PermissionGate module="products" permission="create">
        <Button>Add New Product</Button>
      </PermissionGate>
      
      {/* Show fallback message if user can't edit */}
      <PermissionGate 
        module="products" 
        permission="edit"
        fallback={<p>You cannot edit products</p>}
      >
        <Button>Edit Product</Button>
      </PermissionGate>
    </div>
  )
}

// Example: Using ModuleGate to hide entire sections
function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <ModuleGate module="employees">
        <div className="card">
          <h2>Employee Statistics</h2>
          {/* Employee stats */}
        </div>
      </ModuleGate>
      
      <ModuleGate module="sales">
        <div className="card">
          <h2>Sales Overview</h2>
          {/* Sales data */}
        </div>
      </ModuleGate>
    </div>
  )
}

// ============================================
// 3. PERMISSION TYPES
// ============================================

/*
Available permission types:

1. module_show       - Can access/view the module
2. show              - Can view/read records
3. create            - Can create new records
4. edit              - Can edit existing records
5. delete            - Can soft delete records
6. pdf               - Can generate PDF exports
7. trash_show        - Can view deleted/trash records
8. restore           - Can restore deleted records
9. permanently_delete - Can permanently delete records

Usage in code:
- hasPermission(userId, "employees", "show")
- hasPermission(userId, "sales", "create")
- hasPermission(userId, "customers", "edit")
- etc.
*/

// ============================================
// 4. ADVANCED USAGE
// ============================================

import { 
  hasAllPermissions, 
  hasAnyPermission,
  getAccessibleModules,
  getUserRole
} from "@/lib/permissions"

// Check multiple permissions (user must have ALL)
async function checkMultiplePermissions() {
  const user = await getCurrentUser()
  if (!user) return false
  
  const hasAll = await hasAllPermissions(user.id, [
    { module: "employees", permission: "edit" },
    { module: "employees", permission: "delete" },
  ])
  
  return hasAll
}

// Check if user has ANY of the specified permissions
async function checkAnyPermission() {
  const user = await getCurrentUser()
  if (!user) return false
  
  const hasAny = await hasAnyPermission(user.id, [
    { module: "sales", permission: "create" },
    { module: "purchase", permission: "create" },
  ])
  
  return hasAny
}

// Get all modules user can access
async function getUserModules() {
  const user = await getCurrentUser()
  if (!user) return []
  
  const modules = await getAccessibleModules(user.id)
  // Returns: ["employees", "customers", "sales", ...]
  
  return modules
}

// Get user's role information
async function getUserRoleInfo() {
  const user = await getCurrentUser()
  if (!user) return null
  
  const role = await getUserRole(user.id)
  // Returns: { id: 1, role_name: "Manager", description: "..." }
  
  return role
}

// ============================================
// 5. DYNAMIC NAVIGATION BASED ON PERMISSIONS
// ============================================

"use client"

import { usePermission } from "@/hooks/use-permission"
import Link from "next/link"

function DynamicSidebar() {
  const { canAccess, loading } = usePermission()
  
  if (loading) return <div>Loading...</div>
  
  const navItems = [
    { name: "Employees", module: "employees", path: "/employees" },
    { name: "Customers", module: "customers", path: "/customers" },
    { name: "Sales", module: "sales", path: "/sales-v2" },
    { name: "Purchase", module: "purchase", path: "/purchase/requisitions" },
    { name: "Finance", module: "finance", path: "/finance/types" },
  ]
  
  return (
    <nav>
      <ul>
        {navItems.map(item => (
          canAccess(item.module) && (
            <li key={item.module}>
              <Link href={item.path}>{item.name}</Link>
            </li>
          )
        ))}
      </ul>
    </nav>
  )
}

// ============================================
// 6. CONDITIONAL RENDERING PATTERNS
// ============================================

function ConditionalUI() {
  const { canCreate, canEdit, canDelete, canExportPDF } = usePermission()
  
  return (
    <div>
      {/* Pattern 1: Simple conditional */}
      {canCreate("products") && <Button>Create Product</Button>}
      
      {/* Pattern 2: Ternary operator */}
      {canEdit("products") 
        ? <Button>Edit</Button> 
        : <span>View Only</span>
      }
      
      {/* Pattern 3: Multiple conditions */}
      {(canEdit("products") || canDelete("products")) && (
        <div className="actions">
          {canEdit("products") && <Button>Edit</Button>}
          {canDelete("products") && <Button>Delete</Button>}
        </div>
      )}
      
      {/* Pattern 4: Using PermissionGate */}
      <PermissionGate module="products" permission="pdf">
        <Button onClick={() => exportToPDF()}>
          Export PDF
        </Button>
      </PermissionGate>
    </div>
  )
}
