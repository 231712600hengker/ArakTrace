import rawChunks from "@/data/chunks.json";
export type ReferenceChunk = { id: string; doc: string; text: string; keywords?: string[] };
export type Retrieval = ReferenceChunk & { score: number };

// Pencarian leksikal BM25 atas potongan rujukan (tanpa layanan eksternal, sehingga tetap jalan saat API AI gagal).
// Kata kunci kurasi (field `keywords`) dihitung KEYWORD_BOOST kali agar istilah penting lebih berbobot.
const K1 = 1.5;
const B = 0.75;
const KEYWORD_BOOST = 3;
const MIN_SCORE = 1.2;
const chunks = (rawChunks as ReferenceChunk[]).filter((c) => !c.doc.startsWith("PLACEHOLDER") && !c.text.includes("ISI DENGAN"));

export function normalize(text: string) { return text.toLocaleLowerCase("id-ID").replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim(); }
// Kata umum diabaikan agar pertanyaan di luar topik tidak cocok dengan dokumen hanya karena kata penghubung.
const STOPWORDS = new Set("yang dan di ke dari untuk dengan pada adalah ini itu apa bagaimana cara atau dalam oleh akan bisa boleh harus saya anda ada tidak jika juga berapa kenapa mengapa dapat serta sebagai siapa kapan dimana apakah bila agar para tersebut diperbolehkan dibolehkan diizinkan".split(" "));
// Stemming sangat ringan: hanya partikel/pronomina akhiran, supaya "batasnya" cocok dengan "batas".
const stem = (term: string) => (term.length > 5 ? term.replace(/(nya|lah|kah)$/, "") : term);
const terms = (text: string) => normalize(text).split(" ").filter((t) => t && !STOPWORDS.has(t)).map(stem);

type Indexed = { chunk: ReferenceChunk; tf: Map<string, number>; len: number };
const indexed: Indexed[] = chunks.map((chunk) => {
  const tf = new Map<string, number>();
  const add = (t: string, n: number) => tf.set(t, (tf.get(t) ?? 0) + n);
  for (const t of terms(`${chunk.doc} ${chunk.text}`)) add(t, 1);
  for (const t of (chunk.keywords ?? []).flatMap(terms)) add(t, KEYWORD_BOOST);
  return { chunk, tf, len: [...tf.values()].reduce((a, b) => a + b, 0) };
});
const avgLen = indexed.reduce((a, d) => a + d.len, 0) / Math.max(1, indexed.length);
const df = new Map<string, number>();
for (const d of indexed) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
const idf = (t: string) => Math.log(1 + (indexed.length - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));

export function retrieve(question: string, limit = 3): Retrieval[] {
  const queryTerms = [...new Set(terms(question))];
  if (!queryTerms.length) return [];
  return indexed.map(({ chunk, tf, len }) => {
    let score = 0; let matched = 0;
    for (const t of queryTerms) {
      const f = tf.get(t); if (!f) continue;
      matched += 1;
      score += idf(t) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * len) / avgLen)));
    }
    // Satu kata cocok saja dianggap kebetulan, kecuali pertanyaannya memang hanya satu kata kunci.
    if (matched < Math.min(2, queryTerms.length)) score = 0;
    return { ...chunk, score: Math.round(score * 100) / 100 };
  }).filter((r) => r.score >= MIN_SCORE).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}
