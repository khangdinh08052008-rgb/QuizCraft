import type { Question } from "@/types";

export async function parseQuestionsWithAI(text: string): Promise<{
  title: string;
  questions: Question[];
}> {
  const prompt = `Bạn là công cụ phân tích đề thi trắc nghiệm chuyên nghiệp.

Từ đoạn văn bản sau (có thể bao gồm phần mở đầu, cấu trúc đề, hướng dẫn — HÃY BỎ QUA những phần đó và CHỈ lấy câu hỏi trắc nghiệm 4 lựa chọn).

QUY TẮC XÁC ĐỊNH ĐÁP ÁN ĐÚNG (theo thứ tự ưu tiên):
1. Chữ cái hoặc cả câu được in đậm (**text**, __text__, hoặc dày hơn)
2. Chữ cái hoặc cả câu được in nghiêng (*text*, _text_)
3. Có dấu gạch chân hoặc ký hiệu đặc biệt kèm theo
4. Có chú thích "đáp án", "answer", "correct" gần đó
5. Nếu không có dấu hiệu → correctIndex = 0 (mặc định chọn A)

VĂN BẢN ĐỀ THI:
${text.substring(0, 7000)}

Trả về JSON THUẦN TÚY (không có markdown, không có backtick \`\`\`):
{
  "title": "tên đề thi hoặc 'Bài kiểm tra'",
  "questions": [
    {
      "text": "nội dung câu hỏi đầy đủ",
      "options": ["A. nội dung", "B. nội dung", "C. nội dung", "D. nội dung"],
      "correctIndex": 0,
      "short": true
    }
  ]
}

"short" = true nếu TẤT CẢ 4 đáp án đều dưới 45 ký tự (sẽ hiển thị dạng lưới 2 cột).
Chỉ trả về JSON, không có bất kỳ text nào khác.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

  const data = await res.json();
  const raw = data.content?.map((b: { text?: string }) => b.text || "").join("") || "";
  const clean = raw.replace(/```json|```/g, "").trim();

  const parsed = JSON.parse(clean);
  return {
    title: parsed.title || "Bài kiểm tra",
    questions: parsed.questions || [],
  };
}
