import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface BoardTemplate {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  maxParticipants: number | null
  enabledActivities: string[] | null
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateInput {
  name: string
  description?: string | null
  coverImage?: string | null
  maxParticipants?: number | null
  enabledActivities?: string[] | null
  fromBoardId?: string
}

export interface UpdateTemplateInput {
  name?: string
  description?: string | null
  coverImage?: string | null
  maxParticipants?: number | null
  enabledActivities?: string[] | null
}

export function useTemplates() {
  const [templates, setTemplates] = useState<BoardTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.get<BoardTemplate[]>('/api/templates')
      setTemplates(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const createTemplate = async (input: CreateTemplateInput) => {
    const tpl = await api.post<BoardTemplate>('/api/templates', input)
    setTemplates((prev) => [tpl, ...prev])
    return tpl
  }

  const updateTemplate = async (id: string, input: UpdateTemplateInput) => {
    const tpl = await api.patch<BoardTemplate>(`/api/templates/${id}`, input)
    setTemplates((prev) => prev.map((t) => (t.id === id ? tpl : t)))
    return tpl
  }

  const deleteTemplate = async (id: string) => {
    await api.delete<void>(`/api/templates/${id}`)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  return { templates, isLoading, error, createTemplate, updateTemplate, deleteTemplate, refetch: fetchTemplates }
}
