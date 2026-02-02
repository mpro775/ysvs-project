import { useState, useEffect } from "react";
import { Radio, Play, Square, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useStreamStatus,
  useStreamConfig,
  useCreateStreamConfig,
  useUpdateStreamConfig,
  useStartStream,
  useStopStream,
  useViewerCount,
} from "@/api/hooks/useStreaming";
import { useEvents } from "@/api/hooks/useEvents";

export default function AdminStreamingPage() {
  const { data: status } = useStreamStatus();
  const { data: config } = useStreamConfig();
  const { data: viewerCount } = useViewerCount();
  const { data: events } = useEvents({ status: "upcoming", limit: 20 });

  const { mutate: createConfig, isPending: isCreating } =
    useCreateStreamConfig();
  const { mutate: updateConfig, isPending: isUpdating } =
    useUpdateStreamConfig();
  const { mutate: startStream, isPending: isStarting } = useStartStream();
  const { mutate: stopStream, isPending: isStopping } = useStopStream();

  const [embedUrl, setEmbedUrl] = useState("");
  const [title, setTitle] = useState("");
  const NO_EVENT_VALUE = "__none__";
  const [selectedEvent, setSelectedEvent] = useState(NO_EVENT_VALUE);

  useEffect(() => {
    if (config) {
      setEmbedUrl(config.embedUrl || "");
      setTitle(config.title || "");
      const eventId =
        typeof config.event === "string"
          ? config.event
          : (config.event as { _id?: string })?._id;
      const eventStr = eventId ? String(eventId).trim() : "";
      setSelectedEvent(eventStr !== "" ? eventStr : NO_EVENT_VALUE);
    }
  }, [config]);

  const handleSave = () => {
    if (config?._id) {
      updateConfig({
        id: config._id,
        data: {
          embedUrl,
          title,
          event: selectedEvent === NO_EVENT_VALUE ? undefined : selectedEvent,
        },
      });
    } else {
      createConfig({
        embedUrl,
        title,
        event: selectedEvent === NO_EVENT_VALUE ? undefined : selectedEvent,
      });
    }
  };

  const handleToggle = () => {
    if (status?.isLive) {
      stopStream(config?._id);
    } else if (config?._id) {
      startStream(config._id);
    }
  };

  const isLive = status?.isLive || false;
  const isPending = isCreating || isUpdating || isStarting || isStopping;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">التحكم بالبث المباشر</h1>
        <p className="text-sm text-muted-foreground">
          إدارة البث المباشر للمؤتمرات
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              لوحة التحكم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">حالة البث</span>
                <Badge variant={isLive ? "destructive" : "secondary"}>
                  {isLive ? "🔴 مباشر" : "⚫ متوقف"}
                </Badge>
              </div>
              <Switch
                checked={isLive}
                onCheckedChange={handleToggle}
                disabled={isPending || !config?._id}
              />
            </div>

            {/* Viewer Count */}
            {isLive && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{viewerCount || 0} مشاهد</span>
              </div>
            )}

            {/* Embed URL */}
            <div className="space-y-2">
              <Label htmlFor="embedUrl">رابط البث (YouTube/Vimeo)</Label>
              <Input
                id="embedUrl"
                dir="ltr"
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                استخدم رابط التضمين (embed) وليس الرابط العادي
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">عنوان البث</Label>
              <Input
                id="title"
                placeholder="البث المباشر للمؤتمر السنوي"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Event Selection */}
            <div className="space-y-2">
              <Label>المؤتمر المرتبط</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مؤتمراً (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_EVENT_VALUE}>بدون مؤتمر</SelectItem>
                  {events?.data?.map((event) => (
                    <SelectItem key={event._id} value={event._id}>
                      {event.titleAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isPending || !embedUrl || !title}
            >
              {config?._id ? "حفظ التغييرات" : "إنشاء الإعدادات"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>معاينة البث</CardTitle>
          </CardHeader>
          <CardContent>
            {embedUrl ? (
              <div className="aspect-video overflow-hidden rounded-lg bg-black">
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="معاينة البث"
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg bg-neutral-100">
                <p className="text-muted-foreground">أدخل رابط البث للمعاينة</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => startStream(config?._id || "")}
                disabled={isLive || !config?._id || isPending}
              >
                <Play className="ml-2 h-4 w-4" />
                بدء البث
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => stopStream(config?._id)}
                disabled={!isLive || isPending}
              >
                <Square className="ml-2 h-4 w-4" />
                إيقاف البث
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
