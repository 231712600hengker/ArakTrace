# Architecture Documentation

> **Pembaruan v2.** Dokumen ini awalnya menjelaskan versi 1. Perubahan utama: (1) autentikasi dan peran (Supabase Auth, `lib/auth.ts`, `lib/permissions.ts`), (2) model rantai pasok `producers`, `farmers`, `supply_events` dan status verifikasi pada `batches`, (3) OCR sertifikat lab (`app/api/lab-ocr/route.ts`), (4) retrieval BM25 di `lib/rag.ts`, (5) QR tanpa dependensi (`lib/qr.ts`), (6) model risiko hasil `ml/train_risk_model.py`. Ringkasan alur v2:

```mermaid
graph LR
  B[Browser] --> P[Pages app/*]
  P --> A[API Routes app/api/*]
  A --> AU[lib/auth.ts + lib/permissions.ts]
  AU --> SA[Supabase Auth]
  A --> D[lib/db.ts]
  D --> PG[(PostgreSQL, RLS)]
  D -.mode memori lokal.-> SD[data/seed.json]
  A --> R[lib/rag.ts BM25] --> CH[data/chunks.json]
  A --> G[Gemini: OCR / Advisor]
  A --> K[lib/risk.ts] --> M[data/model.json]
```

Rantai pasok mengikuti Pergub Bali No. 1/2020: perajin, koperasi, produsen, distributor, sub distributor, penjual langsung. Tahap produsen ke hilir hanya boleh untuk batch berstatus `verified` (`lib/permissions.ts`, `canAddEvent`); urutan tahap dijaga di `lib/db.ts` (`addEvent`).

---

## System Overview

ArakTrace.bali adalah aplikasi web full-stack yang dibangun dengan Next.js 14 menggunakan App Router. Backend menggunakan API Routes sebagai serverless functions yang berjalan di Vercel. Data disimpan di Supabase (PostgreSQL), dengan fallback ke in-memory data seed untuk development tanpa database.

## High-Level Architecture

```mermaid
graph TB
    User[User Browser]
    
    subgraph "Next.js Application (Vercel)"
        Pages[Pages/Components<br/>React Server & Client]
        API[API Routes<br/>Serverless Functions]
        
        subgraph "Business Logic"
            DB[lib/db.ts<br/>Database Layer]
            RAG[lib/rag.ts<br/>Retrieval System]
            Risk[lib/risk.ts<br/>Risk Scoring]
        end
    end
    
    subgraph "External Services"
        Supabase[(Supabase<br/>PostgreSQL)]
        Gemini[Gemini API<br/>Google AI]
    end
    
    subgraph "Static Data"
        Chunks[data/chunks.json<br/>Reference Documents]
        Model[data/model.json<br/>ML Model Parameters]
        Seed[data/seed.json<br/>Sample Data]
    end
    
    User -->|HTTP Request| Pages
    Pages -->|API Call| API
    
    API --> DB
    API --> RAG
    API --> Risk
    
    DB -->|Query| Supabase
    DB -.->|Fallback| Seed
    
    RAG --> Chunks
    Risk --> Model
    
    API -->|Generate Answer| Gemini
    API -.->|Fallback| Chunks
    
    Pages -->|Response| User
```

## Component Architecture

### Frontend Layer

**Location:** `app/`

#### Pages (Server Components)
- `/` - Halaman utama: form pencarian batch
- `/batch/[code]` - Detail batch: verifikasi dan skor risiko
- `/produsen` - Form pencatatan batch baru (Client Component)
- `/advisor` - AI chatbot advisor (Client Component)

#### Features
- **Server-Side Rendering** untuk halaman statis (homepage, batch detail)
- **Client-Side Rendering** untuk form interaktif dan chat
- **Loading States** dengan `loading.tsx`
- **Error Boundaries** dengan `error.tsx`
- **Not Found Handling** dengan `not-found.tsx`

### API Layer

**Location:** `app/api/`

#### Endpoints

1. **GET `/api/batches/[code]`**
   - Mendapatkan detail batch berdasarkan kode
   - Validasi: kode minimal 5 karakter, max 50 karakter
   - Response: batch data atau 404

2. **POST `/api/batches`**
   - Mencatat batch baru
   - Validasi: tipe data, range nilai, format tanggal
   - Response: kode batch baru + skor risiko
   - Error handling: 400 (validation), 503 (database)

3. **GET `/api/cooperatives`**
   - Mendapatkan daftar koperasi
   - Response: array {id, name, village, regency}
   - Error handling: 503 (database)

4. **POST `/api/advisor/chat`**
   - AI advisor endpoint
   - Rate limiting: 5 request/menit per IP
   - Caching: 10 menit untuk query identik
   - Timeout: 10 detik untuk Gemini API
   - Fallback: teks rujukan mentah jika LLM gagal
   - Error handling: 400 (validation), 429 (rate limit), 503 (database)

### Business Logic Layer

**Location:** `lib/`

#### Database Module (`lib/db.ts`)
```typescript
interface Functions {
  getCooperatives() → Cooperative[]
  getBatchView(code: string) → BatchView | null
  addBatch(data) → string (batch code)
}
```

**Strategi:**
- Cek environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Jika ada: gunakan Supabase client
- Jika tidak: fallback ke in-memory data dari `data/seed.json`
- Warning di console untuk fallback mode

#### RAG Module (`lib/rag.ts`)
```typescript
interface Functions {
  retrieve(question: string, limit?: number) → Retrieval[]
}
```

**Algoritma:**
1. Normalisasi query (lowercase, hapus tanda baca, split terms)
2. Scoring per chunk:
   - +1 per term yang match di body text
   - +3 per term yang match di keywords
3. Filter chunks dengan score ≥ 2
4. Sort by score descending, lalu by ID
5. Return top N chunks (default: 3)

**Data Source:** `data/chunks.json` (manual curation dari dokumen regulasi)

#### Risk Scoring Module (`lib/risk.ts`)
```typescript
interface Functions {
  scoreRisk(input: RiskInput) → RiskResult
}
```

**Algoritma:**
- Logistic Regression inference
- Features: distill_temp_c, distill_duration_min, equipment_sanitized, lab_tested
- Z-score normalization menggunakan mean/std dari training data
- Sigmoid function: P = 1 / (1 + e^(-z))
- Label: rendah (<0.3), sedang (0.3-0.7), tinggi (>0.7)
- Penjelasan faktor risiko berdasarkan nilai fitur

**Model Source:** `data/model.json` (weights, intercept, mean, std dari scikit-learn)

## Data Flow Examples

### Flow 1: User Mencari Batch

```mermaid
sequenceDiagram
    actor User
    participant Page as /batch/[code]
    participant API as GET /api/batches/[code]
    participant DB as lib/db.ts
    participant Supabase
    participant Risk as lib/risk.ts
    
    User->>Page: Buka URL dengan kode batch
    Page->>DB: getBatchView(code)
    DB->>Supabase: SELECT batch + cooperative + verifications
    Supabase-->>DB: Data batch
    DB->>Risk: scoreRisk(batch data)
    Risk-->>DB: Risk score + factors
    DB-->>Page: BatchView object
    Page-->>User: Render detail batch
```

### Flow 2: Koperasi Mencatat Batch Baru

```mermaid
sequenceDiagram
    actor Koperasi
    participant Form as /produsen (Client)
    participant API as POST /api/batches
    participant DB as lib/db.ts
    participant Supabase
    participant Risk as lib/risk.ts
    
    Koperasi->>Form: Isi form batch
    Form->>API: POST batch data
    API->>API: Validasi input
    API->>DB: addBatch(data)
    DB->>Supabase: INSERT batch
    DB->>Supabase: INSERT verifications
    Supabase-->>DB: Batch code
    DB->>Risk: scoreRisk(data)
    Risk-->>DB: Risk score
    DB-->>API: {code, risk}
    API-->>Form: Response
    Form-->>Koperasi: Tampilkan kode & skor
```

### Flow 3: AI Advisor Chat

```mermaid
sequenceDiagram
    actor User
    participant Chat as /advisor (Client)
    participant API as POST /api/advisor/chat
    participant Cache as In-Memory Cache
    participant RAG as lib/rag.ts
    participant Chunks as data/chunks.json
    participant Gemini as Gemini API
    
    User->>Chat: Kirim pertanyaan
    Chat->>API: POST {question, batch_code?}
    API->>API: Check rate limit
    API->>Cache: Check cache
    
    alt Cache hit
        Cache-->>API: Cached answer
        API-->>Chat: Response (cached)
    else Cache miss
        API->>RAG: retrieve(question)
        RAG->>Chunks: Load chunks
        RAG->>RAG: Score & rank
        RAG-->>API: Top 3 chunks
        
        alt Chunks found
            API->>Gemini: POST context + question
            
            alt Gemini success
                Gemini-->>API: Generated answer
                API->>Cache: Store answer
                API-->>Chat: Response (llm mode)
            else Gemini error/timeout
                API->>Cache: Store fallback
                API-->>Chat: Response (fallback mode)
            end
        else No chunks
            API-->>Chat: Response (no references)
        end
    end
    
    Chat-->>User: Tampilkan jawaban + sources
```

## Security Architecture

### Input Validation
- **Tipe data:** Validasi strict untuk number, string, boolean
- **Range:** Min/max untuk suhu (20-150°C), volume (1-100000L), durasi (1-1440 menit)
- **Format:** Regex untuk tanggal (YYYY-MM-DD), kode batch
- **Length:** Slice untuk string input (question: 500 char, lab_note: 300 char, batch_code: 50 char)
- **Body size:** Max 10KB per request

### Rate Limiting
- **Scope:** Per IP address (dari header x-forwarded-for atau x-real-ip)
- **Window:** 60 detik rolling window
- **Limit:** 5 requests per window untuk /api/advisor/chat
- **Storage:** In-memory Map (akan reset saat restart)
- **Response:** 429 status dengan retry_after_s

### API Security
- **Timeout:** 10 detik untuk external API calls (Gemini)
- **Fallback:** Graceful degradation jika API gagal
- **No leakage:** Error messages tidak expose stack trace atau internal details
- **Secrets:** Environment variables, tidak pernah di kode atau client-side

### Database Security
- **Service Role Key:** Hanya digunakan di server-side (lib/supabase.ts, dengan pengaman lib/server-only.ts)
- **No NEXT_PUBLIC_:** Key tidak ter-expose ke browser
- **Error handling:** Generic error messages untuk database failures

## Deployment Architecture

### Vercel (Production)
```
GitHub Repository
    ↓ (git push)
Vercel Build
    ↓
    ├─ Static Pages → CDN
    ├─ API Routes → Serverless Functions (Node.js 18)
    └─ Static Assets → CDN
    
Environment:
- GEMINI_API_KEY (encrypted)
- GEMINI_MODEL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (encrypted)
```

### External Dependencies
- **Supabase:** PostgreSQL database (Asia Southeast region recommended)
- **Gemini API:** Google Cloud (REST API, no SDK dependency)
- **CDN:** Vercel Edge Network untuk static assets

### Scaling Considerations
1. **Serverless Functions:** Auto-scale per request, cold start ~200-500ms
2. **Rate Limiting:** In-memory (single instance), consider Redis for multi-region
3. **Caching:** In-memory (per instance), consider Vercel KV or Redis for shared cache
4. **Database:** Supabase connection pooling, max connections berdasarkan plan

## Error Handling Strategy

### Frontend
- **Network errors:** Tampilkan pesan dengan langkah perbaikan
- **Validation errors:** Inline validation di form
- **Empty states:** Informasi "belum ada data" dengan CTA
- **Loading states:** Skeleton atau spinner dengan aria-live

### Backend
- **Validation errors:** 400 dengan detail field errors
- **Rate limiting:** 429 dengan retry_after
- **Database errors:** 503 generic message (no detail leak)
- **External API errors:** Fallback ke alternative behavior

### Monitoring
- Console warnings untuk fallback mode
- Error logs untuk debugging (tidak di-commit ke repo)
- Status codes yang tepat untuk observability

## Performance Optimization

### Frontend
- **Server Components:** Default untuk pages yang tidak butuh interaktivity
- **Code splitting:** Automatic by Next.js
- **Font optimization:** System fonts (no webfont loading)
- **CSS:** Single global.css, no runtime CSS-in-JS

### Backend
- **Static data:** chunks.json dan model.json di-load saat startup
- **Caching:** 10 menit TTL untuk identical queries
- **Connection reuse:** Supabase client singleton
- **Lazy loading:** Database fallback hanya load seed.json jika diperlukan

### Database
- **Indexes:** PRIMARY KEY, FOREIGN KEY sudah terindex otomatis
- **Single query:** getBatchView() menggunakan JOINs, bukan N+1 queries
- **Connection pooling:** Default Supabase (pgBouncer)

## Testing Strategy

### Unit Tests (Vitest)
- `lib/risk.test.ts` - Validasi konsistensi dengan model Python
- `lib/api.test.ts` - Validasi input validation functions

### Integration Tests
- Manual testing untuk API endpoints
- Browser testing untuk user flows

### Evaluation
- `scripts/eval-advisor.ts` - Uji retrieval topik dan sumber yang ditemukan BM25; bukan evaluasi kualitas atau akurasi jawaban AI Advisor
- `data/eval-questions.json` - Test cases dengan expected references

---

**Last Updated:** 5 November 2026
