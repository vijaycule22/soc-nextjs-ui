"use client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api-client"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Pencil, Plus, Search, Filter, ArrowUpDown } from "lucide-react"
import { useEffect, useState } from "react"
import type { Organization } from "../../../types/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Layers, ChevronRight, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function OrganizationsPage() {
  const { toast } = useToast()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "organization_name",
    direction: "asc",
  })

  const [nameError, setNameError] = useState({ show: false, message: "" })
  const [slugError, setSlugError] = useState({ show: false, message: "" })
  const [timezoneError, setTimezoneError] = useState({ show: false, message: "" })
  const [form, setForm] = useState<Omit<Organization, "organization_id" | "create_date_time" | "update_date_time">>({
    organization_name: "",
    slug: "",
    id: 0,
    description: "",
    timezone: "",
    is_active: true,
    created_by: "",
  })

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Kolkata",
    "Asia/Tokyo",
    "Australia/Sydney",
  ]

  const userId = localStorage.getItem("userId") || ""

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const response = await api.get<Organization[]>(`/organizations/organizations`)

      if (response.ok) {
        setOrgs(response.data)
      } else {
        throw new Error("Failed to fetch organizations")
      }
    } catch (error) {
      console.error("Error fetching organizations:", error)
      toast({
        title: "Error",
        description: "Failed to load organizations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createOrganization = async (
    newOrg: Omit<Organization, "organization_id" | "create_date_time" | "update_date_time">,
  ) => {
    try {
      const response = await api.post<Organization>("/organizations/organizations", newOrg)

      if (response.ok) {
        toast({
          title: "Success",
          description: "Organization created successfully.",
          variant: "success",
        })
        fetchOrganizations() // Refresh the list
        setShowModal(false) // Ensure dialog closes
      } else {
        throw new Error("Failed to create organization")
      }
    } catch (error) {
      console.error("Error creating organization:", error)
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      })
      // Don't close dialog on error so user can try again
    }
  }

  const updateOrganization = async (updatedOrg: Organization) => {
    try {
      const response = await api.put<Organization>(
        `/organizations/organizations/${updatedOrg.id}`,
        updatedOrg,
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Organization updated successfully.",
          variant: "success",
        })
        fetchOrganizations() // Refresh the list
        setShowModal(false) // Ensure dialog closes
      } else {
        throw new Error("Failed to update organization")
      }
    } catch (error) {
      console.error("Error updating organization:", error)
      toast({
        title: "Error",
        description: "Failed to update organization. Please try again.",
        variant: "destructive",
      })
      // Don't close dialog on error so user can try again
    }
  }

  const openModal = (org?: Organization) => {
    if (org) {
      setEditingOrg(org)
      setForm({
        organization_name: org.organization_name,
        slug: org.slug,
        id: org.id,
        description: org.description,
        timezone: org.timezone,
        is_active: org.is_active,
        created_by: userId,
      })
    } else {
      setEditingOrg(null)
      setForm({
        organization_name: "",
        slug: "",
        id: 0,
        description: "",
        timezone: "",
        is_active: true,
        created_by: userId,
      })
    }
    setShowModal(true)
  }

  const clearErrors = () => {
    setNameError({ show: false, message: "" })
    setSlugError({ show: false, message: "" })
    setTimezoneError({ show: false, message: "" })
  }

  const validateForm = () => {
    clearErrors()
    if (!form.organization_name) {
      setNameError({ show: true, message: "Organization Name is Required" })
      return false
    }
    if (form.organization_name.length < 3) {
      setNameError({ show: true, message: "Organization Name should be at least 3 characters" })
      return false
    }
    if (form.organization_name.length > 50) {
      setNameError({ show: true, message: "Organization Name should be at most 50 characters" })
      return false
    }
    if (form.organization_name.match(/[^a-zA-Z0-9 ]/)) {
      setNameError({ show: true, message: "Organization Name should only contain alphanumeric characters and spaces" })
      return false
    }

    if (!form.slug) {
      setSlugError({ show: true, message: "Slug is Required" })
      return false
    }
    if (form.slug.length < 3) {
      setSlugError({ show: true, message: "Slug should be at least 3 characters" })
      return false
    }
    if (form.slug.length > 50) {
      setSlugError({ show: true, message: "Slug should be at most 50 characters" })
      return false
    }
    if (form.timezone === "") {
      setTimezoneError({ show: true, message: "Timezone is Required" })
      return false
    }
    clearErrors()
    return true
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    if (editingOrg) {
      // Update
      updateOrganization({
        ...editingOrg,
        ...form,
        update_date_time: new Date().toISOString(),
      })
    } else {
      // Create
      const newOrg = {
        ...form,
        create_date_time: new Date().toISOString(),
        update_date_time: new Date().toISOString(),
      }
      createOrganization(newOrg)
    }

    setShowModal(false)
  }

  // Sort function
  const sortData = (column: string) => {
    const newDirection = sortConfig.column === column && sortConfig.direction === "asc" ? "desc" : "asc"
    setSortConfig({ column, direction: newDirection })
  }

  // Filter and sort organizations
  const filteredAndSortedOrgs = orgs
    .filter(
      (org) =>
        org.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const column = sortConfig.column as keyof Organization
      const direction = sortConfig.direction === "asc" ? 1 : -1

      if (typeof a[column] === "string" && typeof b[column] === "string") {
        return direction * (a[column] as string).localeCompare(b[column] as string)
      }

      // For non-string comparisons
      if (a[column] < b[column]) return -1 * direction
      if (a[column] > b[column]) return 1 * direction
      return 0
    })

  return (
    <div className="space-y-6 mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#1e74bb] to-[#4a9eda] text-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white text-[#1e74bb] hover:bg-gray-100">Admin Level</Badge>
              <Badge className="bg-[#0d4c7a] text-white">Organizations</Badge>
            </div>
            <h1 className="text-2xl font-bold mb-1">Organizations</h1>
            <p className="text-gray-100">Manage your learning platform organizations</p>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button onClick={() => openModal()} className="bg-white text-[#1e74bb] hover:bg-gray-100">
                <Plus className="mr-2 h-4 w-4" />
                Add Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{editingOrg ? "Edit Organization" : "Add Organization"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="organization_name">
                    Organization Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="organization_name"
                    value={form.organization_name}
                    onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                    placeholder="Enter organization name"
                    className={nameError.show ? "border-red-500" : ""}
                  />
                  {nameError.show && <p className="text-red-500 text-sm">{nameError.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slug">
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="Enter slug (e.g., my-organization)"
                    className={slugError.show ? "border-red-500" : ""}
                  />
                  {slugError.show && <p className="text-red-500 text-sm">{slugError.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter organization description"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="timezone">
                    Timezone <span className="text-red-500">*</span>
                  </Label>
                  <Select value={form.timezone} onValueChange={(value) => setForm({ ...form, timezone: value })}>
                    <SelectTrigger className={timezoneError.show ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {timezoneError.show && <p className="text-red-500 text-sm">{timezoneError.message}</p>}
                </div>



                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                    id="is_active"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="bg-[#1e74bb] hover:bg-[#1a65a3]">
                  {editingOrg ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="bg-white p-3 rounded-lg shadow-sm border border-gray-200" aria-label="Breadcrumb">
        <ol className="flex items-center flex-wrap">
          <li className="inline-flex items-center">
            <Link
              href="/admin"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-[#1e74bb] transition-colors"
            >
              <Layers className="w-4 h-4 mr-2 text-[#1e74bb]" />
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center mx-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <span className="text-sm font-medium text-[#1e74bb] flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Organizations
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <Card>
        <CardHeader className="pb-3">
          {/* <CardTitle>All Organizations</CardTitle>
          <CardDescription>Manage your learning platform organizations</CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search organizations..."
                className="pl-8 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="bg-white">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="rounded-md border bg-white overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]" onClick={() => sortData("organization_id")}>
                      <div className="flex items-center cursor-pointer">
                        ID
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => sortData("organization_name")}>
                      <div className="flex items-center cursor-pointer">
                        Name
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => sortData("slug")}>
                      <div className="flex items-center cursor-pointer">
                        Slug
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrgs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {searchQuery ? "No organizations match your search" : "No organizations found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedOrgs.map((org) => (
                      <TableRow key={org.id} className="group hover:bg-gray-50">
                        <TableCell>{org.id}</TableCell>
                        <TableCell className="font-medium">{org.organization_name}</TableCell>
                        <TableCell>{org.slug}</TableCell>
                        <TableCell className="max-w-xs truncate">{org.description}</TableCell>
                        <TableCell>{org.timezone}</TableCell>
                        <TableCell>
                          <Badge variant={org.is_active ? "success" : "secondary"}>
                            {org.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(org.create_date_time).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal(org)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {!loading && filteredAndSortedOrgs.length > 0 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
              <div>
                Showing <span className="font-medium">{filteredAndSortedOrgs.length}</span> of{" "}
                <span className="font-medium">{orgs.length}</span> organizations
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
