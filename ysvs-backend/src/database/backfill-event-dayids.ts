import mongoose from 'mongoose';

type EventDayRecord = {
  id?: string;
  date?: Date | string;
  startTime?: Date | string;
  endTime?: Date | string;
  cmeHours?: number;
};

type ScheduleRecord = {
  id?: string;
  dayId?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  titleAr?: string;
};

type EventRecord = {
  _id: mongoose.Types.ObjectId;
  titleAr?: string;
  eventDays?: EventDayRecord[];
  schedule?: ScheduleRecord[];
};

const EVENT_COLLECTION = 'events';

const toDate = (value: Date | string | undefined): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const toDayKey = (value: Date | string | undefined): string | undefined => {
  const parsed = toDate(value);
  if (!parsed) return undefined;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateDayId = (dayKey: string, index: number): string => `day-${dayKey}-${index + 1}`;

const selectDayForSession = (
  session: ScheduleRecord,
  days: EventDayRecord[],
): EventDayRecord | undefined => {
  const sessionStart = toDate(session.startTime);
  const sessionEnd = toDate(session.endTime);

  if (sessionStart && sessionEnd) {
    const byRange = days.find((day) => {
      const dayStart = toDate(day.startTime);
      const dayEnd = toDate(day.endTime);
      if (!dayStart || !dayEnd) return false;
      return sessionStart >= dayStart && sessionEnd <= dayEnd;
    });

    if (byRange) {
      return byRange;
    }
  }

  const sessionDayKey = toDayKey(session.startTime);
  if (sessionDayKey) {
    return days.find((day) => toDayKey(day.date) === sessionDayKey);
  }

  return undefined;
};

async function run(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ysvs';
  await mongoose.connect(uri);

  const collection = mongoose.connection.collection(EVENT_COLLECTION);
  const events = (await collection
    .find({}, { projection: { _id: 1, titleAr: 1, eventDays: 1, schedule: 1 } })
    .toArray()) as unknown as EventRecord[];

  const updates: Array<{
    updateOne: {
      filter: { _id: mongoose.Types.ObjectId };
      update: { $set: { eventDays: EventDayRecord[]; schedule: ScheduleRecord[] } };
    };
  }> = [];

  let updatedEvents = 0;
  let updatedDayIds = 0;
  let updatedSessionDayLinks = 0;

  for (const event of events) {
    const originalDays = Array.isArray(event.eventDays) ? event.eventDays : [];
    const originalSchedule = Array.isArray(event.schedule) ? event.schedule : [];

    if (!originalDays.length && !originalSchedule.length) {
      continue;
    }

    let eventChanged = false;

    const dayIdUsage = new Set<string>();
    const nextDays = originalDays.map((day, index) => {
      const dayKey = toDayKey(day.date) || `unknown-${index + 1}`;
      const currentId = typeof day.id === 'string' ? day.id.trim() : '';
      let resolvedId = currentId;

      if (!resolvedId) {
        resolvedId = generateDayId(dayKey, index);
      }

      while (dayIdUsage.has(resolvedId)) {
        resolvedId = `${resolvedId}-dup`;
      }

      dayIdUsage.add(resolvedId);

      if (resolvedId !== currentId) {
        eventChanged = true;
        updatedDayIds += 1;
      }

      return {
        ...day,
        id: resolvedId,
      };
    });

    const validDayIdSet = new Set(nextDays.map((day) => day.id).filter((id): id is string => Boolean(id)));

    const nextSchedule = originalSchedule.map((session) => {
      const currentDayId = typeof session.dayId === 'string' ? session.dayId.trim() : '';
      const hasValidDayId = currentDayId.length > 0 && validDayIdSet.has(currentDayId);

      if (hasValidDayId || nextDays.length === 0) {
        return session;
      }

      const matchedDay = selectDayForSession(session, nextDays);
      if (!matchedDay?.id) {
        return session;
      }

      eventChanged = true;
      updatedSessionDayLinks += 1;

      return {
        ...session,
        dayId: matchedDay.id,
      };
    });

    if (!eventChanged) {
      continue;
    }

    updatedEvents += 1;
    updates.push({
      updateOne: {
        filter: { _id: event._id },
        update: {
          $set: {
            eventDays: nextDays,
            schedule: nextSchedule,
          },
        },
      },
    });
  }

  if (updates.length > 0) {
    await collection.bulkWrite(updates);
  }

  console.log(`Checked events: ${events.length}`);
  console.log(`Updated events: ${updatedEvents}`);
  console.log(`Backfilled day IDs: ${updatedDayIds}`);
  console.log(`Backfilled schedule.dayId: ${updatedSessionDayLinks}`);

  await mongoose.disconnect();
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
