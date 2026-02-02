import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type { ApiResponse, Article, BoardMember, PaginatedResponse } from '@/types';

interface ArticleFilters {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published';
  category?: string;
  search?: string;
}

interface CreateArticleData {
  titleAr: string;
  titleEn: string;
  slug: string;
  summaryAr?: string;
  summaryEn?: string;
  contentAr: string;
  contentEn: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published';
}

// ===== Articles =====

// Get all articles
export const useArticles = (filters?: ArticleFilters) => {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<Article>>(
        ENDPOINTS.CONTENT.ARTICLES,
        { params: filters }
      );
      return response;
    },
  });
};

// Get latest articles (public)
export const useLatestArticles = (limit: number = 3) => {
  return useQuery({
    queryKey: ['articles', 'latest', limit],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<Article>>(
        ENDPOINTS.CONTENT.ARTICLES,
        { params: { limit, status: 'published' } }
      );
      return response.data;
    },
  });
};

// Get single article by ID
export const useArticle = (id: string) => {
  return useQuery({
    queryKey: ['articles', id],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<Article>>(
        ENDPOINTS.CONTENT.ARTICLE_BY_ID(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// Get article by slug
export const useArticleBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['articles', 'slug', slug],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<Article>>(
        ENDPOINTS.CONTENT.ARTICLE_BY_SLUG(slug)
      );
      return response.data;
    },
    enabled: !!slug,
  });
};

// Create article
export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateArticleData) => {
      const response = await api.post<unknown, ApiResponse<Article>>(
        ENDPOINTS.CONTENT.ARTICLES,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('تم إنشاء المقال بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إنشاء المقال');
    },
  });
};

// Update article
export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateArticleData>;
    }) => {
      const response = await api.patch<unknown, ApiResponse<Article>>(
        ENDPOINTS.CONTENT.ARTICLE_BY_ID(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles', variables.id] });
      toast.success('تم تحديث المقال بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحديث المقال');
    },
  });
};

// Delete article
export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.CONTENT.ARTICLE_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('تم حذف المقال بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل حذف المقال');
    },
  });
};

// Get categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<string[]>>(
        ENDPOINTS.CONTENT.CATEGORIES
      );
      return response.data;
    },
  });
};

// ===== Board Members =====

// Get all board members
export const useBoardMembers = () => {
  return useQuery({
    queryKey: ['board'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<BoardMember[]>>(
        ENDPOINTS.BOARD.BASE
      );
      return response.data;
    },
  });
};

// Get board member by ID
export const useBoardMember = (id: string) => {
  return useQuery({
    queryKey: ['board', id],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<BoardMember>>(
        ENDPOINTS.BOARD.BY_ID(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// Create board member
export const useCreateBoardMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<BoardMember, '_id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post<unknown, ApiResponse<BoardMember>>(
        ENDPOINTS.BOARD.BASE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      toast.success('تم إضافة عضو المجلس بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إضافة عضو المجلس');
    },
  });
};

// Update board member
export const useUpdateBoardMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<BoardMember, '_id' | 'createdAt' | 'updatedAt'>>;
    }) => {
      const response = await api.patch<unknown, ApiResponse<BoardMember>>(
        ENDPOINTS.BOARD.BY_ID(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['board', variables.id] });
      toast.success('تم تحديث عضو المجلس بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحديث عضو المجلس');
    },
  });
};

// Delete board member
export const useDeleteBoardMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.BOARD.BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      toast.success('تم حذف عضو المجلس بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل حذف عضو المجلس');
    },
  });
};

// Reorder board members
export const useReorderBoardMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const response = await api.patch<unknown, ApiResponse<BoardMember[]>>(
        ENDPOINTS.BOARD.REORDER,
        { memberIds: orderedIds }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      toast.success('تم إعادة ترتيب الأعضاء');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إعادة الترتيب');
    },
  });
};
