# ML: skor risiko batch

Pipeline yang dapat direproduksi, seluruhnya pada **data sintetis**.

```bash
pip install -r ml/requirements.txt
python ml/train_risk_model.py
```

Keluaran: `data/model.json` (koefisien yang dipakai `lib/risk.ts`), `data/risk-fixtures.json` (kasus uji untuk `lib/risk.test.ts`), `ml/training_report.json` (metrik sintetis).

Cara kerja: skrip membangkitkan 6.000 sampel (seed tetap), memberi label dari aturan domain + derau acak, melatih regresi logistik (scikit-learn), dan mengekspor koefisien. Karena label berasal dari aturan yang sama, model hanya mempelajari ulang aturan tersebut. **Jangan mengklaim akurasi nyata atau kemampuan mendeteksi metanol**; keamanan hanya dipastikan uji laboratorium. Untuk model sungguhan diperlukan data lab terlabel dari lapangan.
