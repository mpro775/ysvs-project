import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiResponse,
  Event,
  FormField,
  PaginatedResponse,
  Registration,
} from '@/types';

interface EventFilters {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

interface CreateEventData {
  titleAr: string;
  titleEn: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  coverImage?: string;
  startDate: Date;
  endDate: Date;
  location?: {
    venue: string;
    venueEn?: string;
    address: string;
    addressEn?: string;
    city: string;
    cityEn?: string;
  };
  status?: string;
  registrationOpen?: boolean;
  registrationDeadline?: Date;
  maxAttendees?: number;
  cmeHours?: number;
  formSchema?: FormField[];
}

// Get all events
export const useEvents = (filters?: EventFilters) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<Event>>(
        ENDPOINTS.EVENTS.BASE,
        { params: filters }
      );
      return response;
    },
  });
};

// Get single event by ID
export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<Event>>(
        ENDPOINTS.EVENTS.BY_ID(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// Get single event by slug
export const useEventBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['events', 'slug', slug],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<Event>>(
        ENDPOINTS.EVENTS.BY_SLUG(slug)
      );
      return response.data;
    },
    enabled: !!slug,
  });
};

// Get upcoming event (for countdown)
export const useUpcomingEvent = () => {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<Event>>(
        ENDPOINTS.EVENTS.UPCOMING
      );
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
};

// Get event form schema
export const useEventFormSchema = (eventId: string) => {
  return useQuery({
    queryKey: ['events', eventId, 'form-schema'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<FormField[]>>(
        ENDPOINTS.EVENTS.FORM_SCHEMA(eventId)
      );
      return response.data;
    },
    enabled: !!eventId,
  });
};

// Create event mutation
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      const response = await api.post<unknown, ApiResponse<Event>>(
        ENDPOINTS.EVENTS.BASE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('تم إنشاء المؤتمر بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل إنشاء المؤتمر');
    },
  });
};

// Update event mutation
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateEventData> }) => {
      const response = await api.patch<unknown, ApiResponse<Event>>(
        ENDPOINTS.EVENTS.BY_ID(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.id] });
      toast.success('تم تحديث المؤتمر بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحديث المؤتمر');
    },
  });
};

// Delete event mutation
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.EVENTS.BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('تم حذف المؤتمر بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل حذف المؤتمر');
    },
  });
};

// Register for event
export const useRegisterEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      data,
    }: {
      eventId: string;
      data: Record<string, unknown>;
    }) => {
      const response = await api.post<unknown, ApiResponse<Registration>>(
        ENDPOINTS.EVENTS.REGISTER(eventId),
        { formData: data }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      toast.success('تم التسجيل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل التسجيل');
    },
  });
};

// Get event registrations (admin)
export const useEventRegistrations = (eventId: string, filters?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['events', eventId, 'registrations', filters],
    queryFn: async () => {
      const response = await api.get<unknown, PaginatedResponse<Registration>>(
        ENDPOINTS.EVENTS.REGISTRATIONS(eventId),
        { params: filters }
      );
      return response;
    },
    enabled: !!eventId,
  });
};

// Get my registrations
export const useMyRegistrations = () => {
  return useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => {
      const response = await api.get<unknown, ApiResponse<Registration[]>>(
        ENDPOINTS.EVENTS.MY_REGISTRATIONS
      );
      return response.data;
    },
  });
};

// Mark attendance
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      registrationId,
      attended,
    }: {
      eventId: string;
      registrationId: string;
      attended: boolean;
    }) => {
      const response = await api.patch<unknown, ApiResponse<Registration>>(
        ENDPOINTS.EVENTS.ATTENDANCE(eventId, registrationId),
        { attended }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['events', variables.eventId, 'registrations'],
      });
      toast.success('تم تحديث الحضور');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحديث الحضور');
    },
  });
};
