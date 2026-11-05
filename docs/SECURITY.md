# Security Assessment & Remaining Risks

Dokumen ini mendokumentasikan langkah-langkah keamanan yang telah diimplementasi dan risiko yang masih ada di ArakTrace.bali.

## Pembaruan v2 (autentikasi, peran, OCR)

Bagian ini menggantikan butir "No Authentication" dan "Service Role Key Scope" di bawah untuk perubahan yang sudah dikerjakan.

- **Autentikasi dan peran:** Supabase Auth. Peran (`koperasi`, `produsen`, `verifikator`, `admin`) dibaca dari `app_metadata` (hanya bisa diubah lewat service role), bukan `user_metadata`. Logika: `lib/auth.ts`, aturan murni di `lib/permissions.ts` (diuji di `lib/permissions.test.ts`).
- **Penegakan hak akses di server:** pencatatan batch (hanya koperasi pemilik atau admin), verifikasi (verifikator/admin), peristiwa rantai (koperasi untuk tahap hulu; produsen untuk tahap hilir pada batch terverifikasi), OCR (koperasi/admin). Nama pelaku koperasi/produsen diambil dari akun, bukan dari input.
- **Tanpa Supabase Auth:** tulis-data hanya terbuka saat `NODE_ENV != production` atau jika `DEMO_OPEN_WRITE=true` dipasang sengaja. Di produksi tanpa konfigurasi auth, semua endpoint tulis mengembalikan 401 (diuji).
- **RLS:** aktif di semua tabel tanpa kebijakan untuk klien (akses langsung anon/authenticated ditolak). Aplikasi memakai service role di server, yang melewati RLS; karena itu hak akses ada di kode server. Kebijakan RLS per peran adalah pekerjaan lanjutan.
- **Pengganti `server-only`:** `lib/server-only.ts` melempar galat bila modul server terbundel ke browser (tanpa dependensi tambahan).
- **OCR:** hanya pengguna terautentikasi; tipe MIME dan ukuran dibatasi (≤ 4 MB); keluaran model divalidasi ketat; instruksi di dalam gambar diabaikan lewat prompt; hasil tidak disimpan tanpa konfirmasi pengguna.
- **Risiko tersisa:** rate limit/cache in-memory, kebijakan RLS per peran belum ada, belum ada log audit, QR belum anti-salin, verifikasi keaslian dokumen lab bergantung pada manusia.

---

## Implemented Security Measures

### 1. Input Validation

✅ **Implemented:**
- Validasi tipe data strict di semua API endpoints
- Range validation untuk angka (suhu: 20-150°C, volume: 1-100000L, durasi: 1-1440 menit)
- Format validation untuk tanggal (YYYY-MM-DD regex)
- String length limiting (question: 500 char, batch_code: 50 char, lab_note: 300 char)
- Body size limiting (max 10KB per request)

**Location:** `app/api/batches/route.ts`, `app/api/advisor/chat/route.ts`, `app/api/batches/[code]/route.ts`

### 2. Rate Limiting

✅ **Implemented:**
- 5 requests per minute per IP address untuk `/api/advisor/chat`
- Sliding window implementation (60 seconds)
- 429 status dengan retry_after information

**Location:** `app/api/advisor/chat/route.ts`

⚠️ **Limitation:** In-memory storage (Map), akan reset saat server restart. Tidak cocok untuk multi-instance deployment.

### 3. API Security

✅ **Implemented:**
- Timeout 10 detik untuk Gemini API calls
- Graceful fallback jika API gagal
- Error messages tidak expose stack traces
- Generic error messages untuk database failures
- AbortController untuk cancel long-running requests

**Location:** `app/api/advisor/chat/route.ts`

### 4. Secrets Management

✅ **Implemented:**
- Semua secrets di environment variables
- No hardcoded keys di source code
- `.env` dan `.env.local` di .gitignore
- `.env.example` hanya template tanpa nilai real
- `SUPABASE_SERVICE_ROLE_KEY` server-only (no `NEXT_PUBLIC_`)

**Verified:** Git history clean, no secrets committed

### 5. Database Security

✅ **Implemented:**
- Service role key hanya digunakan di server-side (`lib/supabase.ts`)
- No direct SQL injection vectors (menggunakan Supabase client)
- Error handling tanpa detail leakage

**Location:** `lib/db.ts`, `lib/supabase.ts`

### 6. Response Caching

✅ **Implemented:**
- 10 menit TTL untuk identical queries di AI Advisor
- Cache key berdasarkan question + batch_code
- In-memory Map storage

**Location:** `app/api/advisor/chat/route.ts`

⚠️ **Limitation:** Cache per instance, tidak shared di multi-instance deployment.

## Remaining Security Risks

### 1. No Authentication/Authorization ⚠️ HIGH PRIORITY

**Risk:** Siapa saja dapat:
- Menambah batch baru (POST /api/batches)
- Query AI Advisor tanpa batas (limited hanya by rate limiting)
- Akses semua data batch

**Impact:**
- Data pollution: user jahat dapat menambah batch fake
- Resource abuse: spamming endpoints
- No audit trail: tidak tahu siapa yang menambah data

**Mitigation Options:**
1. Implementasi authentication (NextAuth.js, Clerk, atau Supabase Auth)
2. Role-based access control (perajin vs pembeli vs admin)
3. API key untuk integrasi eksternal

**Status:** BELUM DIIMPLEMENTASI (out of scope untuk MVP)

### 2. Rate Limiting Limitations ⚠️ MEDIUM PRIORITY

**Risk:** Rate limiting berbasis in-memory Map:
- Reset setiap server restart
- Tidak shared antar instances di production
- User bisa bypass dengan restart connection atau ganti IP

**Impact:**
- Resource exhaustion via Gemini API calls
- Cost overrun untuk external API usage

**Mitigation Options:**
1. Implementasi Redis atau Vercel KV untuk shared rate limit state
2. Cloudflare rate limiting di edge
3. Vercel Edge Middleware untuk rate limiting
4. API quota limit di Gemini console

**Status:** Basic implementation ada, advanced solution belum

### 3. No CSRF Protection ⚠️ MEDIUM PRIORITY

**Risk:** API endpoints tidak memiliki CSRF token validation

**Impact:**
- Malicious site dapat trigger POST requests ke /api/batches
- User yang authenticated (jika ada auth di masa depan) bisa di-exploit

**Mitigation Options:**
1. Implementasi CSRF tokens untuk state-changing operations
2. SameSite cookie attributes
3. Origin/Referer header validation

**Status:** BELUM DIIMPLEMENTASI (less critical tanpa auth)

### 4. No Request Signature/HMAC ⚠️ LOW PRIORITY

**Risk:** Tidak ada signature verification untuk requests

**Impact:**
- Sulit verify integrity dari requests
- Replay attacks possible

**Mitigation Options:**
1. HMAC signature untuk critical endpoints
2. Nonce/timestamp untuk prevent replay

**Status:** BELUM DIIMPLEMENTASI (overkill untuk current scope)

### 5. SQL Injection (Theoretical) ⚠️ LOW PRIORITY

**Risk:** Menggunakan Supabase client yang parameterized, tapi jika ada direct SQL di masa depan bisa vulnerable

**Impact:**
- Data breach
- Data manipulation

**Mitigation:**
- SUDAH MITIGASI: Menggunakan Supabase client API (parameterized)
- Jangan pernah concat string SQL
- Code review untuk raw SQL

**Status:** LOW RISK dengan current implementation

### 6. No Content Security Policy ⚠️ LOW PRIORITY

**Risk:** Tidak ada CSP headers

**Impact:**
- XSS vulnerabilities jika ada user-generated content di-render
- Inline script injection

**Mitigation Options:**
1. Tambahkan CSP headers di `next.config.mjs`
2. Restrict script sources, style sources

**Status:** LOW RISK (no user-generated HTML rendering)

### 7. Gemini API Key Exposure Risk ⚠️ MEDIUM PRIORITY

**Risk:** Jika environment variable leaked, API key dapat di-abuse

**Impact:**
- Unlimited API calls menggunakan key kita
- Cost overrun
- Quota exhaustion

**Mitigation:**
1. ✅ Key stored di environment variables (encrypted di Vercel)
2. ✅ Tidak di-expose ke client-side
3. ⚠️ No API usage monitoring/alerting
4. ⚠️ No API quota limit enforcement

**Recommendation:**
- Set quota limit di Google Cloud Console
- Monitor usage di Gemini API dashboard
- Rotate key secara periodik

### 8. No Input Sanitization for Display ⚠️ LOW PRIORITY

**Risk:** User input (lab_note, pertanyaan advisor) tidak di-sanitize sebelum display

**Impact:**
- XSS jika React escaping gagal
- HTML injection

**Mitigation:**
- ✅ React auto-escapes text content
- ⚠️ Tidak ada explicit sanitization library (DOMPurify)

**Status:** MITIGATED by React, but not hardened

### 9. No Logging/Monitoring ⚠️ MEDIUM PRIORITY

**Risk:** Tidak ada structured logging atau monitoring

**Impact:**
- Sulit detect abuse patterns
- Sulit debug production issues
- No audit trail

**Mitigation Options:**
1. Implementasi structured logging (Winston, Pino)
2. Send logs ke monitoring service (Datadog, Sentry)
3. Alert untuk anomalous patterns

**Status:** BELUM DIIMPLEMENTASI

### 10. Supabase Service Role Key Scope ⚠️ MEDIUM PRIORITY

**Risk:** Service role key memiliki full access ke database

**Impact:**
- Jika key leaked, full database access
- No principle of least privilege

**Mitigation:**
1. Gunakan anon key + Row Level Security (RLS) untuk read operations
2. Reserve service role key hanya untuk write operations yang authenticated
3. Implementasi RLS policies di Supabase

**Status:** BELUM DIIMPLEMENTASI (menggunakan service role untuk simplicity)

## Security Checklist untuk Production

### Before Launch

- [x] Secrets tidak ter-commit di git
- [x] .env di .gitignore
- [x] Input validation di semua endpoints
- [x] Rate limiting implemented
- [x] Error messages tidak expose internal details
- [ ] Authentication implemented
- [ ] HTTPS enforced (Vercel default)
- [ ] CSP headers configured
- [ ] Logging dan monitoring setup

### Ongoing Monitoring

- [ ] Monitor Gemini API usage dan cost
- [ ] Monitor Supabase quota
- [ ] Review Vercel logs untuk abuse patterns
- [ ] Rotate API keys setiap 90 hari
- [ ] Security audit setiap major release

## Contact for Security Issues

Jika menemukan security vulnerability:

**DO NOT** open public issue di GitHub

**DO** contact:
- [ISI - Email ketua tim atau security contact]
- [ISI - Kontak pribadi team lead]

---

**Last Updated:** 5 November 2026  
**Next Review:** Setelah deployment produksi dan sebelum judging
