'use client'

import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { SortableSection } from '@/components/admin/sortable-section'
import { HomeSectionModal } from '@/components/admin/home-section-modal'
import { useToast } from '@/hooks/use-toast'

interface HomeSection {
  id: number
  sectionType: string
  title: string
  description: string
  displayOrder: number
  isActive: boolean
  config: Record<string, any>
  createdAt: string
  updatedAt: string
}

export default function AdminHomePage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<HomeSection[]>('/api/admin/home-sections', { auth: true })
      setSections(data)
    } catch (error) {
      console.error('Error fetching sections:', error)
      toast({
        title: '오류',
        description: '섹션 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)

    const newSections = arrayMove(sections, oldIndex, newIndex)

    // Update display orders
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      displayOrder: index,
    }))

    // Optimistically update UI
    setSections(updatedSections)

    // Send to backend
    try {
      const reorderRequest = {
        items: updatedSections.map((section) => ({
          id: section.id,
          displayOrder: section.displayOrder,
        })),
      }

      const result = await apiFetch<HomeSection[]>('/api/admin/home-sections/reorder', {
        auth: true,
        method: 'PUT',
        body: JSON.stringify(reorderRequest),
      })

      // Update with server response to ensure consistency
      setSections(result)

      toast({
        title: '성공',
        description: '섹션 순서가 변경되었습니다.',
      })
    } catch (error) {
      console.error('Error reordering sections:', error)
      toast({
        title: '오류',
        description: '섹션 순서 변경에 실패했습니다.',
        variant: 'destructive',
      })
      // Revert on error
      fetchSections()
    }
  }

  const handleToggleActive = async (id: number) => {
    try {
      await apiFetch(`/api/admin/home-sections/${id}/toggle`, {
        auth: true,
        method: 'PUT',
      })

      setSections((prev) =>
        prev.map((section) =>
          section.id === id ? { ...section, isActive: !section.isActive } : section
        )
      )

      toast({
        title: '성공',
        description: '섹션 활성화 상태가 변경되었습니다.',
      })
    } catch (error) {
      console.error('Error toggling section:', error)
      toast({
        title: '오류',
        description: '섹션 상태 변경에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      await apiFetch(`/api/admin/home-sections/${id}`, {
        auth: true,
        method: 'DELETE',
      })

      setSections((prev) => prev.filter((section) => section.id !== id))

      toast({
        title: '성공',
        description: '섹션이 삭제되었습니다.',
      })
    } catch (error) {
      console.error('Error deleting section:', error)
      toast({
        title: '오류',
        description: '섹션 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (section: HomeSection) => {
    setEditingSection(section)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingSection(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingSection(null)
  }

  const handleSaveSuccess = () => {
    fetchSections()
    handleModalClose()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">홈 화면 관리</h1>
          <p className="text-muted-foreground mt-2">
            드래그하여 섹션 순서를 변경하고, 활성화 상태를 관리하세요
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          섹션 추가
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onToggleActive={handleToggleActive}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">등록된 섹션이 없습니다</p>
          <Button onClick={handleAdd} variant="outline">
            첫 번째 섹션 추가하기
          </Button>
        </div>
      )}

      <HomeSectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        section={editingSection}
        onSuccess={handleSaveSuccess}
      />
    </div>
  )
}
