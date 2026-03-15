import type { Question } from "@/types";

function extractQuizSection(text: string): string {
  const patterns = [
    /câu\s*1[\.\)]/i,
    /question\s*1[\.\)]/i,
    /^1[\.\)]\s/m,
    /trắc nghiệm/i,
    /phần\s*(i|1|a)[\.\):\s]/i,
  ];
  let startIdx = 0;
  for (const pattern of patterns) {
    const match = text.search(pattern);
    if (match !== -1 && match < text.length * 0.6) {
      startIdx = match;
      break;
    }
  }
  return text.slice(startIdx, startIdx + 5000);
}

export async function parseQuestionsWithAI(text: string): Promise < {
  title: string;
  questions: Question[];
} > {
  const quizText = extractQuizSection(text);
  
  const prompt = `Bạn là công cụ phân tích đề thi trắc nghiệm chuyên nghiệp.
Từ đoạn văn bản sau, tìm tất cả câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D).
Đáp án đúng: in đậm/nghiêng/gạch chân → nếu không có dấu hiệu thì correctIndex = 0.

VĂN BẢN:
${quizText}

Trả về JSON THUẦN TÚY (không backtick, không markdown):
{"title":"tên đề","questions":[{"text":"câu hỏi","options":["A. ...","B. ...","C. ...","D. ..."],"correctIndex":0,"short":true}]}

"short"=true nếu tất cả đáp án dưới 45 ký tự. Chỉ JSON, không text khác.`;
  
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
      }),
    }
  );
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${err.slice(0, 200)}`);
  }
  
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = raw.replace(/```json|```/g, "").trim();
  
  const parsed = JSON.parse(clean);
  return {
    title: parsed.title || "Bài kiểm tra",
    questions: parsed.questions || [],
  };
}