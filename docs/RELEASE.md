# Release Checklist untuk Submission

Dokumen ini berisi langkah-langkah yang harus dilakukan sebelum submit project ArakTrace.bali untuk AI Web Innovation Challenge.

## Pre-Release Checklist

### 1. Content Completion

- [ ] **data/chunks.json** sudah diisi dengan dokumen rujukan resmi (bukan PLACEHOLDER)
  - Pastikan semua chunk memiliki field `id`, `doc`, `text`, dan `keywords`
  - Hapus atau ganti semua entry yang mengandung "PLACEHOLDER"
  - Source documents harus disebutkan di README.md bagian Third-party Resources

- [ ] **data/model.json** sudah diisi dengan parameter model hasil training
  - Pastikan tidak ada placeholder values
  - Validasi dengan running `npm test` - risk.test.ts harus pass

- [ ] **README.md** sudah lengkap
  - Section [ISI] sudah diisi:
    - Deployment URL
    - Team Members (nama + role)
    - Third-party Resources (daftar dokumen rujukan)

- [ ] **DISCLOSURE.md** sudah lengkap
  - Section [ISI] sudah diisi:
    - Repository URL
    - Daftar dokumen sumber untuk chunks.json
    - Last Updated date
    - Team member name

- [ ] **docs/architecture.md** sudah update
  - Last Updated date sudah diisi

### 2. Code Quality

- [ ] **Run pre-submit script:**
  ```bash
  # Windows PowerShell
  .\scripts\pre-submit.ps1
  
  # Linux/Mac
  bash scripts/pre-submit.sh
  ```
  
- [ ] Semua checks pass:
  - ✓ No PLACEHOLDER in data/
  - ✓ No [ISI] markers in docs
  - ✓ No secrets in git
  - ✓ Build successful
  - ✓ All tests pass
  - ✓ All required files exist

- [ ] **TypeScript strict mode checks pass**
  ```bash
  npm run build
  ```
  - No type errors
  - No unused variables warnings (that should be fixed)

- [ ] **All tests pass**
  ```bash
  npm test
  ```

### 3. Security Audit

- [ ] **No secrets in repository**
  - Run: `git log --all --full-history -S "GEMINI_API_KEY"`
  - Run: `git log --all --full-history -S "SUPABASE_SERVICE_ROLE_KEY"`
  - Both should return empty or only show .env.example

- [ ] **.env and .env.local are gitignored**
  - Check: `git status` should not show .env files
  - Check: `git ls-files | grep .env` should only show .env.example

- [ ] **API keys are only in environment variables**
  - No hardcoded keys in source code
  - .env.example has template values only (no real keys)

### 4. Deployment

- [ ] **Vercel project setup**
  - Project created di Vercel dashboard
  - Connected to GitHub repository
  - Auto-deploy enabled untuk main/master branch

- [ ] **Environment variables configured di Vercel**
  - `GEMINI_API_KEY` (encrypted)
  - `GEMINI_MODEL` (e.g., gemini-2.5-flash-lite)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (encrypted)

- [ ] **Production build successful di Vercel**
  - Check deployment logs
  - No build errors

- [ ] **Production URL accessible**
  - Copy URL dari Vercel deployment
  - Paste ke README.md bagian Deployment URL
  - Test URL dari browser incognito

### 5. Functional Testing

Test semua fitur dari production URL (incognito browser):

#### Homepage (/)
- [ ] Form pencarian batch dapat disubmit
- [ ] 3 contoh kode batch ditampilkan sebagai button/link
- [ ] Klik contoh kode membuka halaman batch yang benar
- [ ] Input kosong menampilkan error yang jelas

#### Batch Detail (/batch/[code])
- [ ] Informasi batch tampil lengkap (koperasi, tanggal, volume, dll)
- [ ] Status verifikasi tampil dengan icon/indikator yang jelas
- [ ] Skor risiko tampil dengan label dan penjelasan faktor
- [ ] Tombol "Tanya Advisor tentang batch ini" berfungsi
- [ ] Disclaimer ditampilkan
- [ ] Kode batch tidak valid menampilkan not-found page

#### Produsen (/produsen)
- [ ] Form pencatatan batch dapat diisi
- [ ] Dropdown koperasi terisi dari database
- [ ] Semua field validation berfungsi
- [ ] Submit berhasil menampilkan kode batch baru + skor risiko
- [ ] Tampil 2 link: "Lihat halaman batch" dan "Tanya Advisor"
- [ ] Error handling jelas jika submit gagal

#### AI Advisor (/advisor)
- [ ] 3 contoh pertanyaan ditampilkan sebagai button
- [ ] Klik contoh mengirim pertanyaan dan mendapat jawaban
- [ ] Input manual pertanyaan berfungsi
- [ ] Jawaban ditampilkan dengan sumber rujukan
- [ ] Disclaimer ditampilkan
- [ ] Query parameter ?batch=<code> menampilkan chip konteks
- [ ] Chip konteks dapat dihapus dengan tombol ×
- [ ] Rate limiting berfungsi setelah 5 request

#### Responsive & Accessibility
- [ ] Test di mobile (375px width)
  - No horizontal scroll
  - Buttons minimal 44px tap target
  - Text readable tanpa zoom

- [ ] Test keyboard navigation
  - Tab order logical
  - Focus indicators visible (outline)
  - Form dapat disubmit dengan Enter

- [ ] Test dengan screen reader (optional but recommended)
  - aria-label pada input tanpa label visible
  - role="alert" pada error messages
  - role="status" pada loading states

### 6. Documentation Review

- [ ] **README.md** mudah dipahami oleh juri
  - Problem statement jelas
  - Key features explained
  - Tech stack listed
  - AI implementation explained dengan detail
  - Run instructions lengkap dan benar
  - Known limitations jujur

- [ ] **DISCLOSURE.md** complete dan accurate
  - Semua dependencies listed
  - Licenses correct
  - AI assistant usage disclosed
  - Data sources cited

- [ ] **docs/architecture.md** memiliki diagram yang clear
  - Mermaid diagrams render correctly di GitHub
  - Sequence diagrams show complete flows
  - System architecture diagram complete

### 7. Git Repository

- [ ] **Commit history clean**
  - No commits dengan message "test", "wip", "fix" tanpa context
  - No merge conflicts unresolved
  - No TODO/FIXME comments yang belum di-resolve

- [ ] **Create release tag**
  ```bash
  git tag -a v1.0-submission -m "Submission untuk AI Web Innovation Challenge"
  git push origin v1.0-submission
  ```

- [ ] **Record commit hash**
  ```bash
  git rev-parse HEAD
  ```
  Simpan hash ini di dokumen submission (jika diminta panitia)

### 8. Final Checks

- [ ] **Screenshot/Screen recording**
  - Ambil screenshot dari setiap halaman utama
  - (Optional) Record video demo 2-3 menit
  - Simpan di folder terpisah, tidak di-commit ke repo

- [ ] **Backup**
  - Backup repository ke external storage
  - Backup database dump dari Supabase
  - Backup environment variables (di dokumen secure, bukan di git)

- [ ] **Team Review**
  - Minimal 1 anggota tim lain sudah review code
  - Minimal 1 orang sudah test dari device berbeda

## Submission Day Checklist

### Morning of Submission

- [ ] **Final deployment check**
  - Production URL masih accessible
  - Tidak ada recent deployment errors
  - Environment variables masih ter-set

- [ ] **Final test dari fresh browser**
  - Clear cache atau gunakan incognito
  - Test critical path: search → batch detail → advisor
  - Test form submission

- [ ] **Verify all links in README work**
  - Deployment URL
  - Repository URL (jika public)
  - No broken links

### Submission Form (jika ada)

- [ ] Project name: **ArakTrace.bali**
- [ ] Team name: [ISI]
- [ ] Category: AI Web Innovation
- [ ] Repository URL: [ISI]
- [ ] Deployment URL: [ISI dari Vercel]
- [ ] Video demo URL (if required): [ISI]
- [ ] Team members: [ISI]

### After Submission

- [ ] **Do NOT make breaking changes**
  - Jangan deploy major updates sampai judging selesai
  - Bug fixes minor OK, tapi test dulu

- [ ] **Monitor uptime**
  - Check Vercel dashboard untuk errors
  - Check Supabase quota/usage

- [ ] **Keep environment variables active**
  - Jangan revoke API keys sampai kompetisi selesai
  - Keep database accessible

## Troubleshooting

### Pre-submit script gagal

**Error: PLACEHOLDER found**
- Edit data/chunks.json dan ganti semua PLACEHOLDER dengan content asli

**Error: [ISI] found**
- Edit README.md dan DISCLOSURE.md, isi semua section yang ditandai [ISI]

**Error: Build failed**
- Run `npm run build` manual untuk lihat error detail
- Fix TypeScript errors
- Pastikan semua imports benar

**Error: Tests failed**
- Run `npm test` manual untuk lihat error detail
- Periksa data/model.json dan data/risk-fixtures.json konsisten

### Deployment issues

**Build gagal di Vercel**
- Check deployment logs di Vercel dashboard
- Pastikan Node.js version compatible (18+)
- Pastikan semua dependencies di package.json

**Environment variables tidak terdeteksi**
- Re-deploy setelah set environment variables
- Pastikan variable names exact match (case-sensitive)
- Jangan gunakan NEXT_PUBLIC_ prefix untuk server-only vars

**Database connection error**
- Verify SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
- Test connection dengan script: `tsx scripts/seed.ts`
- Check Supabase project masih active

**Gemini API error**
- Verify GEMINI_API_KEY valid
- Check API quota/limit
- Fallback mode akan active otomatis jika API gagal

## Contact

Jika ada masalah urgent sebelum submission deadline:
- [ISI - Nama dan kontak ketua tim]
- [ISI - Nama dan kontak tech lead]

---

**Last Updated:** 5 November 2026

**Good luck dengan submission! 🚀**
