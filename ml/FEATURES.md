# Fitur skor risiko

Urutan dan rumus identik dengan `riskFeatures` di `lib/risk.ts` dan `FEATURES` di `ml/train_risk_model.py`.

| Fitur | Rumus | Dasar aturan (asumsi tim) |
|---|---|---|
| `temp_dev` | \|suhu − 78\| / 10 | Etanol mendidih sekitar 78 °C (metanol sekitar 65 °C); simpangan suhu ditandai |
| `short_duration` | 1 jika durasi < 90 menit, selain itu 0 | Heuristik tim, bukan standar resmi |
| `not_sanitized` | 1 jika alat belum dikonfirmasi bersih | Higienitas (Pergub No. 1/2020 menuntut standar keamanan dan mutu pangan) |
| `no_lab` | 1 jika belum ada hasil uji lab | Standar keamanan/metanol: Peraturan BPOM No. 5/2021 Pasal 4 |

Skor = round(100 · sigmoid(intercept + Σ koef · fitur)) / 100. Ambang: rendah < 0,33; sedang < 0,66; selain itu tinggi.

Aturan keras di luar model: hasil lab dengan metanol > 0,01% b/v (BPOM 5/2021 Pasal 4) selalu berlabel tinggi.
