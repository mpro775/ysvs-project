import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Search, Reply, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useContactMessage,
  useContactMessages,
  useReplyContactMessage,
  useUpdateContactMessageRead,
  useUpdateContactMessageStatus,
} from '@/api/hooks/useContact';
import type { ContactMessage, ContactMessageStatus } from '@/types';

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  new: 'جديدة',
  in_progress: 'قيد المعالجة',
  replied: 'تم الرد',
  archived: 'مؤرشفة',
  spam: 'سبام',
};

function getStatusVariant(status: ContactMessageStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'new') {
    return 'default';
  }

  if (status === 'in_progress' || status === 'replied') {
    return 'secondary';
  }

  return 'outline';
}

export default function ContactMessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || 'all';
  const readState = searchParams.get('isRead') || 'all';

  const { data, isLoading } = useContactMessages({
    page,
    limit: 10,
    status: status !== 'all' ? (status as ContactMessageStatus) : undefined,
    isRead:
      readState === 'true' ? true : readState === 'false' ? false : undefined,
    search: searchParams.get('search') || undefined,
  });

  const { data: activeMessage } = useContactMessage(replyMessageId || '');

  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateContactMessageStatus();
  const { mutate: updateReadState, isPending: isUpdatingRead } =
    useUpdateContactMessageRead();
  const { mutate: replyMessage, isPending: isReplying } = useReplyContactMessage();

  const selectedMessage = useMemo<ContactMessage | undefined>(() => {
    if (!replyMessageId) {
      return undefined;
    }

    return (
      data?.data.find((message) => message._id === replyMessageId) ||
      activeMessage ||
      undefined
    );
  }, [activeMessage, data?.data, replyMessageId]);

  const closeReplyDialog = () => {
    setReplyMessageId(null);
    setReplySubject('');
    setReplyBody('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (search.trim()) {
        prev.set('search', search.trim());
      } else {
        prev.delete('search');
      }

      prev.delete('page');
      return prev;
    });
  };

  const openReply = (message: ContactMessage) => {
    setReplyMessageId(message._id);
    setReplySubject(`رد بخصوص رسالتكم: ${message.subject}`);
    setReplyBody('');

    if (!message.isRead) {
      updateReadState({ id: message._id, isRead: true });
    }
  };

  const submitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessageId || !replyBody.trim()) {
      return;
    }

    replyMessage(
      {
        id: replyMessageId,
        body: replyBody.trim(),
        subject: replySubject.trim() || undefined,
      },
      {
        onSuccess: () => {
          closeReplyDialog();
        },
      },
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-7">
      <div>
        <h1 className="text-xl font-bold leading-tight sm:text-2xl lg:text-3xl">رسائل التواصل</h1>
        <p className="text-sm text-muted-foreground">
          متابعة رسائل نموذج تواصل معنا والرد عليها من لوحة التحكم
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-2 sm:flex-row sm:gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث بالاسم أو البريد أو الموضوع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button type="submit">بحث</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearch('');
            setSearchParams({ page: '1' });
          }}
        >
          إعادة تعيين
        </Button>
      </form>

      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          value={status}
          onValueChange={(value) => {
            setSearchParams((prev) => {
              if (value === 'all') {
                prev.delete('status');
              } else {
                prev.set('status', value);
              }

              prev.delete('page');
              return prev;
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="فلترة الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="new">جديدة</SelectItem>
            <SelectItem value="in_progress">قيد المعالجة</SelectItem>
            <SelectItem value="replied">تم الرد</SelectItem>
            <SelectItem value="archived">مؤرشفة</SelectItem>
            <SelectItem value="spam">سبام</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={readState}
          onValueChange={(value) => {
            setSearchParams((prev) => {
              if (value === 'all') {
                prev.delete('isRead');
              } else {
                prev.set('isRead', value);
              }

              prev.delete('page');
              return prev;
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="حالة القراءة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="false">غير مقروءة</SelectItem>
            <SelectItem value="true">مقروءة</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center rounded-md border px-3 text-sm text-muted-foreground">
          العدد الكلي: {data?.meta.total?.toLocaleString('ar-EG') || 0}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          ))
        ) : data?.data.length ? (
          data.data.map((message) => (
            <div key={message._id} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="space-y-1">
                <p className="font-semibold leading-6 break-words">{message.name}</p>
                <p className="text-xs text-muted-foreground break-all" dir="ltr">
                  {message.email}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-medium leading-6 break-words">{message.subject}</p>
                <p className="text-xs text-muted-foreground leading-6 break-words line-clamp-3">
                  {message.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">الحالة</p>
                  <Badge variant={getStatusVariant(message.status)}>
                    {STATUS_LABELS[message.status]}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">القراءة</p>
                  <Badge variant={message.isRead ? 'secondary' : 'default'}>
                    {message.isRead ? 'مقروءة' : 'غير مقروءة'}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {format(new Date(message.createdAt), 'd MMM yyyy - HH:mm', {
                  locale: ar,
                })}
              </p>

              <Select
                value={message.status}
                disabled={isUpdatingStatus}
                onValueChange={(value) => {
                  updateStatus({
                    id: message._id,
                    status: value as ContactMessageStatus,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="تغيير الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">جديدة</SelectItem>
                  <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                  <SelectItem value="replied">تم الرد</SelectItem>
                  <SelectItem value="archived">مؤرشفة</SelectItem>
                  <SelectItem value="spam">سبام</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isUpdatingRead}
                  onClick={() => updateReadState({ id: message._id, isRead: !message.isRead })}
                  title={message.isRead ? 'تحديد كغير مقروءة' : 'تحديد كمقروءة'}
                >
                  {message.isRead ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>

                <Button variant="secondary" size="sm" onClick={() => openReply(message)}>
                  <Reply className="ml-2 h-4 w-4" />
                  رد
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border bg-card p-2">
            <EmptyState
              icon={Mail}
              title="لا توجد رسائل"
              description="لم يتم العثور على رسائل تواصل ضمن الفلاتر الحالية"
            />
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <Table className="min-w-[940px] xl:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>المرسل</TableHead>
              <TableHead className="w-[30%] whitespace-normal">الموضوع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>القراءة</TableHead>
              <TableHead>تاريخ الإرسال</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-44" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-10 w-64" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-9 w-44" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data.length ? (
              data.data.map((message) => (
                <TableRow key={message._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{message.name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {message.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[320px] whitespace-normal xl:max-w-[420px]">
                    <div className="space-y-1">
                      <p className="font-medium leading-6 break-words">{message.subject}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground leading-6 break-words">
                        {message.message}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(message.status)}>
                      {STATUS_LABELS[message.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={message.isRead ? 'secondary' : 'default'}>
                      {message.isRead ? 'مقروءة' : 'غير مقروءة'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(message.createdAt), 'd MMM yyyy - HH:mm', {
                      locale: ar,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={message.status}
                        disabled={isUpdatingStatus}
                        onValueChange={(value) => {
                          updateStatus({
                            id: message._id,
                            status: value as ContactMessageStatus,
                          });
                        }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="تغيير الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">جديدة</SelectItem>
                          <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                          <SelectItem value="replied">تم الرد</SelectItem>
                          <SelectItem value="archived">مؤرشفة</SelectItem>
                          <SelectItem value="spam">سبام</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="icon"
                        disabled={isUpdatingRead}
                        onClick={() =>
                          updateReadState({ id: message._id, isRead: !message.isRead })
                        }
                        title={message.isRead ? 'تحديد كغير مقروءة' : 'تحديد كمقروءة'}
                      >
                        {message.isRead ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openReply(message)}
                      >
                        <Reply className="ml-2 h-4 w-4" />
                        رد
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={Mail}
                    title="لا توجد رسائل"
                    description="لم يتم العثور على رسائل تواصل ضمن الفلاتر الحالية"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                setSearchParams((prev) => {
                  prev.set('page', String(i + 1));
                  return prev;
                })
              }
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      <Dialog open={!!replyMessageId} onOpenChange={(open) => !open && closeReplyDialog()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>الرد على الرسالة</DialogTitle>
            <DialogDescription>
              {selectedMessage
                ? `إرسال رد إلى ${selectedMessage.name} - ${selectedMessage.email}`
                : 'إعداد الرد'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitReply} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply-subject">عنوان الرد</Label>
              <Input
                id="reply-subject"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="عنوان رسالة الرد"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply-body">نص الرد</Label>
              <Textarea
                id="reply-body"
                rows={7}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="اكتب الرد هنا..."
              />
            </div>

            {selectedMessage && (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  نص الرسالة الأصلية
                </p>
                <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeReplyDialog}
                disabled={isReplying}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isReplying || !replyBody.trim()}>
                {isReplying ? 'جارٍ الإرسال...' : 'إرسال الرد'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
