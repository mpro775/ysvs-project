import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended';

type ParsedArgs = {
  eventId: string;
  filePath: string;
  dryRun: boolean;
};

const resolveEventQuery = (eventId: string): { $in: Array<string | mongoose.Types.ObjectId> } => {
  const values: Array<string | mongoose.Types.ObjectId> = [eventId];

  if (mongoose.Types.ObjectId.isValid(eventId)) {
    values.push(new mongoose.Types.ObjectId(eventId));
  }

  return { $in: values };
};

const HEADER_KEYS = {
  registrationNumber: ['رقم التسجيل'],
  fullNameAr: ['الاسم (عربي)'],
  fullNameEn: ['الاسم (إنجليزي)'],
  email: ['البريد الإلكتروني'],
  phone: ['الهاتف'],
  professionalCardUrl: ['رابط بطاقة مزاولة المهنة'],
  gender: ['الجنس'],
  country: ['الدولة'],
  jobTitle: ['الصفة الوظيفية'],
  specialty: ['التخصص'],
  workplace: ['جهة العمل / المستشفى / الجامعة'],
  status: ['الحالة'],
  createdAt: ['تاريخ التسجيل'],
  notes: ['الملاحظات'],
} as const;

const normalizeHeader = (value: unknown): string =>
  String(value ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeEmail = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const normalizeText = (value: unknown): string => String(value ?? '').trim();

const normalizeStatus = (value: unknown): RegistrationStatus => {
  const normalized = normalizeText(value);
  if (normalized === 'حضر') return 'attended';
  if (normalized === 'ملغي') return 'cancelled';
  if (normalized === 'معلق' || normalized === 'قيد الانتظار') return 'pending';
  return 'confirmed';
};

const normalizeGender = (value: unknown): 'male' | 'female' | '' => {
  const normalized = normalizeText(value);
  if (normalized === 'ذكر') return 'male';
  if (normalized === 'أنثى') return 'female';
  return '';
};

const parseDate = (value: unknown): Date => {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number') {
    const decoded = XLSX.SSF.parse_date_code(value);
    if (decoded) {
      return new Date(decoded.y, decoded.m - 1, decoded.d, decoded.H, decoded.M, decoded.S);
    }
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2);
  const eventId = args.find((arg) => arg.startsWith('--eventId='))?.split('=')[1] || '';
  const filePath = args.find((arg) => arg.startsWith('--file='))?.split('=')[1] || '';
  const dryRun = args.includes('--dry-run');

  if (!eventId) {
    throw new Error('Missing --eventId argument');
  }

  if (!filePath) {
    throw new Error('Missing --file argument');
  }

  return { eventId, filePath, dryRun };
};

const getColumnIndex = (
  headerRow: unknown[],
  candidates: readonly string[],
): number => {
  const normalizedHeader = headerRow.map((cell) => normalizeHeader(cell));
  for (const key of candidates) {
    const idx = normalizedHeader.findIndex((cell) => cell === key);
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
};

async function run(): Promise<void> {
  const { eventId, filePath, dryRun } = parseArgs();
  const absoluteFilePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`File not found: ${absoluteFilePath}`);
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new Error('Invalid eventId');
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ysvs';
  await mongoose.connect(uri);

  const eventsCollection = mongoose.connection.collection('events');
  const registrationsCollection = mongoose.connection.collection('registrations');

  const event = await eventsCollection.findOne({ _id: new mongoose.Types.ObjectId(eventId) });
  if (!event) {
    throw new Error('Event not found');
  }

  const workbook = XLSX.readFile(absoluteFilePath, { raw: false, cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Workbook is empty');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
  });

  if (matrix.length < 2) {
    throw new Error('No data rows found in worksheet');
  }

  const headerRow = matrix[0];

  const columnIndex = {
    registrationNumber: getColumnIndex(headerRow, HEADER_KEYS.registrationNumber),
    fullNameAr: getColumnIndex(headerRow, HEADER_KEYS.fullNameAr),
    fullNameEn: getColumnIndex(headerRow, HEADER_KEYS.fullNameEn),
    email: getColumnIndex(headerRow, HEADER_KEYS.email),
    phone: getColumnIndex(headerRow, HEADER_KEYS.phone),
    professionalCardUrl: getColumnIndex(headerRow, HEADER_KEYS.professionalCardUrl),
    gender: getColumnIndex(headerRow, HEADER_KEYS.gender),
    country: getColumnIndex(headerRow, HEADER_KEYS.country),
    jobTitle: getColumnIndex(headerRow, HEADER_KEYS.jobTitle),
    specialty: getColumnIndex(headerRow, HEADER_KEYS.specialty),
    workplace: getColumnIndex(headerRow, HEADER_KEYS.workplace),
    status: getColumnIndex(headerRow, HEADER_KEYS.status),
    createdAt: getColumnIndex(headerRow, HEADER_KEYS.createdAt),
    notes: getColumnIndex(headerRow, HEADER_KEYS.notes),
  };

  const requiredColumns = ['registrationNumber', 'fullNameAr', 'fullNameEn', 'email'] as const;
  for (const column of requiredColumns) {
    if (columnIndex[column] < 0) {
      throw new Error(`Required column missing in sheet: ${column}`);
    }
  }

  const existingRegs = await registrationsCollection
    .find(
      { event: resolveEventQuery(eventId) },
      {
        projection: {
          registrationNumber: 1,
          guestEmailNormalized: 1,
          event: 1,
        },
      },
    )
    .toArray();

  const hasStringEventType = existingRegs.some((reg) => typeof reg.event === 'string');
  const eventStorageValue: string | mongoose.Types.ObjectId = hasStringEventType
    ? eventId
    : new mongoose.Types.ObjectId(eventId);

  const usedRegistrationNumbers = new Set<string>();
  const usedGuestEmails = new Set<string>();

  for (const reg of existingRegs) {
    const registrationNumber = normalizeText(reg.registrationNumber);
    if (registrationNumber) {
      usedRegistrationNumbers.add(registrationNumber);
    }

    const guestEmailNormalized = normalizeEmail(reg.guestEmailNormalized);
    if (guestEmailNormalized) {
      usedGuestEmails.add(guestEmailNormalized);
    }
  }

  const documents: Record<string, unknown>[] = [];
  let skippedEmptyRows = 0;
  let duplicateEmailAdjusted = 0;
  let duplicateRegistrationAdjusted = 0;

  for (let rowIndex = 1; rowIndex < matrix.length; rowIndex++) {
    const row = matrix[rowIndex] || [];

    const registrationNumber = normalizeText(row[columnIndex.registrationNumber]);
    const fullNameAr = normalizeText(row[columnIndex.fullNameAr]);
    const fullNameEn = normalizeText(row[columnIndex.fullNameEn]);
    const email = normalizeEmail(row[columnIndex.email]);

    if (!registrationNumber && !fullNameAr && !fullNameEn && !email) {
      skippedEmptyRows++;
      continue;
    }

    if (!registrationNumber || !fullNameAr || !fullNameEn || !email) {
      skippedEmptyRows++;
      continue;
    }

    let finalRegistrationNumber = registrationNumber;
    if (usedRegistrationNumbers.has(finalRegistrationNumber)) {
      duplicateRegistrationAdjusted++;
      finalRegistrationNumber = `${registrationNumber}-IMP-${rowIndex}`;
    }
    usedRegistrationNumbers.add(finalRegistrationNumber);

    let guestEmail = email;
    if (usedGuestEmails.has(guestEmail)) {
      duplicateEmailAdjusted++;
      const atIndex = email.indexOf('@');
      if (atIndex > 0) {
        const local = email.slice(0, atIndex);
        const domain = email.slice(atIndex + 1);
        guestEmail = `${local}+import-${rowIndex}@${domain}`;
      } else {
        guestEmail = `import-${rowIndex}-${email}`;
      }
    }

    const guestEmailNormalized = normalizeEmail(guestEmail);
    usedGuestEmails.add(guestEmailNormalized);

    const phone = columnIndex.phone >= 0 ? normalizeText(row[columnIndex.phone]) : '';
    const professionalCardUrl =
      columnIndex.professionalCardUrl >= 0
        ? normalizeText(row[columnIndex.professionalCardUrl])
        : '';
    const gender = columnIndex.gender >= 0 ? normalizeGender(row[columnIndex.gender]) : '';
    const country = columnIndex.country >= 0 ? normalizeText(row[columnIndex.country]) : '';
    const jobTitle = columnIndex.jobTitle >= 0 ? normalizeText(row[columnIndex.jobTitle]) : '';
    const specialty =
      columnIndex.specialty >= 0 ? normalizeText(row[columnIndex.specialty]) : '';
    const workplace =
      columnIndex.workplace >= 0 ? normalizeText(row[columnIndex.workplace]) : '';
    const status =
      columnIndex.status >= 0 ? normalizeStatus(row[columnIndex.status]) : 'confirmed';
    const createdAt =
      columnIndex.createdAt >= 0 ? parseDate(row[columnIndex.createdAt]) : new Date();
    const importedNotes = columnIndex.notes >= 0 ? normalizeText(row[columnIndex.notes]) : '';

    const notes = [
      importedNotes,
      guestEmail !== email ? `legacyEmail=${email}` : '',
      finalRegistrationNumber !== registrationNumber
        ? `legacyRegistrationNumber=${registrationNumber}`
        : '',
    ]
      .filter(Boolean)
      .join(' | ');

    documents.push({
      event: eventStorageValue,
      registrationSource: 'guest',
      guestEmail,
      guestEmailNormalized,
      identityEmailNormalized: `import:${eventId}:${rowIndex}:${email}`,
      participantNameArSnapshot: fullNameAr,
      participantNameEnSnapshot: fullNameEn,
      formData: {
        fullNameAr,
        fullNameEn,
        email,
        phone,
        country,
        jobTitle,
        specialty,
        gender,
        workplace,
        professionalCardDocument: professionalCardUrl
          ? {
              url: professionalCardUrl,
            }
          : null,
        profileDeclaration: true,
      },
      registrationNumber: finalRegistrationNumber,
      paymentStatus: 'free',
      status,
      notes,
      createdAt,
      updatedAt: createdAt,
    });
  }

  if (dryRun) {
    console.log('Dry run complete');
    console.log(`Rows parsed: ${matrix.length - 1}`);
    console.log(`Prepared inserts: ${documents.length}`);
    console.log(`Skipped rows: ${skippedEmptyRows}`);
    console.log(`Adjusted duplicate emails: ${duplicateEmailAdjusted}`);
    console.log(`Adjusted duplicate registration numbers: ${duplicateRegistrationAdjusted}`);
    await mongoose.disconnect();
    return;
  }

  if (documents.length > 0) {
    await registrationsCollection.insertMany(documents, { ordered: false });
  }

  const activeAttendees = await registrationsCollection.countDocuments({
    event: resolveEventQuery(eventId),
    status: { $ne: 'cancelled' },
  });

  await eventsCollection.updateOne(
    { _id: new mongoose.Types.ObjectId(eventId) },
    {
      $set: {
        currentAttendees: activeAttendees,
      },
    },
  );

  console.log('Import complete');
  console.log(`Rows parsed: ${matrix.length - 1}`);
  console.log(`Inserted registrations: ${documents.length}`);
  console.log(`Skipped rows: ${skippedEmptyRows}`);
  console.log(`Adjusted duplicate emails: ${duplicateEmailAdjusted}`);
  console.log(`Adjusted duplicate registration numbers: ${duplicateRegistrationAdjusted}`);
  console.log(`Event currentAttendees set to: ${activeAttendees}`);

  await mongoose.disconnect();
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('Import failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
