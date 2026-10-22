import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kanji Look & Learn - Từ điển & Học chữ Hán thông minh',
  description: 'Học và tra cứu Kanji qua hình ảnh liên tưởng và câu chuyện dễ nhớ (Kanji Look and Learn Quyển 1 & Quyển 2)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
