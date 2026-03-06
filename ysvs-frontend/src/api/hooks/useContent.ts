import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type {
  AboutContent,
  AboutObjective,
  ApiResponse,
  Article,
  BoardMember,
  FooterContent,
  LegalPage,
  NewsletterSubscriber,
  PaginatedResponse,
  SiteContent,
  SitePublicContent,
} from '@/types';

interface ArticleFilters {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published';
  category?: string;
  search?: string;
  featured?: boolean;
}

export interface ArticleCategory {
  _id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

interface CreateArticleData {
  titleAr: string;
  titleEn: string;
  slug: string;
  excerptAr?: string;
  excerptEn?: string;
  contentAr: string;
  contentEn: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  isFeatured?: boolean;
}

interface UpdateAboutContentData {
  heroTitleAr?: string;
  heroTitleEn?: string;
  heroDescriptionAr?: string;
  heroDescriptionEn?: string;
  visionTitleAr?: string;
  visionTitleEn?: string;
  visionTextAr?: string;
  visionTextEn?: string;
  missionTitleAr?: string;
  missionTitleEn?: string;
  missionTextAr?: string;
  missionTextEn?: string;
  objectives?: AboutObjective[];
}

interface SubscribeNewsletterData {
  email: string;
  source?: string;
  locale?: string;
}

interface NewsletterSubscribersFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'subscribed' | 'unsubscribed';
  search?: string;
}

interface UpdateFooterContentData {
  descriptionAr?: string;
  descriptionEn?: string;
  addressAr?: string;
  addressEn?: string;
  phone?: string;
  email?: string;
  quickLinks?: FooterContent['quickLinks'];
  socialLinks?: FooterContent['socialLinks'];
  copyrightAr?: string;
  copyrightEn?: string;
}

interface UpdateLegalPageData {
  titleAr?: string;
  titleEn?: string;
  contentAr?: string;
  contentEn?: string;
  version?: number;
  effectiveDate?: string;
  isPublished?: boolean;
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

// Get all articles for admin (includes drafts)
export const useAdminArticles = (filters?: ArticleFilters) => {
  return useQuery({
    queryKey: ['articles', 'admin', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<Article>>(
        ENDPOINTS.CONTENT.ARTICLES_ALL,
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
      const response = await api.get<unknown, ApiResponse<ArticleCategory[]>>(
        ENDPOINTS.CONTENT.CATEGORIES
      );
      return response.data;
    },
  });
};

// ===== About Page =====

// Get public about content
export const useAboutContent = () => {
  return useQuery({
    queryKey: ['about'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<AboutContent>>(
        ENDPOINTS.ABOUT.BASE,
      );
      return response.data;
    },
  });
};

// Get admin about content
export const useAdminAboutContent = () => {
  return useQuery({
    queryKey: ['about', 'admin'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<AboutContent>>(
        ENDPOINTS.ABOUT.ADMIN,
      );
      return response.data;
    },
  });
};

// Update about content
export const useUpdateAboutContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAboutContentData) => {
      const response = await api.patch<unknown, ApiResponse<AboutContent>>(
        ENDPOINTS.ABOUT.BASE,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about'] });
      queryClient.invalidateQueries({ queryKey: ['about', 'admin'] });
      toast.success('تم تحديث محتوى صفحة عن الجمعية بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحديث محتوى صفحة عن الجمعية');
    },
  });
};

// ===== Site Content =====

export const useSitePublicContent = () => {
  return useQuery({
    queryKey: ['site-content', 'public'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<SitePublicContent>>(
        ENDPOINTS.SITE_CONTENT.PUBLIC,
      );
      return response.data;
    },
  });
};

export const useAdminSiteContent = () => {
  return useQuery({
    queryKey: ['site-content', 'admin'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<SiteContent>>(
        ENDPOINTS.SITE_CONTENT.ADMIN,
      );
      return response.data;
    },
  });
};

export const usePrivacyPolicyPage = () => {
  return useQuery({
    queryKey: ['site-content', 'legal', 'privacy'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<LegalPage>>(
        ENDPOINTS.SITE_CONTENT.LEGAL_PRIVACY,
      );
      return response.data;
    },
  });
};

export const useTermsAndConditionsPage = () => {
  return useQuery({
    queryKey: ['site-content', 'legal', 'terms'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<LegalPage>>(
        ENDPOINTS.SITE_CONTENT.LEGAL_TERMS,
      );
      return response.data;
    },
  });
};

export const useUpdateSiteFooter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateFooterContentData) => {
      const response = await api.patch<unknown, ApiResponse<FooterContent>>(
        ENDPOINTS.SITE_CONTENT.FOOTER,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast.success('تم تحديث الفوتر بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحديث الفوتر');
    },
  });
};

export const useUpdatePrivacyPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLegalPageData) => {
      const response = await api.patch<unknown, ApiResponse<LegalPage>>(
        ENDPOINTS.SITE_CONTENT.LEGAL_PRIVACY,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast.success('تم تحديث سياسة الخصوصية بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحديث سياسة الخصوصية');
    },
  });
};

export const useUpdateTermsAndConditions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLegalPageData) => {
      const response = await api.patch<unknown, ApiResponse<LegalPage>>(
        ENDPOINTS.SITE_CONTENT.LEGAL_TERMS,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast.success('تم تحديث الشروط والأحكام بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحديث الشروط والأحكام');
    },
  });
};

export const usePublishPrivacyPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<unknown, ApiResponse<LegalPage>>(
        ENDPOINTS.SITE_CONTENT.PUBLISH_PRIVACY,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast.success('تم نشر سياسة الخصوصية');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل نشر سياسة الخصوصية');
    },
  });
};

export const usePublishTermsAndConditions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<unknown, ApiResponse<LegalPage>>(
        ENDPOINTS.SITE_CONTENT.PUBLISH_TERMS,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast.success('تم نشر الشروط والأحكام');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل نشر الشروط والأحكام');
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

// ===== Newsletter =====

export const useNewsletterSubscribe = () => {
  return useMutation({
    mutationFn: async (data: SubscribeNewsletterData) => {
      const response = await api.post<unknown, ApiResponse<{ message?: string }>>(
        ENDPOINTS.NEWSLETTER.SUBSCRIBE,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('شكراً لاشتراكك في النشرة البريدية');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تنفيذ الاشتراك حالياً');
    },
  });
};

export const useNewsletterSubscribers = (filters?: NewsletterSubscribersFilters) => {
  return useQuery({
    queryKey: ['newsletter', 'subscribers', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<NewsletterSubscriber>>(
        ENDPOINTS.NEWSLETTER.SUBSCRIBERS,
        { params: filters },
      );
      return response;
    },
  });
};

export const useUpdateNewsletterSubscriberStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'pending' | 'subscribed' | 'unsubscribed';
    }) => {
      const response = await api.patch<unknown, ApiResponse<NewsletterSubscriber>>(
        ENDPOINTS.NEWSLETTER.UPDATE_STATUS(id),
        { status },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter', 'subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      toast.success('تم تحديث حالة المشترك');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تحديث الحالة');
    },
  });
};
