package com.agri.market.category;

import com.agri.market.dto.CategoryRequest;
import com.agri.market.dto.CategoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {
    private final CategoryRepository categoryRepository;

    /**
     * 초기 카테고리 데이터 생성
     */
    @PostConstruct
    @Transactional
    public void initializeCategories() {
        // 카테고리가 없으면 기본 카테고리 생성
        if (categoryRepository.count() == 0) {
            createDefaultCategories();
        }
    }

    private void createDefaultCategories() {
        // 메인 카테고리 생성
        Category vegetables = createCategory("vegetables", "채소", "🥬", 1, true, false);
        Category fruits = createCategory("fruits", "과일", "🍎", 2, true, false);
        Category seafood = createCategory("seafood", "수산물", "🐟", 3, true, false);
        Category meat = createCategory("meat", "축산물", "🥩", 4, true, false);
        Category grains = createCategory("grains", "쌀/잡곡", "🌾", 5, true, false);

        // 이벤트/특가 카테고리
        Category event = createCategory("event", "특가/할인", "💸", 0, true, true);
        Category newProducts = createCategory("new", "신상품", "✨", 6, true, false);

        categoryRepository.save(vegetables);
        categoryRepository.save(fruits);
        categoryRepository.save(seafood);
        categoryRepository.save(meat);
        categoryRepository.save(grains);
        categoryRepository.save(event);
        categoryRepository.save(newProducts);

        // 하위 카테고리 예시 (채소)
        Category leafy = createSubCategory(vegetables, "leafy", "잎채소", "🥬", 1);
        Category root = createSubCategory(vegetables, "root", "뿌리채소", "🥕", 2);
        Category mushroom = createSubCategory(vegetables, "mushroom", "버섯류", "🍄", 3);

        categoryRepository.save(leafy);
        categoryRepository.save(root);
        categoryRepository.save(mushroom);

        // 하위 카테고리 예시 (과일)
        Category citrus = createSubCategory(fruits, "citrus", "감귤류", "🍊", 1);
        Category berries = createSubCategory(fruits, "berries", "베리류", "🫐", 2);
        Category tropical = createSubCategory(fruits, "tropical", "열대과일", "🥭", 3);

        categoryRepository.save(citrus);
        categoryRepository.save(berries);
        categoryRepository.save(tropical);
    }

    private Category createCategory(String code, String name, String icon, int order, boolean visible, boolean isEvent) {
        Category category = new Category();
        category.setCode(code);
        category.setName(name);
        category.setIconName(icon);
        category.setDisplayOrder(order);
        category.setIsVisible(visible);
        category.setIsEvent(isEvent);
        return category;
    }

    private Category createSubCategory(Category parent, String code, String name, String icon, int order) {
        Category category = createCategory(code, name, icon, order, true, false);
        category.setParent(parent);
        return category;
    }

    /**
     * 모든 카테고리 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        List<Category> rootCategories = categoryRepository.findByParentIsNullOrderByDisplayOrderAsc();
        return rootCategories.stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 표시 가능한 카테고리만 조회 (사용자용)
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getVisibleCategories() {
        List<Category> rootCategories = categoryRepository.findByIsVisibleTrueAndParentIsNullOrderByDisplayOrderAsc();
        return rootCategories.stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 카테고리 조회
     */
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryByCode(String code) {
        Category category = categoryRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + code));
        return CategoryResponse.from(category);
    }

    /**
     * 카테고리 생성
     */
    public CategoryResponse createCategory(CategoryRequest request) {
        // 중복 코드 체크
        if (categoryRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("이미 존재하는 카테고리 코드입니다: " + request.getCode());
        }

        Category category = new Category();
        category.setCode(request.getCode());
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIconName(request.getIconName());
        category.setDisplayOrder(request.getDisplayOrder());
        category.setIsVisible(request.getIsVisible());
        category.setIsEvent(request.getIsEvent());

        // 부모 카테고리 설정
        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("부모 카테고리를 찾을 수 없습니다: " + request.getParentId()));
            category.setParent(parent);
        }

        Category saved = categoryRepository.save(category);
        return CategoryResponse.from(saved);
    }

    /**
     * 카테고리 수정
     */
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + id));

        // 코드 변경 시 중복 체크
        if (!category.getCode().equals(request.getCode()) && categoryRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("이미 존재하는 카테고리 코드입니다: " + request.getCode());
        }

        category.setCode(request.getCode());
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIconName(request.getIconName());
        category.setDisplayOrder(request.getDisplayOrder());
        category.setIsVisible(request.getIsVisible());
        category.setIsEvent(request.getIsEvent());

        // 부모 카테고리 변경
        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new RuntimeException("자기 자신을 부모로 설정할 수 없습니다");
            }
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("부모 카테고리를 찾을 수 없습니다: " + request.getParentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        Category saved = categoryRepository.save(category);
        return CategoryResponse.from(saved);
    }

    /**
     * 카테고리 삭제
     */
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + id));

        // 하위 카테고리가 있으면 삭제 불가
        if (!category.getChildren().isEmpty()) {
            throw new RuntimeException("하위 카테고리가 있는 카테고리는 삭제할 수 없습니다");
        }

        categoryRepository.delete(category);
    }

    /**
     * 카테고리 표시/숨김 토글
     */
    public CategoryResponse toggleVisibility(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + id));

        category.setIsVisible(!category.getIsVisible());
        Category saved = categoryRepository.save(category);
        return CategoryResponse.from(saved);
    }

    /**
     * 카테고리 순서 변경
     */
    public void updateOrder(List<Long> categoryIds) {
        int order = 0;
        for (Long id : categoryIds) {
            Category category = categoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다: " + id));
            category.setDisplayOrder(order++);
            categoryRepository.save(category);
        }
    }
}