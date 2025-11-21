import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

// Types
export interface ProjectLocation {
  id: number
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  locations: () => [...projectKeys.all, 'locations'] as const,
}

// ============================================
// PROJECT LOCATIONS HOOKS
// ============================================

// Fetch all project locations
export function useProjectLocations() {
  return useQuery({
    queryKey: projectKeys.locations(),
    queryFn: async () => {
      const { data } = await axios.get('/api/projects/locations')
      return data.locations as ProjectLocation[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

// Create a new project location
export function useCreateProjectLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; isActive: boolean }) => {
      const response = await axios.post('/api/projects/locations', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.locations() })
      toast.success('Location added successfully')
    },
    onError: (error: any) => {
      console.error('Error creating project location:', error)
      toast.error(error.response?.data?.error || 'Failed to add location')
    },
  })
}

// Update an existing project location
export function useUpdateProjectLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; isActive: boolean } }) => {
      const response = await axios.put(`/api/projects/locations/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.locations() })
      toast.success('Location updated successfully')
    },
    onError: (error: any) => {
      console.error('Error updating project location:', error)
      toast.error(error.response?.data?.error || 'Failed to update location')
    },
  })
}

// Delete a project location (soft delete)
export function useDeleteProjectLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/projects/locations/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.locations() })
      toast.success('Location deleted successfully')
    },
    onError: (error: any) => {
      console.error('Error deleting project location:', error)
      toast.error(error.response?.data?.error || 'Failed to delete location')
    },
  })
}
