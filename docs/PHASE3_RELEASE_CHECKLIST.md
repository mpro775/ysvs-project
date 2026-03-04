# Phase 3 Release Checklist

## Security Hardening

- [ ] `STORAGE_PROVIDER` set correctly (`r2` in production, `local` in development).
- [ ] `R2_PUBLIC_URL` configured and reachable over HTTPS.
- [ ] R2 bucket credentials use least privilege (put/get/delete only for needed bucket).
- [ ] Registration upload endpoint rejects oversized files (> 10MB transport limit).
- [ ] Field-level file rules are enforced (allowed types + max file size in MB).
- [ ] Folder paths are sanitized (no path traversal risk).

## Reliability

- [ ] Slug availability endpoint works before create/update submit.
- [ ] Registration file upload succeeds with retry on transient network errors.
- [ ] Attendance API handles both mark attended and revert to confirmed.
- [ ] Admin registrants table shows uploaded file links when available.
- [ ] Excel export includes readable values for dynamic/file fields.

## UAT (Manual)

- [ ] Create event with valid data and publish flow succeeds.
- [ ] Create event with duplicate slug is blocked in UI.
- [ ] End date before start date is blocked.
- [ ] Registration deadline after start date is blocked.
- [ ] Dynamic registration with file upload succeeds.
- [ ] Disallowed file type is rejected with clear message.
- [ ] Oversized file is rejected with clear message.
- [ ] Admin can open uploaded file from registrants page.

## Operations

- [ ] Backend `npm run build` passes.
- [ ] Frontend `npm run build` passes.
- [ ] Environment variables documented in deployment platform.
- [ ] Monitoring/alerts configured for upload failures and 5xx spikes.
