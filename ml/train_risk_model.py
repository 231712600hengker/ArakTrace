"""Skor risiko ArakTrace: pembangkit data SINTETIS + pelatihan regresi logistik.

Jalankan dari akar repo:  python ml/train_risk_model.py
Keluaran: data/model.json, data/risk-fixtures.json, ml/training_report.json

PENTING (baca sebelum mengklaim apa pun):
- Label dibangkitkan dari aturan domain di bawah ini + derau acak. Model hanya
  mempelajari ulang aturan tersebut; ini BUKAN model prediktif yang divalidasi
  pada data lapangan dan tidak mendeteksi metanol. Keamanan hanya dipastikan uji lab.
- Metrik (AUC/akurasi) dihitung pada data sintetis yang sama distribusinya dan
  tidak menggambarkan kinerja di dunia nyata.
"""
import json
import math
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split

SEED = 20261104
N = 6000
ROOT = Path(__file__).resolve().parent.parent
FEATURES = ["temp_dev", "short_duration", "not_sanitized", "no_lab"]

# Aturan domain (asumsi tim, dapat diubah dan dipertanggungjawabkan):
#  1. Etanol mendidih sekitar 78 C (metanol sekitar 65 C), sehingga simpangan suhu dari
#     78 C ditandai. Fitur: |suhu - 78| / 10.
#  2. Durasi destilasi < 90 menit ditandai (heuristik tim, bukan standar resmi).
#  3. Alat yang belum dikonfirmasi bersih menaikkan risiko (higienitas).
#  4. Belum ada uji lab menaikkan risiko (standar keamanan/metanol: Peraturan BPOM 5/2021 Pasal 4).
RULE = {"intercept": -2.3, "temp_dev": 1.1, "short_duration": 0.8, "not_sanitized": 1.5, "no_lab": 1.0, "noise_sd": 0.5}

LABELS = {
    "temp_dev": "Suhu destilasi menyimpang dari rentang acuan",
    "short_duration": "Durasi destilasi singkat",
    "not_sanitized": "Kebersihan alat belum dikonfirmasi",
    "no_lab": "Belum ada hasil uji laboratorium",
}


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


def generate(rng, n):
    near = rng.random(n) < 0.6
    temp = np.where(near, rng.normal(79, 3, n), rng.uniform(60, 105, n)).clip(50, 120)
    duration = rng.normal(130, 50, n).clip(20, 300)
    sanitized = rng.random(n) < 0.75
    lab = rng.random(n) < 0.5
    X = np.column_stack([np.abs(temp - 78) / 10, (duration < 90).astype(float), (~sanitized).astype(float), (~lab).astype(float)])
    z = RULE["intercept"] + X @ np.array([RULE[f] for f in FEATURES]) + rng.normal(0, RULE["noise_sd"], n)
    y = (rng.random(n) < sigmoid(z)).astype(int)
    return X, y


def js_round2(x):
    return math.floor(x * 100 + 0.5) / 100  # setara Math.round(100*x)/100 untuk x >= 0


def main():
    rng = np.random.default_rng(SEED)
    X, y = generate(rng, N)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=SEED, stratify=y)
    clf = LogisticRegression(C=1e6, max_iter=1000).fit(Xtr, ytr)
    proba = clf.predict_proba(Xte)[:, 1]
    report = {
        "seed": SEED, "n_samples": N, "positive_rate": round(float(y.mean()), 3),
        "auc_holdout_sintetis": round(float(roc_auc_score(yte, proba)), 3),
        "accuracy_holdout_sintetis": round(float(accuracy_score(yte, proba >= 0.5)), 3),
        "rule": RULE,
        "catatan": "Metrik pada data sintetis; tidak menggambarkan kinerja di dunia nyata.",
    }
    model = {
        "version": "1.0.0-synthetic",
        "trained_on": "data sintetis berbasis aturan domain (ml/train_risk_model.py, seed %d)" % SEED,
        "intercept": round(float(clf.intercept_[0]), 4),
        "coef": {f: round(float(c), 4) for f, c in zip(FEATURES, clf.coef_[0])},
        "labels": LABELS,
        "thresholds": {"rendah": 0.33, "sedang": 0.66},
    }
    (ROOT / "data" / "model.json").write_text(json.dumps(model, indent=2, ensure_ascii=False) + "\n")

    def score(temp, dur, san, lab):
        f = [abs(temp - 78) / 10, 1.0 if dur < 90 else 0.0, 0.0 if san else 1.0, 0.0 if lab else 1.0]
        z = model["intercept"] + sum(model["coef"][n] * v for n, v in zip(FEATURES, f))
        return js_round2(1 / (1 + math.exp(-z)))

    cases = [(78, 150, True, True), (92, 150, True, False), (92, 60, False, False), (80, 120, True, False), (70, 100, True, True), (78, 45, False, True)]
    fixtures = [{"input": {"distill_temp_c": t, "distill_duration_min": d, "equipment_sanitized": s, "lab_tested": l}, "expected_score": score(t, d, s, l)} for t, d, s, l in cases]
    (ROOT / "data" / "risk-fixtures.json").write_text(json.dumps(fixtures, indent=2) + "\n")
    (ROOT / "ml" / "training_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(json.dumps(model["coef"]), model["intercept"])


if __name__ == "__main__":
    main()
