"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AdvancePayable {
  id: number
  project_id: number
  project_name?: string
  vendor_id?: number
  vendor_name?: string
  constructor_id?: number
  constructor_name?: string
  amount?: number
  payment_date?: string
  is_active: boolean
}

interface Project {
  id: number
  project_name: string
}

interface Vendor {
  id: number
  vendor_name: string
}

interface Constructor {
  id: number
  constructor_name: string
}

export default function AdvancePayablePage() {
  const [advancePayables, setAdvancePayables] = useState<AdvancePayable[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [constructors, setConstructors] = useState<Constructor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, vendorsRes, constructorsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/vendors"),
        fetch("/api/constructors"),
      ])

      const [projectsData, vendorsData, constructorsData] = await Promise.all([
        projectsRes.json(),
        vendorsRes.json(),
        constructorsRes.json(),
      ])

      setProjects(projectsData.projects || [])
      setVendors(vendorsData.vendors || [])
      setConstructors(constructorsData.constructors || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Advance/Payable</h1>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This module is under development. The API endpoints and
          functionality will be added soon. This page manages advance payments and payables
          to vendors and constructors for different projects.
        </p>
      </div>

      <div className="mb-4">
        <Label>Filter by Project</Label>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SL No.</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Vendor/Constructor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Is Active</TableHead>
                <TableHead>Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No advance/payable records found. This feature will be available soon.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Record advance payments to vendors and constructors</li>
          <li>Track payables by project</li>
          <li>Payment history and reconciliation</li>
          <li>Auto-calculation of outstanding balances</li>
          <li>Payment reminders and notifications</li>
        </ul>
      </div>
    </div>
  )
}
