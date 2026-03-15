# ⚡ QuizCraft

Ứng dụng làm bài kiểm tra trắc nghiệm thông minh — import PDF/DOCX, AI tự phân tích câu hỏi.

**Stack:** Next.js 14 · Supabase · Anthropic Claude API · Vercel

---

## 🗂 Cấu trúc project

```
quizcraft/
├── app/
│   ├── api/
│   │   ├── exams/route.ts       ← Upload + AI parse file
│   │   ├── results/route.ts     ← Lưu kết quả làm bài
│   │   └── auth/route.ts        ← Đăng nhập / đăng ký
│   ├── dashboard/page.tsx       ← Trang quản lý (chủ đề)
│   ├── login/page.tsx           ← Đăng nhập / đăng ký
│   ├── quiz/[id]/
│   │   ├── page.tsx             ← Giao diện làm bài
│   │   └── result/page.tsx      ← Kết quả
│   ├── page.tsx                 ← Trang chủ (danh sách đề)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Navbar.tsx
│   └── Toast.tsx
├── lib/
│   ├── supabase.ts              ← Supabase client (browser)
│   ├── supabase-server.ts       ← Supabase client (server)
│   └── ai-parser.ts             ← Gọi Claude API parse đề thi
├── types/index.ts
├── supabase-schema.sql          ← Chạy 1 lần trong Supabase
└── .env.local.example
```

---

## 🚀 Hướng dẫn cài đặt (15 phút)

### Bước 1 — Tạo Supabase project

1. Vào [supabase.com](https://supabase.com) → **New project**
2. Vào **SQL Editor** → paste toàn bộ nội dung file `supabase-schema.sql` → **Run**
3. Vào **Settings → API** → copy:
   - `Project URL`
   - `anon public` key

### Bước 2 — Lấy Anthropic API key

1. Vào [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → **Create Key** → copy key

### Bước 3 — Cài đặt project

```bash
# Clone hoặc copy project vào thư mục
cd quizcraft

# Cài dependencies
npm install

# Tạo file .env.local từ template
cp .env.local.example .env.local
```

Mở `.env.local` và điền vào:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-...
```

### Bước 4 — Chạy local

```bash
npm run dev
# Mở http://localhost:3000
```

### Bước 5 — Deploy lên Vercel (tùy chọn)

```bash
npm install -g vercel
vercel
# Nhập 3 biến môi trường khi được hỏi
```

Hoặc push lên GitHub → import vào [vercel.com](https://vercel.com) → thêm env vars trong Settings.

---

## 👥 Phân quyền

| Vai trò | Đăng ký | Chức năng |
|---------|---------|-----------|
| **👑 Chủ đề** | Chọn "Giáo viên" khi đăng ký | Upload file, quản lý đề thi, xem trước |
| **🎓 Học sinh** | Chọn "Học sinh" khi đăng ký | Làm bài, xem kết quả |

---

## 📄 Format file đề thi được hỗ trợ

- **PDF** — AI đọc toàn bộ text, bỏ qua phần mở đầu
- **DOCX / DOC** — Nhận diện đáp án in đậm/nghiêng/gạch chân
- **TXT** — Format thô

**Đáp án đúng được nhận diện qua:**
- In đậm (**text**)
- In nghiêng (*text*)
- Gạch chân
- Ký hiệu đặc biệt kèm theo chữ A/B/C/D

---

## 🎮 Cơ chế làm bài

- **Chọn đúng ngay** → "Xuất sắc, giữ vững phong độ nhé! 🌟"
- **Chọn sai rồi đúng** → "Cố gắng, cẩn thận hơn nhé 👍"
- **Chọn sai** → "Không đúng, vui lòng thử lại 🔄"
- Đáp án ngắn (< 45 ký tự) → hiển thị **2 cột ngang**
- Đáp án dài → hiển thị **danh sách dọc**

---

## 🛠 Troubleshooting

**Lỗi "pdf-parse not found":**
```bash
npm install pdf-parse
```

**Lỗi CORS với Supabase:**
→ Vào Supabase → Authentication → URL Configuration → thêm `http://localhost:3000`

**AI parse ra 0 câu hỏi:**
→ File có thể là PDF scan (ảnh). Hãy dùng PDF text-based hoặc DOCX.
