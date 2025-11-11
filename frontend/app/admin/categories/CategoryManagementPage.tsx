'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Category {
  id: number;
  code: string;
  name: string;
  description: string;
  iconName: string;
  parentId: number | null;
  parentName: string | null;
  displayOrder: number;
  isVisible: boolean;
  isEvent: boolean;
  children: Category[];
}

interface CategoryForm {
  code: string;
  name: string;
  description: string;
  iconName: string;
  parentId: number | null;
  displayOrder: number;
  isVisible: boolean;
  isEvent: boolean;
}

export default function CategoryManagementPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState<CategoryForm>({
    code: '',
    name: '',
    description: '',
    iconName: '',
    parentId: null,
    displayOrder: 0,
    isVisible: true,
    isEvent: false,
  });

  const fetchCategories = async () => {
    try {
      const data = await apiFetch<Category[]>('/api/admin/categories', { auth: true });
      setCategories(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push('/login');
      }
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      iconName: '',
      parentId: null,
      displayOrder: 0,
      isVisible: true,
      isEvent: false,
    });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleCreate = async () => {
    try {
      await apiFetch('/api/admin/categories', {
        auth: true,
        method: 'POST',
        body: JSON.stringify(formData),
      });
      await fetchCategories();
      resetForm();
      alert('카테고리가 생성되었습니다.');
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('카테고리 생성에 실패했습니다.');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await apiFetch(`/api/admin/categories/${id}`, {
        auth: true,
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      await fetchCategories();
      resetForm();
      alert('카테고리가 수정되었습니다.');
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('카테고리 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await apiFetch(`/api/admin/categories/${id}`, {
        auth: true,
        method: 'DELETE',
      });
      await fetchCategories();
      alert('카테고리가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('카테고리 삭제에 실패했습니다. 하위 카테고리가 있으면 삭제할 수 없습니다.');
    }
  };

  const handleToggleVisibility = async (id: number) => {
    try {
      await apiFetch(`/api/admin/categories/${id}/visibility`, {
        auth: true,
        method: 'PUT',
      });
      await fetchCategories();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      alert('표시/숨김 변경에 실패했습니다.');
    }
  };

  const startEdit = (category: Category) => {
    setFormData({
      code: category.code,
      name: category.name,
      description: category.description || '',
      iconName: category.iconName || '',
      parentId: category.parentId,
      displayOrder: category.displayOrder,
      isVisible: category.isVisible,
      isEvent: category.isEvent,
    });
    setEditingId(category.id);
    setIsCreating(false);
  };

  const toggleExpand = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const isEditing = editingId === category.id;

    return (
      <div key={category.id} className="border-b last:border-b-0">
        <div
          className={`flex items-center gap-3 p-4 hover:bg-gray-50 ${level > 0 ? 'bg-gray-50' : ''}`}
          style={{ paddingLeft: `${level * 2 + 1}rem` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpand(category.id)}
              className="hover:bg-gray-200 rounded p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {!hasChildren && <div className="w-6" />}

          <span className="text-2xl">{category.iconName}</span>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{category.name}</span>
              <span className="text-xs text-gray-500">({category.code})</span>
              {category.isEvent && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">이벤트</span>
              )}
              {!category.isVisible && (
                <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded">숨김</span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-500">{category.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">순서: {category.displayOrder}</span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleVisibility(category.id)}
              title={category.isVisible ? '숨김' : '표시'}
            >
              {category.isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEdit(category)}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(category.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getAllCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const flatten = (categories: Category[]) => {
      categories.forEach(cat => {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children);
        }
      });
    };
    flatten(cats);
    return result;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">카테고리 관리</h1>
        <p className="text-gray-600">카테고리를 생성, 수정, 삭제하고 순서를 관리합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리 목록 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>카테고리 목록</CardTitle>
            <Button
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 카테고리
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {categories.length === 0 ? (
              <p className="p-4 text-gray-500">등록된 카테고리가 없습니다.</p>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {categories.map(category => renderCategory(category))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 카테고리 폼 */}
        {(isCreating || editingId) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? '새 카테고리 생성' : '카테고리 수정'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="code">카테고리 코드 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="vegetables, fruits 등"
                />
                <p className="text-xs text-gray-500 mt-1">영문 소문자, 숫자, 하이픈만 사용</p>
              </div>

              <div>
                <Label htmlFor="name">카테고리명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="채소, 과일 등"
                />
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="카테고리 설명"
                />
              </div>

              <div>
                <Label htmlFor="iconName">아이콘 (이모지)</Label>
                <Input
                  id="iconName"
                  value={formData.iconName}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                  placeholder="🥬, 🍎, 🐟 등"
                />
              </div>

              <div>
                <Label htmlFor="parentId">부모 카테고리</Label>
                <Select
                  value={formData.parentId?.toString() || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      parentId: value === 'none' ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="최상위 카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">최상위 카테고리</SelectItem>
                    {getAllCategories(categories)
                      .filter(cat => cat.id !== editingId)
                      .map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="displayOrder">표시 순서</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">숫자가 작을수록 먼저 표시됩니다</p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isVisible"
                  checked={formData.isVisible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isVisible: checked as boolean })
                  }
                />
                <Label htmlFor="isVisible" className="cursor-pointer">
                  사용자에게 표시
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isEvent"
                  checked={formData.isEvent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isEvent: checked as boolean })
                  }
                />
                <Label htmlFor="isEvent" className="cursor-pointer">
                  이벤트 카테고리
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() =>
                    isCreating ? handleCreate() : handleUpdate(editingId!)
                  }
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? '생성' : '저장'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}