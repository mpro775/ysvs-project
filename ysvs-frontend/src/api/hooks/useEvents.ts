import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiResponse,
  Event,
  EventDay,
  EventLiveStream,
  EventMode,
  EventScheduleItem,
  EventSpeaker,
  FormField,
  GuestEmailMode,
  PaginatedResponse,
  RegistrationAccess,
  Registration,
  UploadedFormFile,
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
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  eventMode?: EventMode;
  hasLiveStream?: boolean;
  liveStream?: EventLiveStream;
  status?: string;
  registrationOpen?: boolean;
  registrationAccess?: RegistrationAccess;
  guestEmailMode?: GuestEmailMode;
  registrationDeadline?: Date;
  maxAttendees?: number;
  cmeHours?: number;
  outcomes?: string[];
  objectives?: string[];
  targetAudience?: string[];
  speakers?: EventSpeaker[];
  schedule?: EventScheduleItem[];
  eventDays?: EventDay[];
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
      toast.success('تم إنشاء المؤتمر بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إنشاء المؤتمر حالياً.');
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
      toast.success('تم تحديث المؤتمر بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تحديث المؤتمر حالياً.');
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
      toast.success('تم حذف المؤتمر بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر حذف المؤتمر حالياً.');
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
      guestEmail,
    }: {
      eventId: string;
      data: Record<string, unknown>;
      guestEmail?: string;
    }) => {
      const response = await api.post<unknown, ApiResponse<Registration>>(
        ENDPOINTS.EVENTS.REGISTER(eventId),
        { formData: data, guestEmail }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      toast.success('تم التسجيل في المؤتمر بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر إكمال التسجيل حالياً.');
    },
  });
};

// Upload a single registration form file
export const useUploadRegistrationFile = () => {
  return useMutation({
    mutationFn: async ({
      eventId,
      fieldId,
      file,
    }: {
      eventId: string;
      fieldId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', fieldId);

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await api.post<unknown, ApiResponse<UploadedFormFile>>(
            ENDPOINTS.EVENTS.REGISTER_UPLOAD(eventId),
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          return response.data;
        } catch (error) {
          lastError = error as Error;

          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      throw lastError ?? new Error('تعذر رفع الملف حالياً.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر رفع الملف حالياً.');
    },
  });
};

export const checkSlugAvailability = async (
  slug: string,
  excludeId?: string
): Promise<boolean> => {
  const response = await api.get<unknown, ApiResponse<boolean>>(
    ENDPOINTS.EVENTS.SLUG_AVAILABILITY(slug),
    {
      params: excludeId ? { excludeId } : undefined,
    }
  );

  return response.data;
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
      toast.success('تم تحديث حالة الحضور بنجاح.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'تعذر تحديث حالة الحضور حالياً.');
    },
  });
};
