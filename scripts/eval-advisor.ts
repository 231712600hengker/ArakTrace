import questions from "../data/eval-questions.json";
import { normalize, retrieve } from "../lib/rag";

type Question = { question: string; expected_topic: string; should_reject: boolean };
const rows = questions as Question[];
const result = rows.map((item) => {
  const hits = retrieve(item.question);
  const mode = hits.length ? "llm" : "fallback";
  const topicTerms = normalize(item.expected_topic).split(" ").filter(Boolean);
  const sourceText = hits.map((hit) => `${hit.doc} ${hit.text} ${(hit.keywords ?? []).join(" ")}`).join(" ");
  const topicMatched = topicTerms.length > 0 && topicTerms.some((term) => normalize(sourceText).includes(term));
  const passed = item.should_reject ? hits.length === 0 && mode === "fallback" : hits.length > 0 && topicMatched;
  return { pertanyaan: item.question, sumber: hits.map((hit) => hit.id).join(", ") || "-", mode, hasil: passed ? "lolos" : "gagal" };
});
console.table(result);
if (result.some((row) => row.hasil === "gagal")) process.exitCode = 1;
