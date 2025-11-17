'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { apiFetch } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface SpecialDeal {
  id: number
  title: string
}

interface Category {
  id: number
  name: string
  code: string
}

interface HomeSection {
  id: number
  sectionType: string
  title: string
  description: string
  displayOrder: number
  isActive: boolean
  config: Record<string, any>
}

interface HomeSectionModalProps {
  isOpen: boolean
  onClose: () => void
  section: HomeSection | null
  onSuccess: () => void
}

const sectionTypes = [
  { value: 'BANNER', label: '배너' },
  { value: 'SPECIAL_DEAL', label: '특가' },
  { value: 'MD_PICK', label: 'MD 추천' },
  { value: 'RANKING', label: '인기 랭킹' },
  { value: 'NEW_ARRIVAL', label: '신상품' },
  { value: 'CATEGORY', label: '카테고리' },
  { value: 'CUSTOM', label: '커스텀' },
]

export function HomeSectionModal({ isOpen, onClose, section, onSuccess }: HomeSectionModalProps) {
  const [formData, setFormData] = useState({
    sectionType: 'BANNER',
    title: '',
    description: '',
    isActive: true,
    config: {} as Record<string, any>,
  })
  const [loading, setLoading] = useState(false)
  const [specialDeals, setSpecialDeals] = useState<SpecialDeal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const { toast } = useToast()

  // Fetch special deals and categories on mount
  useEffect(() => {
    fetchSpecialDeals()
    fetchCategories()
  }, [])

  const fetchSpecialDeals = async () => {
    try {
      const data = await apiFetch<SpecialDeal[]>('/api/admin/special-deals', { auth: true })
      setSpecialDeals(data || [])
    } catch (error) {
      console.error('Error fetching special deals:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await apiFetch<Category[]>('/api/categories', { auth: false })
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  useEffect(() => {
    if (section) {
      setFormData({
        sectionType: section.sectionType,
        title: section.title,
        description: section.description || '',
        isActive: section.isActive,
        config: section.config || {},
      })
    } else {
      setFormData({
        sectionType: 'BANNER',
        title: '',
        description: '',
        isActive: true,
        config: {},
      })
    }
  }, [section])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = section
        ? `/api/admin/home-sections/${section.id}`
        : '/api/admin/home-sections'

      const method = section ? 'PUT' : 'POST'

      await apiFetch(url, {
        auth: true,
        method,
        body: JSON.stringify({
          ...formData,
          config: formData.config || {},
        }),
      })

      toast({
        title: '성공',
        description: section ? '섹션이 수정되었습니다.' : '섹션이 추가되었습니다.',
      })

      onSuccess()
    } catch (error) {
      console.error('Error saving section:', error)
      toast({
        title: '오류',
        description: '섹션 저장에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }))
  }

  // Render section-specific config fields
  const renderConfigFields = () => {
    switch (formData.sectionType) {
      case 'BANNER':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="autoPlay">자동 재생</Label>
              <Switch
                id="autoPlay"
                checked={formData.config.autoPlay !== false}
                onCheckedChange={(checked) => handleConfigChange('autoPlay', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interval">간격 (ms)</Label>
              <Input
                id="interval"
                type="number"
                value={formData.config.interval || 5000}
                onChange={(e) => handleConfigChange('interval', parseInt(e.target.value))}
              />
            </div>
          </>
        )
      case 'SPECIAL_DEAL':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="specialDealId">특가 선택</Label>
              <Select
                value={formData.config.specialDealId?.toString() || ''}
                onValueChange={(value) => handleConfigChange('specialDealId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="특가를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {specialDeals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id.toString()}>
                      {deal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                특정 특가를 선택하지 않으면 모든 활성 특가가 표시됩니다
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxProducts">최대 표시 상품 수</Label>
              <Input
                id="maxProducts"
                type="number"
                min="1"
                max="20"
                value={formData.config.maxProducts || 10}
                onChange={(e) => handleConfigChange('maxProducts', parseInt(e.target.value))}
              />
            </div>
          </>
        )
      case 'CATEGORY':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 선택</Label>
              <Select
                value={formData.config.category || ''}
                onValueChange={(value) => handleConfigChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.code} value={cat.code}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                선택한 카테고리: {categories.find(c => c.code === formData.config.category)?.name || '없음'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">표시 상품 수</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="20"
                value={formData.config.limit || 10}
                onChange={(e) => handleConfigChange('limit', parseInt(e.target.value))}
              />
            </div>
          </>
        )
      case 'MD_PICK':
      case 'RANKING':
      case 'NEW_ARRIVAL':
        return (
          <div className="space-y-2">
            <Label htmlFor="limit">표시 상품 수</Label>
            <Input
              id="limit"
              type="number"
              min="1"
              max="20"
              value={formData.config.limit || 10}
              onChange={(e) => handleConfigChange('limit', parseInt(e.target.value))}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{section ? '섹션 수정' : '섹션 추가'}</DialogTitle>
          <DialogDescription>
            홈 화면에 표시될 섹션을 {section ? '수정' : '추가'}합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section Type */}
          <div className="space-y-2">
            <Label htmlFor="sectionType">섹션 타입</Label>
            <Select
              value={formData.sectionType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, sectionType: value, config: {} }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sectionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              placeholder="섹션 제목"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="섹션 설명"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Active */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">활성화</Label>
          </div>

          {/* Section-specific config */}
          {renderConfigFields()}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : section ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
