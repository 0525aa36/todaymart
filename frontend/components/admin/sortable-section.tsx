'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { GripVertical, Edit, Trash2 } from 'lucide-react'

interface HomeSection {
  id: number
  sectionType: string
  title: string
  description: string
  displayOrder: number
  isActive: boolean
  config: Record<string, any>
}

interface SortableSectionProps {
  section: HomeSection
  onToggleActive: (id: number) => void
  onEdit: (section: HomeSection) => void
  onDelete: (id: number) => void
}

const sectionTypeLabels: Record<string, string> = {
  BANNER: '배너',
  SPECIAL_DEAL: '특가',
  MD_PICK: 'MD 추천',
  RANKING: '인기 랭킹',
  NEW_ARRIVAL: '신상품',
  CATEGORY: '카테고리',
  CUSTOM: '커스텀',
}

const sectionTypeColors: Record<string, string> = {
  BANNER: 'bg-blue-100 text-blue-800',
  SPECIAL_DEAL: 'bg-red-100 text-red-800',
  MD_PICK: 'bg-purple-100 text-purple-800',
  RANKING: 'bg-yellow-100 text-yellow-800',
  NEW_ARRIVAL: 'bg-green-100 text-green-800',
  CATEGORY: 'bg-gray-100 text-gray-800',
  CUSTOM: 'bg-pink-100 text-pink-800',
}

export function SortableSection({
  section,
  onToggleActive,
  onEdit,
  onDelete,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 ${isDragging ? 'shadow-2xl' : 'shadow-sm'}`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Section Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-1 rounded font-medium ${
                sectionTypeColors[section.sectionType] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {sectionTypeLabels[section.sectionType] || section.sectionType}
            </span>
            <span className="text-sm text-gray-500">#{section.displayOrder + 1}</span>
          </div>
          <h3 className="font-semibold text-lg">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}
          {section.sectionType === 'CATEGORY' && section.config?.category && (
            <p className="text-xs text-muted-foreground mt-1">
              카테고리: {section.config.category}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {section.isActive ? '활성' : '비활성'}
            </span>
            <Switch
              checked={section.isActive}
              onCheckedChange={() => onToggleActive(section.id)}
            />
          </div>

          {/* Edit Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(section)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(section.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
