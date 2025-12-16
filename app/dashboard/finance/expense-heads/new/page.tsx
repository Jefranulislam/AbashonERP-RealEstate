"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Info, Save, Folder, File } from "lucide-react"
import axios from "axios"

export default function NewExpenseHeadPage() {
  const router = useRouter()
  const [expenseHeads, setExpenseHeads] = useState<any[]>([])
  const [expenseTypes, setExpenseTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    headName: "",
    parentId: "",
    isGroup: false,
    type: "Dr",
    unit: "",
    incExpTypeId: "",
    accountCode: "",
    headType: "",
    accountCategory: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [headsRes, typesRes] = await Promise.all([
          axios.get("/api/finance/expense-heads"),
          axios.get("/api/initial-expense-heads")
        ])
        
        setExpenseHeads(headsRes.data.expenseHeads || [])
        setExpenseTypes(typesRes.data.expenseTypes || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.headName.trim()) {
      alert("Please enter account head name")
      return
    }

    try {
      await axios.post("/api/finance/expense-heads", {
        headName: formData.headName,
        parentId: formData.parentId || null,
        isGroup: formData.isGroup,
        type: formData.type,
        unit: formData.unit || null,
        incExpTypeId: formData.incExpTypeId || null
      })

      alert("Account head created successfully!")
      router.push("/dashboard/finance/expense-heads")
    } catch (error) {
      console.error("Error creating account head:", error)
      alert("Failed to create account head. Please try again.")
    }
  }

  const parentGroups = expenseHeads.filter(h => h.is_group)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Account Head</h1>
              <p className="text-sm text-muted-foreground">
                Add a new account group or ledger account to your chart of accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Account Head Types</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Group:</strong> A parent category that can contain sub-accounts (e.g., Construction Material, Labor Cost)</li>
              <li><strong>Ledger Account:</strong> An actual account for transactions (e.g., Steel, Sand, Mason Labor)</li>
              <li><strong>Hierarchy:</strong> You can nest accounts under groups for better organization</li>
              <li><strong>Full Path:</strong> The system will automatically generate the hierarchical path</li>
            </ul>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Type</CardTitle>
                  <CardDescription>Choose whether this is a group or a ledger account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <Checkbox
                      id="isGroup"
                      checked={formData.isGroup}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, isGroup: checked as boolean, unit: checked ? "" : formData.unit })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="isGroup" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                        {formData.isGroup ? (
                          <><Folder className="h-4 w-4 text-yellow-600" /> This is a Group/Category</>
                        ) : (
                          <><File className="h-4 w-4 text-blue-600" /> This is a Ledger Account</>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-2">
                        {formData.isGroup
                          ? "Groups are used to organize related accounts. They cannot have transactions directly posted to them."
                          : "Ledger accounts are used for actual transactions. They must be assigned to a group or be top-level accounts."
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Enter the account head details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="headName">
                        Account Head Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="headName"
                        placeholder={formData.isGroup ? "e.g., Construction Material, Labor Cost" : "e.g., Steel, Sand, Mason Labor"}
                        value={formData.headName}
                        onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                        required
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a clear, descriptive name for easy identification
                      </p>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="parentId">Parent Group</Label>
                      <Select
                        value={formData.parentId}
                        onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                      >
                        <SelectTrigger id="parentId">
                          <SelectValue placeholder="None (Top Level Account)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None (Top Level Account)</SelectItem>
                          {parentGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Folder className="h-3 w-3 text-yellow-600" />
                                {group.full_path || group.head_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a parent group to organize this account hierarchically
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="accountCode">Account Code</Label>
                      <Input
                        id="accountCode"
                        placeholder="e.g., 4001, 5001"
                        value={formData.accountCode}
                        onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional unique code for identification
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="type">
                        Debit/Credit <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dr">Debit (Dr) - Assets/Expenses</SelectItem>
                          <SelectItem value="Cr">Credit (Cr) - Liabilities/Income</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Normal balance type for this account
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>Optional classification and unit information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unit">Unit of Measurement</Label>
                      <Input
                        id="unit"
                        placeholder={formData.isGroup ? "Not applicable for groups" : "e.g., TON, CFT, BAG, PIECE, KG"}
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        disabled={formData.isGroup}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.isGroup 
                          ? "Groups don't have units of measurement"
                          : "Specify the unit for material/inventory tracking"
                        }
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="incExpTypeId">Expense Type</Label>
                      <Select
                        value={formData.incExpTypeId}
                        onValueChange={(value) => setFormData({ ...formData, incExpTypeId: value })}
                      >
                        <SelectTrigger id="incExpTypeId">
                          <SelectValue placeholder="Select expense type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {expenseTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional classification for reporting
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="headType">Head Type</Label>
                      <Input
                        id="headType"
                        placeholder="e.g., Direct Costs, Operating Expenses"
                        value={formData.headType}
                        onChange={(e) => setFormData({ ...formData, headType: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        For P&L statement grouping
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="accountCategory">Account Category</Label>
                      <Select
                        value={formData.accountCategory}
                        onValueChange={(value) => setFormData({ ...formData, accountCategory: value })}
                      >
                        <SelectTrigger id="accountCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="Current Assets">Current Assets</SelectItem>
                          <SelectItem value="Fixed Assets">Fixed Assets</SelectItem>
                          <SelectItem value="Current Liabilities">Current Liabilities</SelectItem>
                          <SelectItem value="Long-term Liabilities">Long-term Liabilities</SelectItem>
                          <SelectItem value="Equity">Equity</SelectItem>
                          <SelectItem value="Revenue">Revenue</SelectItem>
                          <SelectItem value="Expenses">Expenses</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        For Balance Sheet classification
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              {/* Preview Card */}
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>How this account will appear</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      {formData.isGroup ? (
                        <Folder className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <File className="h-5 w-5 text-blue-600" />
                      )}
                      <span className="font-semibold">
                        {formData.headName || "Account Name"}
                      </span>
                    </div>
                    {formData.parentId && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Parent: {parentGroups.find(g => g.id.toString() === formData.parentId)?.head_name || "None"}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {formData.type}
                      </span>
                      {formData.unit && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          {formData.unit}
                        </span>
                      )}
                      {formData.isGroup && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                          Group
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">
                        {formData.isGroup ? "Group/Category" : "Ledger Account"}
                      </span>
                    </div>
                    {formData.accountCode && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Code:</span>
                        <span className="font-medium">{formData.accountCode}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className="font-medium">{formData.type === "Dr" ? "Debit" : "Credit"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <Button type="submit" className="w-full" size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    Create Account Head
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p>• Use groups to organize related accounts</p>
                  <p>• Ledger accounts are for actual transactions</p>
                  <p>• Units are used for inventory tracking</p>
                  <p>• Account codes help with sorting and reports</p>
                  <p>• You can nest accounts up to any depth</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
