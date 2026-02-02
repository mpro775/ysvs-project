import { Link } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn, getEventDisplayStatus } from "@/lib/utils";

interface EventCardProps {
  event: Event;
}

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  upcoming: { label: "قادم", variant: "default" },
  ongoing: { label: "جارٍ الآن", variant: "destructive" },
  completed: { label: "منتهي", variant: "secondary" },
  cancelled: { label: "ملغي", variant: "outline" },
};

export function EventCard({ event }: EventCardProps) {
  const displayStatus = getEventDisplayStatus(event);
  const status =
    event.status === "cancelled"
      ? statusLabels.cancelled
      : statusLabels[displayStatus] ?? statusLabels.upcoming;
  const isUpcoming = displayStatus === "upcoming";
  const canRegister = isUpcoming && event.registrationOpen;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Cover Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.titleAr}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <Calendar className="h-16 w-16 text-primary-400" />
          </div>
        )}
        <Badge className={cn("absolute left-3 top-3")} variant={status.variant}>
          {status.label}
        </Badge>
        {event.cmeHours > 0 && (
          <Badge className="absolute right-3 top-3 bg-amber-500 hover:bg-amber-600">
            {event.cmeHours} ساعة CME
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <h3 className="line-clamp-2 text-lg font-bold leading-tight">
          {event.titleAr}
        </h3>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(event.startDate), "d MMMM yyyy", { locale: ar })}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.location.city}</span>
          </div>
        )}

        {/* Attendees */}
        {event.maxAttendees > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {event.currentAttendees} / {event.maxAttendees} مسجل
            </span>
          </div>
        )}

        {/* Action */}
        <Button asChild className="w-full">
          <Link to={`/events/${event.slug}`}>
            {canRegister ? "سجل الآن" : "عرض التفاصيل"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
