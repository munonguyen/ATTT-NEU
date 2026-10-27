import React, { useRef, useState } from 'react';
import {
  Figure1_1_SystemDataFlow,
  Figure3_1_FourTierArchitecture,
  Figure3_2_KeyGenScreenWireframe,
  Figure3_3_SignScreenWireframe,
  Figure3_4_VerifyScreenWireframe,
  Figure3_5_TamperAndErrorScenarios,
  Figure4_1_ForgeryCounterexample,
} from './ReportFigures';
import { PYTHON_PROJECT_TREE, PYTHON_SOURCE_FILES } from '../data/pythonSourceCode';
import { triggerFileDownload } from '../infrastructure/jsonStorage';

interface ReportDocumentViewProps {
  onLoadScenarioInApp?: (presetId: string) => void;
}

export const ReportDocumentView: React.FC<ReportDocumentViewProps> = ({
  onLoadScenarioInApp,
}) => {
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'ch3_4' | 'ch1_2'>('all');

  const handleExportWord = () => {
    if (!reportContainerRef.current) return;
    const htmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Báo cáo Tiểu luận An toàn và Bảo mật thông tin - Hệ chữ ký điện tử MHK</title>
<style>
  @page { size: A4; margin: 2.5cm 2cm 2.5cm 3cm; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.5; color: #000000; background: #ffffff; }
  h1, h2, h3, h4 { font-family: 'Times New Roman', Times, serif; color: #000000; font-weight: bold; }
  p, li { text-align: justify; }
  table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 11pt; }
  th, td { border: 1px solid #000000; padding: 6pt 8pt; vertical-align: top; }
  pre, code { font-family: 'Courier New', Courier, monospace; font-size: 10pt; background: #ffffff; }
  pre { border: 1px solid #000000; padding: 8pt; white-space: pre-wrap; }
  figure { border: 1px solid #000000; padding: 10pt; margin: 12pt 0; page-break-inside: avoid; }
  figcaption { font-style: italic; text-align: center; margin-top: 6pt; font-size: 11pt; }
</style>
</head>
<body>
${reportContainerRef.current.innerHTML}
</body>
</html>`;
    triggerFileDownload(
      'Bao_Cao_Tieu_Luan_MHK_ATTT_ĐHKTQD.doc',
      htmlContent,
      'application/msword;charset=utf-8'
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar (Clean monochrome controls outside the printable paper) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-black bg-white px-4 py-3 text-xs text-black print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">Chế độ xem Báo cáo &amp; Đặc tả:</span>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`border border-black px-3 py-1 font-medium transition-colors ${
              activeFilter === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            Toàn văn Báo cáo (Phần đầu + Chương 1, 2, 3, 4 + Phụ lục)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ch3_4')}
            className={`border border-black px-3 py-1 font-medium transition-colors ${
              activeFilter === 'ch3_4' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            Tập trung Chương 3 &amp; Chương 4 (Đặc tả + Code Python + Hình ảnh + Test Cases)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ch1_2')}
            className={`border border-black px-3 py-1 font-medium transition-colors ${
              activeFilter === 'ch1_2' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            Phần đầu + Chương 1 &amp; Chương 2 (Lý thuyết &amp; Toán học MHK)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/assets/aistudio/an_to_n_th_ng_tin_a03d95f8"
            download="De_Cuong_Chi_Tiet_MHK_Da_Cap_Nhat_Chuong_3_4.txt"
            className="border border-black bg-white px-3 py-1.5 font-semibold text-black hover:bg-neutral-100 whitespace-nowrap shrink-0"
          >
            Tải File Đề cương Gốc Đã Sửa Chương 3–4 (.TXT)
          </a>
          <button
            type="button"
            onClick={handleExportWord}
            className="border border-black bg-black px-3 py-1.5 font-semibold text-white hover:bg-neutral-800 whitespace-nowrap shrink-0"
          >
            Tải Báo cáo Word (.DOC - Times New Roman 13pt)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="border border-black bg-white px-3 py-1.5 font-semibold text-black hover:bg-neutral-100 whitespace-nowrap shrink-0"
          >
            In / Xuất PDF
          </button>
        </div>
      </div>

      {/* Main Academic Paper Container - Strict Black & White Academic Form (Times New Roman / 13pt equivalent) */}
      <article
        ref={reportContainerRef}
        className="mx-auto max-w-5xl border border-black bg-white p-8 md:p-12 text-black leading-relaxed"
        style={{ fontFamily: "'Times New Roman', 'Source Serif 4', Times, serif" }}
      >
        {/* ================================================================
            PHẦN ĐẦU BÁO CÁO (Trang i, ii, iii, iv)
        ================================================================ */}
        {activeFilter !== 'ch3_4' && (
          <section id="phan-dau-bao-cao" className="space-y-8 border-b border-black pb-10">
            {/* Trang bìa chính & phụ */}
            <div className="border-2 border-black p-8 text-center space-y-4">
              <div className="text-sm font-bold uppercase tracking-wide">
                ĐẠI HỌC KINH TẾ QUỐC DÂN
              </div>
              <div className="text-base font-bold uppercase">
                TRƯỜNG CÔNG NGHỆ — KHOA CÔNG NGHỆ THÔNG TIN
              </div>
              <div className="mx-auto w-48 border-b border-black pt-1" />

              <div className="py-6 space-y-3">
                <div className="text-sm font-bold uppercase">
                  BÁO CÁO BÀI TẬP LỚN / TIỂU LUẬN MÔN HỌC: AN TOÀN VÀ BẢO MẬT THÔNG TIN
                </div>
                <div className="text-xs italic">
                  (Học kỳ 1_2026 – 2027)
                </div>
                <h1 className="text-xl md:text-2xl font-bold uppercase leading-snug">
                  ĐỀ TÀI: XÂY DỰNG CHƯƠNG TRÌNH PHẦN MỀM THỰC HIỆN HỆ CHỮ KÝ ĐIỆN TỬ MHK
                </h1>
                <div className="text-sm italic">
                  (Nghiên cứu cơ sở toán học hệ chữ ký xếp ba lô Merkle–Hellman, đặc tả hồ sơ mhk-demo-preimage-v1 và xây dựng phần mềm Python PySide6)
                </div>
              </div>

              <div className="mx-auto max-w-lg text-left text-sm space-y-1.5 pt-4 border-t border-black">
                <div><strong>Đơn vị đào tạo:</strong> Khoa Công nghệ thông tin – Trường Công nghệ – ĐHKTQD</div>
                <div><strong>Học phần:</strong> An toàn và bảo mật thông tin (Học kỳ 1_2026 – 2027)</div>
                <div><strong>Giảng viên giảng dạy:</strong> TS. / ThS. (Email liên hệ: <span className="font-mono">tuanlm@neu.edu.vn</span>)</div>
                <div><strong>Thời gian thực hiện:</strong> 02 tháng (từ ngày 01/10/2026 đến ngày 30/11/2026)</div>
                <div><strong>Quy chuẩn định dạng:</strong> Font Times New Roman (Unicode), cỡ chữ 13pt, kèm gói mã nguồn Python &amp; tệp chạy <span className="font-mono">*.rar</span></div>
              </div>

              <div className="pt-6 text-sm font-bold uppercase">
                HÀ NỘI, THÁNG 11 NĂM 2026
              </div>
            </div>

            {/* Danh sách thành viên & Bảng phân công nhiệm vụ */}
            <div className="space-y-3">
              <h2 className="text-base font-bold uppercase">
                DANH SÁCH THÀNH VIÊN TRONG NHÓM &amp; BẢNG PHÂN CÔNG NHIỆM VỤ (Trang ii)
              </h2>
              <p className="text-xs italic">
                (Lưu ý theo quy định chung: Chỉ những thành viên có tên trong danh sách dưới đây mới được coi là thành viên của nhóm thực hiện Đề tài).
              </p>
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="border-b border-black font-bold text-center">
                    <th className="border-r border-black px-2 py-1.5">STT</th>
                    <th className="border-r border-black px-2 py-1.5">Họ và tên</th>
                    <th className="border-r border-black px-2 py-1.5">MSSV</th>
                    <th className="border-r border-black px-2 py-1.5">Lớp</th>
                    <th className="border-r border-black px-2 py-1.5">Phân công công việc chi tiết</th>
                    <th className="border-r border-black px-2 py-1.5">Đóng góp</th>
                    <th className="px-2 py-1.5">Ký tên</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center">1</td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">Thành viên 1 (Nhóm trưởng)</td>
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono">1123xxxx</td>
                    <td className="border-r border-black px-2 py-1.5 text-center">CNTT 65</td>
                    <td className="border-r border-black px-2 py-1.5">
                      Phát biểu đề tài (Chương 1), nghiên cứu cơ sở lý thuyết mật mã &amp; bài toán xếp ba lô MHK (Chương 2, Mục 2.1 – 2.3), chuẩn hóa định dạng báo cáo Word.
                    </td>
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono">100%</td>
                    <td className="px-2 py-1.5 text-center">Đã ký</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center">2</td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">Thành viên 2 (Phụ trách Phần mềm)</td>
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono">1123xxxx</td>
                    <td className="border-r border-black px-2 py-1.5 text-center">CNTT 65</td>
                    <td className="border-r border-black px-2 py-1.5">
                      Thiết kế đặc tả kiến trúc 4 tầng, lập trình lõi toán học Python &amp; giao diện PySide6 thực hiện 4 chức năng (a, b, c, d), đóng gói file chạy và biên soạn Mục 3.1 – 3.3.
                    </td>
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono">100%</td>
                    <td className="px-2 py-1.5 text-center">Đã ký</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black px-2 py-1.5 text-center">3</td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">Thành viên 3 (Kiểm thử &amp; Đánh giá)</td>
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono">1123xxxx</td>
                    <td className="border-r border-black px-2 py-1.5 text-center">CNTT 65</td>
                    <td className="border-r border-black px-2 py-1.5">
                      Tính toán ví dụ mẫu &quot;Tôi đồng ý&quot; &amp; phân tích phản ví dụ bảo mật (Mục 2.4 – 2.5), thực thi 4 kịch bản Test Cases (Mục 3.4 – 3.5) và viết Chương 4.
                    </td>
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono">100%</td>
                    <td className="px-2 py-1.5 text-center">Đã ký</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Lời cảm ơn & Lời nói đầu */}
            <div className="space-y-3 text-sm text-justify">
              <h2 className="text-base font-bold uppercase">
                LỜI CẢM ƠN &amp; LỜI NÓI ĐẦU (Trang iii)
              </h2>
              <p>
                Nhóm thực hiện đề tài xin trân trọng gửi lời cảm ơn sâu sắc tới Giảng viên giảng dạy học phần <strong>An toàn và bảo mật thông tin</strong> thuộc Khoa Công nghệ thông tin – Trường Công nghệ, Đại học Kinh tế Quốc dân. Trong suốt 02 tháng thực hiện đề tài (01/10/2026 – 30/11/2026), những định hướng chuyên môn nghiêm túc của thầy/cô đã giúp nhóm nắm vững bản chất toán học của mật mã khóa công khai cũng như phương pháp xây dựng phần mềm kiểm chứng mật mã chuẩn mực.
              </p>
              <p>
                Đề tài <strong>&quot;Xây dựng chương trình phần mềm thực hiện hệ chữ ký điện tử MHK&quot;</strong> được triển khai nhằm giải quyết trọn vẹn 4 yêu cầu cốt lõi của bài toán: (a) Cho phép nhập các tham số đầu vào trên màn hình giao diện; (b) Tính toán và hiển thị tập khóa công khai, khóa bí mật; (c) Tính toán và hiển thị chữ ký lên văn bản <span className="font-mono">M</span>; và (d) Kiểm tra xác thực chữ ký đã ký lên văn bản <span className="font-mono">M</span>. Đặc biệt, toàn bộ các bước tính toán trung gian đều được hiển thị tường minh trên màn hình thông qua <em>Bảng quá trình tính toán (Trace Table)</em>, kết hợp phân tích sâu sắc giới hạn bảo mật của lược đồ khi áp dụng trong thực tế.
              </p>
            </div>

            {/* Mục lục, Danh mục hình ảnh, Danh mục bảng biểu */}
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold uppercase">
                TRANG MỤC LỤC, DANH MỤC HÌNH ẢNH &amp; DANH MỤC BẢNG BIỂU (Trang iv)
              </h2>
              <div className="border border-black p-3 space-y-1">
                <div className="font-bold border-b border-black pb-1 uppercase">Khung Mục lục Báo cáo Tiểu luận</div>
                <div><strong>PHẦN ĐẦU BÁO CÁO</strong> (Trang bìa, Danh sách thành viên, Lời nói đầu, Mục lục) ................................. Trang i – iv</div>
                <div><strong>CHƯƠNG 1: GIỚI THIỆU PHÁT BIỂU ĐỀ TÀI</strong> (Mục 1.1 – 1.5) ................................................................. Trang 1 – 5</div>
                <div><strong>CHƯƠNG 2: TRÌNH BÀY NỘI DUNG NGHIÊN CỨU LÝ THUYẾT CỦA ĐỀ TÀI</strong> (Mục 2.1 – 2.5) ......... Trang 6 – 15</div>
                <div><strong>CHƯƠNG 3: XÂY DỰNG CHƯƠNG TRÌNH PHẦN MỀM</strong> (Mục 3.1 – 3.5) .............................................. Trang 16 – 25</div>
                <div><strong>CHƯƠNG 4: ĐÁNH GIÁ KẾT QUẢ NGHIÊN CỨU VÀ KẾT LUẬN</strong> (Mục 4.1 – 4.3) ............................ Trang 26 – 28</div>
                <div><strong>TÀI LIỆU THAM KHẢO &amp; PHỤ LỤC</strong> ...................................................................................................... Trang 29 – 30</div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="border border-black p-3 space-y-1">
                  <div className="font-bold border-b border-black pb-1">DANH MỤC HÌNH ẢNH</div>
                  <div>• Hình 1.1: Mô hình luồng dữ liệu tổng thể của hệ thống MHK</div>
                  <div>• Hình 3.1: Sơ đồ kiến trúc 4 tầng của phần mềm chữ ký điện tử MHK</div>
                  <div>• Hình 3.2: Giao diện Màn hình 1 – Nhập tham số và Tạo khóa (Yêu cầu a, b)</div>
                  <div>• Hình 3.3: Giao diện Màn hình 2 – Ký văn bản &quot;Tôi đồng ý&quot; (Yêu cầu c)</div>
                  <div>• Hình 3.4: Giao diện Màn hình 3 – Xác minh chữ ký hợp lệ (Yêu cầu d)</div>
                  <div>• Hình 3.5: Giao diện Màn hình 4 – Kết quả kiểm thử tự động TC-01 đến TC-05</div>
                  <div>• Hình 4.1: Minh họa thực nghiệm phản ví dụ giả mạo chữ ký tại k = 123</div>
                </div>
                <div className="border border-black p-3 space-y-1">
                  <div className="font-bold border-b border-black pb-1">DANH MỤC BẢNG BIỂU</div>
                  <div>• Bảng 2.1: Phân tích vai trò dữ liệu (M, sk, pk, σ) trong hệ thống</div>
                  <div>• Bảng 2.2: Minh họa giải bài toán Knapsack siêu tăng với tổng 39</div>
                  <div>• Bảng 2.3: Bảng tính chi tiết khóa công khai Bᵢ từ bộ số chuẩn</div>
                  <div>• Bảng 2.4: Bảng giải trình 3 lượt thử bộ đếm k = 0, 1, 2 cho &quot;Tôi đồng ý&quot;</div>
                  <div>• Bảng 2.5: Bảng kiểm tra xác thực hợp lệ và phát hiện giả mạo</div>
                  <div>• Bảng 3.1a: Ma trận ánh xạ yêu cầu đề bài (a, b, c, d) sang Đặc tả kỹ thuật</div>
                  <div>• Bảng 3.1b: Bảng đặc tả 4 màn hình giao diện và dữ liệu vào/ra</div>
                  <div>• Bảng 3.2: Bảng giải thích 6 trạng thái kết quả của hệ thống</div>
                  <div>• Bảng 3.3: Danh mục các tệp mã nguồn Python của dự án</div>
                  <div>• Bảng 3.4: Bảng kịch bản chạy thử nghiệm (Test Cases 1–4) và Kết quả</div>
                  <div>• Bảng 4.1: Bảng đối chiếu kết quả đạt được so với yêu cầu đề bài</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            CHƯƠNG 1: GIỚI THIỆU PHÁT BIỂU ĐỀ TÀI
        ================================================================ */}
        {activeFilter !== 'ch3_4' && (
          <section id="chuong-1" className="mt-8 space-y-4 border-b border-black pb-8 text-sm text-justify">
            <h2 className="text-lg font-bold uppercase">
              CHƯƠNG 1: GIỚI THIỆU PHÁT BIỂU ĐỀ TÀI
            </h2>

            <div className="space-y-2">
              <h3 className="font-bold">1.1. Lý do lựa chọn đề tài</h3>
              <p>
                Sự bùng nổ của giao dịch thương mại điện tử, ngân hàng số và trao đổi văn bản hành chính qua môi trường mạng Internet đặt ra thách thức lớn về nguy cơ giả mạo nguồn gốc và sửa đổi trái phép nội dung thông điệp. Để bảo vệ tính toàn vẹn (Integrity), tính xác thực nguồn gốc (Authenticity) và tính chống chối bỏ (Non-repudiation), chữ ký điện tử dựa trên mật mã khóa công khai là công cụ nền tảng không thể thay thế.
              </p>
              <p>
                Trong lịch sử mật mã học hiện đại, hệ mật mã xếp ba lô (Trapdoor Knapsack) do Ralph Merkle và Martin Hellman đề xuất năm 1978 [3] là một trong những công trình đặt nền móng đầu tiên cho cơ chế hàm một chiều có cửa sập (Trapdoor One-Way Function). Việc nghiên cứu hệ chữ ký điện tử Merkle–Hellman (MHK) và xây dựng phần mềm minh họa từng bước tính toán giúp làm sáng tỏ hai vấn đề cốt lõi của ngành An toàn thông tin: (1) Cơ chế biến đổi một bài toán tổ hợp dễ giải (trên dãy siêu tăng) thành bài toán khó giải đối với người ngoài thông qua phép nhân mô-đun; và (2) Sự khác biệt bản chất giữa một chương trình chạy đúng công thức toán học với một hệ mật mã đủ độ an toàn trước các tấn công phân tích cấu trúc (như tấn công rút gọn lưới của Adi Shamir năm 1984 [2]) và tấn công va chạm miền băm nhỏ.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">1.2. Mục tiêu, yêu cầu đề bài và câu hỏi nghiên cứu</h3>
              <p>
                <strong>Mục tiêu của đề tài:</strong> Nghiên cứu cơ sở toán học của hệ chữ ký điện tử MHK và xây dựng hoàn chỉnh chương trình phần mềm bằng ngôn ngữ Python (thư viện giao diện đồ họa PySide6) đáp ứng đầy đủ các yêu cầu tối thiểu của đề bài:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Yêu cầu a):</strong> Cho phép nhập các tham số đầu vào của hệ chữ ký (<span className="font-mono">n, W, q, r</span>) trực tiếp trên màn hình giao diện và kiểm tra chặt chẽ các điều kiện toán học.</li>
                <li><strong>Yêu cầu b):</strong> Tính toán và hiển thị tường minh tập khóa công khai (<span className="font-mono">pk = B, T</span>) và khóa bí mật (<span className="font-mono">sk = (W, q, r, u)</span>) của hệ chữ ký.</li>
                <li><strong>Yêu cầu c):</strong> Tính toán và hiển thị chữ ký điện tử <span className="font-mono">σ = (k, x)</span> lên văn bản <span className="font-mono">M</span> bất kỳ (hỗ trợ tiếng Việt UTF-8).</li>
                <li><strong>Yêu cầu d):</strong> Kiểm tra xác thực chữ ký đã ký lên văn bản <span className="font-mono">M</span> hoàn toàn độc lập (không sử dụng khóa bí mật).</li>
                <li><strong>Yêu cầu hiển thị trực quan:</strong> Toàn bộ quá trình tính toán trung gian và kết quả cuối cùng phải được trình bày rõ ràng trên màn hình giao diện thông qua Bảng quá trình tính toán (Trace Table).</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">1.3. Đối tượng và phạm vi nghiên cứu</h3>
              <p>
                <strong>1.3.1. Đối tượng nghiên cứu:</strong> Hệ chữ ký điện tử dựa trên bài toán xếp ba lô Merkle–Hellman (MHK), hồ sơ thuật toán học thuật <code className="font-mono">mhk-demo-preimage-v1</code> và kiến trúc phần mềm 4 tầng bằng ngôn ngữ Python (PySide6).
              </p>
              <p>
                <strong>1.3.2. Phạm vi nghiên cứu:</strong> Khảo sát và thực nghiệm trên bộ tham số tường minh (<span className="font-mono">n = 5, W = (2, 3, 7, 14, 30), q = 61, r = 17</span>) để người học có thể kiểm chứng bằng tay mọi phép tính trung gian; đồng thời mở rộng phân tích giới hạn bảo mật thực tế thông qua phản ví dụ giả mạo chữ ký trên miền băm rút gọn.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">1.4. Phương pháp nghiên cứu</h3>
              <p>
                Đề tài kết hợp <strong>phương pháp nghiên cứu lý thuyết toán học mật mã</strong> (số học mô-đun, thuật toán Euclid mở rộng, giải thuật tham lam trên dãy siêu tăng, hàm băm SHA-256) và <strong>phương pháp kỹ nghệ phần mềm thực nghiệm</strong> (thiết kế kiến trúc 4 tầng Clean Architecture, kiểm thử đơn vị tự động <code className="font-mono">unittest</code> và kiểm thử kịch bản giao diện).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">1.5. Hướng giải quyết đề tài</h3>
              <p>
                <strong>1.5.1. Tóm tắt ý tưởng:</strong> Giữ dãy siêu tăng <span className="font-mono">W</span> làm khóa bí mật để giải nhanh bài toán tổng tập con bằng thuật toán tham lam; nhân từng phần tử <span className="font-mono">Wᵢ</span> với số nhân <span className="font-mono">r</span> theo mô-đun <span className="font-mono">q</span> để tạo khóa công khai <span className="font-mono">B</span>; khi ký văn bản <span className="font-mono">M</span>, ghép văn bản với bộ đếm <span className="font-mono">k</span> rồi băm SHA-256 lấy dư cho <span className="font-mono">T + 1</span> để thu được đại diện <span className="font-mono">yₖ</span>, chuyển qua cửa sập <span className="font-mono">t = (u × yₖ) mod q</span> để tìm vector nhị phân <span className="font-mono">x</span> trên <span className="font-mono">W</span> và đối chiếu lại tổng công khai <span className="font-mono">ΣBᵢxᵢ = yₖ</span>.
              </p>
              <p>
                <strong>1.5.2. Xây dựng mô hình hoạt động của hệ thống:</strong> Sơ đồ luồng dữ liệu tổng thể giữa Trạm tạo khóa, Trạm ký văn bản và Trạm xác thực được trình bày tại Hình 1.1.
              </p>
              <Figure1_1_SystemDataFlow />
            </div>
          </section>
        )}

        {/* ================================================================
            CHƯƠNG 2: TRÌNH BÀY NỘI DUNG NGHIÊN CỨU LÝ THUYẾT CỦA ĐỀ TÀI
        ================================================================ */}
        {activeFilter !== 'ch3_4' && (
          <section id="chuong-2" className="mt-8 space-y-5 border-b border-black pb-8 text-sm text-justify">
            <h2 className="text-lg font-bold uppercase">
              CHƯƠNG 2: TRÌNH BÀY NỘI DUNG NGHIÊN CỨU LÝ THUYẾT CỦA ĐỀ TÀI
            </h2>

            <div className="space-y-2">
              <h3 className="font-bold">2.1. Tổng quan về An toàn thông tin, Hệ mật mã và Chữ ký số</h3>
              <p>
                <strong>2.1.1. Hệ mật mã và 4 thuộc tính an toàn thông tin:</strong> Một hệ thống bảo mật thông tin hướng tới 4 thuộc tính cốt lõi: (1) <em>Tính bí mật (Confidentiality)</em> – ngăn chặn lộ lọt nội dung cho bên không được phép; (2) <em>Tính toàn vẹn (Integrity)</em> – đảm bảo dữ liệu không bị thay đổi trái phép; (3) <em>Tính xác thực (Authenticity)</em> – xác minh đúng danh tính nguồn gửi; và (4) <em>Tính không thể chối từ (Non-repudiation)</em> – gắn trách nhiệm pháp lý và toán học của chủ thể với thông điệp đã ký.
              </p>
              <p>
                <strong>2.1.2. Mô hình Tam giác bảo mật CIA:</strong> Gồm ba trụ cột Bảo mật (Confidentiality), Toàn vẹn (Integrity) và Sẵn sàng (Availability). Hệ thống chữ ký điện tử trực tiếp bảo vệ trụ cột <em>Toàn vẹn</em> và cung cấp dịch vụ <em>Xác thực / Chống chối bỏ</em>.
              </p>
              <p>
                <strong>2.1.3. Mã khóa đối xứng và Mã khóa công khai:</strong> Các hệ mã đối xứng (DES, AES) dùng chung một khóa cho cả hai chiều nên không thể công khai khóa để bên thứ ba xác thực chữ ký. Mã hóa khóa công khai tách khóa thành cặp khóa bất đối xứng <span className="font-mono">(pk, sk)</span>: khóa bí mật <span className="font-mono">sk</span> chỉ thuộc về người ký để tạo chữ ký, còn khóa công khai <span className="font-mono">pk</span> được chia sẻ rộng rãi để bất kỳ người kiểm tra nào cũng xác minh được.
              </p>
              <p>
                <strong>2.1.4. Chữ ký số và Hàm băm mật mã:</strong> Thay vì ký trực tiếp lên văn bản dài, hệ thống đưa văn bản <span className="font-mono">M</span> qua hàm băm mật mã (như SHA-256) để tạo giá trị đại diện có kích thước cố định. Cần lưu ý: chữ ký số là dữ liệu toán học (vector bit <span className="font-mono">x</span> và bộ đếm <span className="font-mono">k</span>) phụ thuộc vào từng byte của <span className="font-mono">M</span>, hoàn toàn không phải hình ảnh chữ ký tay; đồng thời ký số không mã hóa ẩn nội dung của <span className="font-mono">M</span>.
              </p>

              <table className="w-full border-collapse border border-black text-xs">
                <caption className="mb-1 text-left font-bold">
                  Bảng 2.1: Phân tích các thành phần dữ liệu trong hệ thống chữ ký điện tử MHK
                </caption>
                <thead>
                  <tr className="border-b border-black font-bold">
                    <th className="border-r border-black px-2 py-1">Dữ liệu</th>
                    <th className="border-r border-black px-2 py-1">Vai trò trong lược đồ</th>
                    <th className="px-2 py-1">Chủ thể cần sử dụng</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-semibold">Văn bản M</td>
                    <td className="border-r border-black px-2 py-1">Nội dung thông điệp được ký (ví dụ: &quot;Tôi đồng ý&quot;, 15 bytes UTF-8)</td>
                    <td className="px-2 py-1">Người ký (An) và Người kiểm tra (Bình)</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-semibold">Khóa bí mật sk</td>
                    <td className="border-r border-black px-2 py-1">Dãy siêu tăng W, mô-đun q, số nhân r và nghịch đảo u = r⁻¹ mod q</td>
                    <td className="px-2 py-1">Chỉ Người ký (An) nắm giữ</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-semibold">Khóa công khai pk</td>
                    <td className="border-r border-black px-2 py-1">Dãy công khai B = (B₁, ..., Bₙ), tổng T = ΣBᵢ và nhãn hồ sơ thuật toán</td>
                    <td className="px-2 py-1">Người kiểm tra (Bình); có thể chia sẻ công khai</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black px-2 py-1 font-semibold">Chữ ký điện tử σ</td>
                    <td className="border-r border-black px-2 py-1">Bộ đếm k và vector nhị phân x = (x₁, ..., xₙ) ∈ &#123;0, 1&#125;ⁿ</td>
                    <td className="px-2 py-1">Đính kèm cùng văn bản M gửi cho Người kiểm tra</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">2.2. Bài toán Xếp ba lô (Knapsack Problem) và Dãy siêu tăng</h3>
              <p>
                <strong>2.2.1. Bài toán Knapsack / Subset-Sum:</strong> Cho tập hợp các trọng lượng nguyên dương <span className="font-mono">A = (A₁, A₂, ..., Aₙ)</span> và tổng mục tiêu <span className="font-mono">S</span>, bài toán yêu cầu tìm vector nhị phân <span className="font-mono">x = (x₁, x₂, ..., xₙ) ∈ &#123;0, 1&#125;ⁿ</span> sao cho <span className="font-mono">Σ_{'{i=1..n}'} Aᵢxᵢ = S</span>.
              </p>
              <p>
                <strong>2.2.2. Dãy siêu tăng (Superincreasing Sequence) và Thuật toán tham lam:</strong> Dãy số nguyên dương <span className="font-mono">W = (W₁, ..., Wₙ)</span> là dãy siêu tăng nếu <span className="font-mono">Wᵢ &gt; Σ_{'{j=1..i-1}'} Wⱼ</span> với mọi <span className="font-mono">i ≥ 2</span>. Khi đó, nghiệm <span className="font-mono">x</span> cho tổng mục tiêu <span className="font-mono">t</span> được tìm duy nhất trong <span className="font-mono">n</span> bước bằng thuật toán tham lam duyệt từ <span className="font-mono">Wₙ</span> xuống <span className="font-mono">W₁</span>.
              </p>

              <table className="w-full border-collapse border border-black text-xs text-center font-mono">
                <caption className="mb-1 text-left font-sans font-bold">
                  Bảng 2.2: Minh họa giải bài toán Knapsack trên dãy siêu tăng W = (2, 3, 7, 14, 30) với tổng mục tiêu S = 39
                </caption>
                <thead>
                  <tr className="border-b border-black font-sans font-bold">
                    <th className="border-r border-black px-2 py-1">Vị trí i</th>
                    <th className="border-r border-black px-2 py-1">Phần tử Wᵢ</th>
                    <th className="border-r border-black px-2 py-1">Kiểm tra siêu tăng</th>
                    <th className="border-r border-black px-2 py-1">Bit lựa chọn xᵢ</th>
                    <th className="px-2 py-1">Giá trị đóng góp (Wᵢ × xᵢ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1">1</td>
                    <td className="border-r border-black px-2 py-1">2</td>
                    <td className="border-r border-black px-2 py-1">2 &gt; 0</td>
                    <td className="border-r border-black px-2 py-1">1</td>
                    <td className="px-2 py-1">2</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1">2</td>
                    <td className="border-r border-black px-2 py-1">3</td>
                    <td className="border-r border-black px-2 py-1">3 &gt; 2</td>
                    <td className="border-r border-black px-2 py-1">0</td>
                    <td className="px-2 py-1">0</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1">3</td>
                    <td className="border-r border-black px-2 py-1">7</td>
                    <td className="border-r border-black px-2 py-1">7 &gt; 2+3=5</td>
                    <td className="border-r border-black px-2 py-1">1</td>
                    <td className="px-2 py-1">7</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1">4</td>
                    <td className="border-r border-black px-2 py-1">14</td>
                    <td className="border-r border-black px-2 py-1">14 &gt; 2+3+7=12</td>
                    <td className="border-r border-black px-2 py-1">0</td>
                    <td className="px-2 py-1">0</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1">5</td>
                    <td className="border-r border-black px-2 py-1">30</td>
                    <td className="border-r border-black px-2 py-1">30 &gt; 2+3+7+14=26</td>
                    <td className="border-r border-black px-2 py-1">1</td>
                    <td className="px-2 py-1">30</td>
                  </tr>
                  <tr className="font-bold">
                    <td colSpan={3} className="border-r border-black px-2 py-1 font-sans">Tổng cộng</td>
                    <td className="border-r border-black px-2 py-1">x = (1,0,1,0,1)</td>
                    <td className="px-2 py-1">2 + 7 + 30 = 39 (Dư 0)</td>
                  </tr>
                </tbody>
              </table>

              <p>
                <strong>2.2.3. Cơ chế Cửa sập (Trapdoor) trong hệ MHK:</strong> Chọn mô-đun <span className="font-mono">q &gt; ΣWᵢ</span> và số nhân <span className="font-mono">r</span> nguyên tố cùng nhau với <span className="font-mono">q</span> (<span className="font-mono">gcd(r, q) = 1</span>). Khóa công khai được sinh bởi phép biến đổi <span className="font-mono">Bᵢ = (r × Wᵢ) mod q</span>. Nhờ tồn tại nghịch đảo <span className="font-mono">u = r⁻¹ mod q</span>, người giữ khóa bí mật chuyển được mục tiêu công khai <span className="font-mono">yₖ</span> về mục tiêu bí mật <span className="font-mono">t = (u × yₖ) mod q</span> để giải trên <span className="font-mono">W</span>.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">2.3. Mô tả chi tiết hoạt động của thuật toán chữ ký điện tử MHK</h3>
              <p>
                <strong>2.3.1. Kiểm tra tham số đầu vào và Thuật toán Tạo khóa:</strong> Kiểm tra <span className="font-mono">n ≥ 2</span>, <span className="font-mono">|W| = n</span>, <span className="font-mono">Wᵢ &gt; Σ_{'{j<i}'} Wⱼ</span>, <span className="font-mono">q &gt; ΣWᵢ</span>, <span className="font-mono">1 &lt; r &lt; q</span> và <span className="font-mono">gcd(r, q) = 1</span>. Tính <span className="font-mono">Bᵢ = (r × Wᵢ) mod q</span>, tổng <span className="font-mono">T = ΣBᵢ</span> và nghịch đảo <span className="font-mono">u = r⁻¹ mod q</span>.
              </p>
              <p>
                <strong>2.3.2. Thuật toán Ký văn bản M:</strong> Mã hóa chuỗi <span className="font-mono">M</span> sang mảng byte UTF-8. Với bộ đếm <span className="font-mono">k = 0, 1, ..., 4095</span>: ghép gói dữ liệu <code className="font-mono">frame = b&quot;MHK-DEMO-v1\x00&quot; + len(M)_8B_BE + M_bytes + k_8B_BE</code>, tính <span className="font-mono">yₖ = int(SHA256(frame)) mod (T + 1)</span>, tính <span className="font-mono">t = (u × yₖ) mod q</span>, giải tham lam trên <span className="font-mono">W</span> được vector <span className="font-mono">x</span> và phần dư <span className="font-mono">rem</span>. Đối chiếu lại tổng công khai <span className="font-mono">v = ΣBᵢxᵢ</span>: chỉ khi <span className="font-mono">rem == 0</span> và <span className="font-mono">v == yₖ</span> thì xuất chữ ký <span className="font-mono">σ = (k, x)</span>.
              </p>
              <p>
                <strong>2.3.3. Thuật toán Xác thực chữ ký:</strong> Nhận <span className="font-mono">(M, pk = B, σ = (k, x))</span>, kiểm tra cấu trúc định dạng, tính lại <span className="font-mono">yₖ</span> từ <span className="font-mono">M</span> và <span className="font-mono">k</span>, tính tổng công khai <span className="font-mono">v = ΣBᵢxᵢ</span> và so sánh <span className="font-mono">v == yₖ</span>.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold">2.4. Ví dụ minh họa chi tiết hoạt động của thuật toán</h3>
              <p>
                Với bộ tham số chuẩn <span className="font-mono">n = 5, W = (2, 3, 7, 14, 30), q = 61, r = 17</span> và văn bản <span className="font-mono">M = &quot;Tôi đồng ý&quot;</span> (15 bytes UTF-8), kết quả tạo khóa, ký qua 3 lượt thử bộ đếm <span className="font-mono">k = 0, 1, 2</span> và xác thực được trình bày tại Bảng 2.3, Bảng 2.4 và Bảng 2.5.
              </p>

              <table className="w-full border-collapse border border-black text-xs text-center font-mono">
                <caption className="mb-1 text-left font-sans font-bold">
                  Bảng 2.3: Bảng tính chi tiết khóa công khai Bᵢ từ bộ số n=5, W=(2,3,7,14,30), q=61, r=17
                </caption>
                <thead>
                  <tr className="border-b border-black font-sans font-bold">
                    <th className="border-r border-black px-2 py-1">Chỉ số i</th>
                    <th className="border-r border-black px-2 py-1">Wᵢ</th>
                    <th className="border-r border-black px-2 py-1">r × Wᵢ = 17 × Wᵢ</th>
                    <th className="border-r border-black px-2 py-1">Phép chia lấy dư cho q = 61</th>
                    <th className="px-2 py-1">Khóa công khai Bᵢ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1">1</td>
                    <td className="border-r border-black px-2 py-1">2</td>
                    <td className="border-r border-black px-2 py-1">34</td>
                    <td className="border-r border-black px-2 py-1">34 = 0 × 61 + 34</td>
                    <td className="px-2 py-1 font-bold">34</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1">2</td>
                    <td className="border-r border-black px-2 py-1">3</td>
                    <td className="border-r border-black px-2 py-1">51</td>
                    <td className="border-r border-black px-2 py-1">51 = 0 × 61 + 51</td>
                    <td className="px-2 py-1 font-bold">51</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1">3</td>
                    <td className="border-r border-black px-2 py-1">7</td>
                    <td className="border-r border-black px-2 py-1">119</td>
                    <td className="border-r border-black px-2 py-1">119 = 1 × 61 + 58</td>
                    <td className="px-2 py-1 font-bold">58</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1">4</td>
                    <td className="border-r border-black px-2 py-1">14</td>
                    <td className="border-r border-black px-2 py-1">238</td>
                    <td className="border-r border-black px-2 py-1">238 = 3 × 61 + 55</td>
                    <td className="px-2 py-1 font-bold">55</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black px-2 py-1">5</td>
                    <td className="border-r border-black px-2 py-1">30</td>
                    <td className="border-r border-black px-2 py-1">510</td>
                    <td className="border-r border-black px-2 py-1">510 = 8 × 61 + 22</td>
                    <td className="px-2 py-1 font-bold">22</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border border-black text-xs font-mono">
                <caption className="mb-1 text-left font-sans font-bold">
                  Bảng 2.4: Bảng giải trình 3 lượt thử bộ đếm k khi ký văn bản M = &quot;Tôi đồng ý&quot;
                </caption>
                <thead>
                  <tr className="border-b border-black font-sans font-bold text-center">
                    <th className="border-r border-black px-2 py-1">Bộ đếm k</th>
                    <th className="border-r border-black px-2 py-1">yₖ = SHA256(frame) mod 221</th>
                    <th className="border-r border-black px-2 py-1">t = 18 × yₖ mod 61</th>
                    <th className="border-r border-black px-2 py-1">Giải tham lam trên W</th>
                    <th className="px-2 py-1">Kiểm tra công khai &amp; Kết luận</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 text-center">0</td>
                    <td className="border-r border-black px-2 py-1 text-center">104</td>
                    <td className="border-r border-black px-2 py-1 text-center">18×104 mod 61 = 42</td>
                    <td className="border-r border-black px-2 py-1">Chọn 30, 7, 3, 2 → x=(1,1,1,0,1), dư = 0</td>
                    <td className="px-2 py-1 font-sans">Tổng công khai v = 34+51+58+22 = 165 ≠ 104 → <strong>Bị loại</strong></td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 text-center">1</td>
                    <td className="border-r border-black px-2 py-1 text-center">163</td>
                    <td className="border-r border-black px-2 py-1 text-center">18×163 mod 61 = 6</td>
                    <td className="border-r border-black px-2 py-1">Chọn 3, 2 → x=(1,1,0,0,0), còn dư 1 ≠ 0</td>
                    <td className="px-2 py-1 font-sans">Giải trên W còn dư 1 → <strong>Bị loại</strong></td>
                  </tr>
                  <tr className="font-bold">
                    <td className="border-r border-black px-2 py-1 text-center">2</td>
                    <td className="border-r border-black px-2 py-1 text-center">56</td>
                    <td className="border-r border-black px-2 py-1 text-center">18×56 mod 61 = 32</td>
                    <td className="border-r border-black px-2 py-1">Chọn W₅=30, W₁=2 → x=(1,0,0,0,1), dư = 0</td>
                    <td className="px-2 py-1 font-sans">Tổng công khai v = 34 + 22 = 56 == y₂ → <strong>Nhận σ=(2, (1,0,0,0,1))</strong></td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border border-black text-xs">
                <caption className="mb-1 text-left font-bold">
                  Bảng 2.5: Minh họa bước xác thực chữ ký hợp lệ và phát hiện giả mạo dữ liệu
                </caption>
                <thead>
                  <tr className="border-b border-black font-bold text-center">
                    <th className="border-r border-black px-2 py-1">Trường hợp kiểm tra</th>
                    <th className="border-r border-black px-2 py-1">Dữ liệu đầu vào (M, k, x)</th>
                    <th className="border-r border-black px-2 py-1">Đại diện yₖ</th>
                    <th className="border-r border-black px-2 py-1">Tổng công khai v = ΣBᵢxᵢ</th>
                    <th className="px-2 py-1">So sánh &amp; Kết luận</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-semibold">1. Chữ ký gốc hợp lệ</td>
                    <td className="border-r border-black px-2 py-1 font-mono">M=&quot;Tôi đồng ý&quot;, k=2, x=(1,0,0,0,1)</td>
                    <td className="border-r border-black px-2 py-1 text-center font-mono">y₂ = 56</td>
                    <td className="border-r border-black px-2 py-1 text-center font-mono">34 + 22 = 56</td>
                    <td className="px-2 py-1 font-mono font-bold">56 == 56 → VALID</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1 font-semibold">2. Sửa văn bản sau khi ký</td>
                    <td className="border-r border-black px-2 py-1 font-mono">M=&quot;Tôi không đồng ý&quot;, k=2, x=(1,0,0,0,1)</td>
                    <td className="border-r border-black px-2 py-1 text-center font-mono">y₂ = 65</td>
                    <td className="border-r border-black px-2 py-1 text-center font-mono">34 + 22 = 56</td>
                    <td className="px-2 py-1 font-mono font-bold">56 ≠ 65 → INVALID</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black px-2 py-1 font-semibold">3. Sửa bit đầu của chữ ký</td>
                    <td className="border-r border-black px-2 py-1 font-mono">M=&quot;Tôi đồng ý&quot;, k=2, x=(0,0,0,0,1)</td>
                    <td className="border-r border-black px-2 py-1 text-center font-mono">y₂ = 56</td>
                    <td className="border-r border-black px-2 py-1 text-center font-mono">0 + 22 = 22</td>
                    <td className="px-2 py-1 font-mono font-bold">22 ≠ 56 → INVALID</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">2.5. Phân tích độ an toàn và giới hạn của hệ chữ ký MHK</h3>
              <p>
                Bên cạnh tấn công thời gian đa thức của Adi Shamir (1984) [2] dựa trên thuật toán rút gọn cơ sở lưới vào cấu trúc mô-đun một tầng của hệ MHK cơ bản, hồ sơ học thuật <code className="font-mono">mhk-demo-preimage-v1</code> còn có giới hạn từ miền đại diện nhỏ (<span className="font-mono">T + 1 = 221</span> giá trị). Cụ thể, kẻ tấn công không cần biết khóa bí mật <span className="font-mono">(W, q, r, u)</span> có thể chọn sẵn <span className="font-mono">x = (1, 0, 1, 0, 1)</span> có tổng công khai <span className="font-mono">v = 34 + 58 + 22 = 114</span>, rồi thử bộ đếm cho văn bản <span className="font-mono">M = &quot;Thông điệp giả mạo MHK&quot;</span> (hoặc <span className="font-mono">&quot;Văn bản thay thế 7&quot;</span>) đến lượt <span className="font-mono">k = 123</span> sẽ thu được <span className="font-mono">y₁₂₃ = 114 == v</span>, vượt qua phép kiểm tra <code className="font-mono">VALID</code>.
              </p>
            </div>
          </section>
        )}

        {/* ================================================================
            CHƯƠNG 3: XÂY DỰNG CHƯƠNG TRÌNH PHẦN MỀM (ĐẶC TẢ CHI TIẾT + CODE + HÌNH ẢNH)
        ================================================================ */}
        {activeFilter !== 'ch1_2' && (
          <section id="chuong-3" className="mt-8 space-y-6 border-b border-black pb-8 text-sm text-justify">
            <h2 className="text-lg font-bold uppercase">
              CHƯƠNG 3: XÂY DỰNG CHƯƠNG TRÌNH PHẦN MỀM
            </h2>

            {/* 3.1. Phân tích yêu cầu và Thiết kế kiến trúc chương trình */}
            <div className="space-y-4">
              <h3 className="text-base font-bold">
                3.1. Phân tích yêu cầu và Thiết kế kiến trúc chương trình
              </h3>

              <p>
                Để đảm bảo chương trình phần mềm đáp ứng đầy đủ, chính xác các yêu cầu tối thiểu (a, b, c, d) của đề bài và tuân thủ các nguyên lý kỹ nghệ phần mềm an toàn, nhóm nghiên cứu tiến hành phân tích đặc tả yêu cầu hệ thống (Software Requirements Specification – SRS) như trình bày tại Bảng 3.1a.
              </p>

              <table className="w-full border-collapse border border-black text-xs">
                <caption className="mb-1 text-left font-bold">
                  Bảng 3.1a: Ma trận ánh xạ yêu cầu đề bài sang Đặc tả Yêu cầu Chức năng (FR) và Phi chức năng (NFR)
                </caption>
                <thead>
                  <tr className="border-b border-black font-bold text-center">
                    <th className="border-r border-black px-2 py-1.5 w-24">Mã yêu cầu</th>
                    <th className="border-r border-black px-2 py-1.5 w-44">Yêu cầu từ Đề bài</th>
                    <th className="border-r border-black px-2 py-1.5">Đặc tả kỹ thuật chi tiết trong phần mềm</th>
                    <th className="px-2 py-1.5 w-36">Tầng đảm nhiệm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">FR-01</td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Yêu cầu a): Nhập các tham số đầu vào trên màn hình giao diện
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Cung cấp các ô nhập liệu trực quan cho <span className="font-mono">n, W, q, r</span> và <span className="font-mono">profile</span>. Kiểm tra tự động 4 điều kiện toán học: <span className="font-mono">|W| == n ≥ 2</span>, tính chất siêu tăng <span className="font-mono">Wᵢ &gt; Σ_{'{j<i}'} Wⱼ</span>, mô-đun <span className="font-mono">q &gt; ΣWᵢ</span>, và điều kiện nguyên tố cùng nhau <span className="font-mono">gcd(r, q) == 1</span>. Báo lỗi <code className="font-mono">FORMAT_ERROR</code> rõ ràng tại vị trí vi phạm.
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[11px]">Presentation &amp; Domain</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">FR-02</td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Yêu cầu b): Tính toán và hiển thị tập khóa công khai, khóa bí mật
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Tính nghịch đảo <span className="font-mono">u = r⁻¹ mod q</span> bằng thuật toán Euclid mở rộng; tính từng phần tử khóa công khai <span className="font-mono">Bᵢ = (r × Wᵢ) mod q</span> và tổng <span className="font-mono">T = ΣBᵢ</span>. Hiển thị tách biệt vùng Khóa công khai <span className="font-mono">pk = (B, T, key_id)</span> và vùng Khóa bí mật <span className="font-mono">sk = (W, q, r, u)</span> kèm bảng tính chi tiết từng phần tử <span className="font-mono">Bᵢ</span>.
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[11px]">Domain &amp; Presentation</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">FR-03</td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Yêu cầu c): Tính toán và hiển thị chữ ký lên văn bản M
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Chuyển chuỗi <span className="font-mono">M</span> sang mảng byte UTF-8, hiển thị độ dài byte và chuỗi Hex. Chạy vòng lặp bộ đếm <span className="font-mono">k ∈ [0, 4095]</span>, đóng gói <span className="font-mono">frame</span>, tính <span className="font-mono">yₖ = SHA256(frame) mod (T+1)</span>, <span className="font-mono">t = (u × yₖ) mod q</span>, giải tham lam trên <span className="font-mono">W</span> và đối chiếu <span className="font-mono">ΣBᵢxᵢ == yₖ</span>. Hiển thị chữ ký <span className="font-mono">σ = (k, x)</span> và bảng giải trình các lượt thử <span className="font-mono">k</span>.
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[11px]">Application &amp; Domain</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">FR-04</td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Yêu cầu d): Kiểm tra xác thực chữ ký đã ký lên văn bản M
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Cung cấp màn hình Xác minh độc lập nhận <span className="font-mono">(M, B, k, x)</span>. Kiểm tra cấu trúc định dạng (<span className="font-mono">x ∈ &#123;0,1&#125;ⁿ</span>, <span className="font-mono">0 ≤ k &lt; 4096</span>), tính lại đại diện <span className="font-mono">yₖ</span>, tính tổng <span className="font-mono">v = ΣBᵢxᵢ</span>, hiển thị bảng đóng góp từng bit và kết luận <code className="font-mono">VALID</code> / <code className="font-mono">INVALID</code> / <code className="font-mono">FORMAT_ERROR</code>.
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[11px]">Domain &amp; Presentation</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">NFR-01</td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Bất biến cô lập khóa bí mật (Zero-Secret Verifier)
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Hàm xác thực <code className="font-mono">verify_signature(M, pk, sig)</code> và tệp JSON chữ ký xuất ra tuyệt đối không được chứa hay đọc các tham số bí mật <span className="font-mono">(W, q, r, u)</span>.
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[11px]">Domain &amp; Infrastructure</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">NFR-02</td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Hiển thị quá trình tính toán &amp; Chống kết quả cũ (Stale-State)
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Mọi màn hình đều kết nối với <em>Bảng quá trình tính toán (Trace Table)</em> 6 cột. Quản lý phiên bản dữ liệu (<span className="font-mono">Snapshot Revision</span>) để đánh dấu ngay khi người dùng sửa văn bản <span className="font-mono">M</span> hoặc khóa mà chưa bấm tính lại.
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[11px]">Application &amp; Presentation</td>
                  </tr>
                </tbody>
              </table>

              <div className="space-y-2">
                <h4 className="font-bold">3.1.1. Công nghệ sử dụng và Tham khảo kiến trúc giải pháp</h4>
                <p>
                  Theo đúng quy định tại Mục II.4 của hướng dẫn thực hiện đề tài, chương trình phần mềm được xây dựng bằng ngôn ngữ lập trình <strong>Python (phiên bản 3.11+)</strong> kết hợp với bộ thư viện giao diện đồ họa chuẩn công nghiệp <strong>PySide6 (Qt for Python)</strong>:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Ngôn ngữ Python 3.11+:</strong> Kiểu dữ liệu số nguyên <code className="font-mono">int</code> của Python có độ chính xác tùy ý (arbitrary-precision), cho phép chuyển đổi trực tiếp đầu ra 256-bit của hàm băm SHA-256 (<code className="font-mono">hashlib.sha256</code>) thành số nguyên lớn để thực hiện phép toán mô-đun mà không xảy ra sai số tràn bit.
                  </li>
                  <li>
                    <strong>Thư viện giao diện đồ họa PySide6:</strong> Là bản ràng buộc chính thức của Qt6 cho Python, cung cấp các điều khiển bảng biểu mật độ cao (<code className="font-mono">QTableWidget</code>), quản lý thẻ màn hình (<code className="font-mono">QTabWidget</code>) và cơ chế luồng nền (<code className="font-mono">QThreadPool</code> / <code className="font-mono">Signal-Slot</code>) giúp giao diện không bị đơ khi vòng lặp bộ đếm <span className="font-mono">k</span> chạy qua hàng nghìn lượt thử.
                  </li>
                  <li>
                    <strong>Tham khảo các kiến trúc giải pháp chuẩn bên ngoài:</strong> Nhóm đã khảo sát mô hình <em>Clean Architecture</em> (Robert C. Martin), kiến trúc <em>Hexagonal (Ports &amp; Adapters)</em> và cấu trúc tách bạch mô-đun mật mã trong các thư viện mã nguồn mở uy tín (như <code className="font-mono">pyca/cryptography</code> và chuẩn kiểm chứng NIST FIPS 186-5). Từ đó, nhóm thiết kế kiến trúc tách riêng lõi toán học thuần túy (Domain) khỏi giao diện (Presentation), giúp bộ kiểm thử <code className="font-mono">unittest</code> kiểm chứng 100% phép toán độc lập với cửa sổ đồ họa.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">3.1.2. Kiến trúc 4 tầng của phần mềm</h4>
                <p>
                  Phần mềm được tổ chức thành <strong>4 tầng kiến trúc độc lập</strong> với chiều phụ thuộc một chiều từ ngoài vào trong như minh họa tại Hình 3.1:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Tầng 1 – Presentation (Tầng Giao diện – <code className="font-mono">presentation/main_window.py</code>):</strong> Đảm nhiệm hiển thị 4 màn hình chức năng và Bảng quá trình tính toán (Trace Table). Chỉ tiếp nhận sự kiện từ người dùng, gọi dịch vụ điều phối ở tầng Application và cập nhật kết quả lên các widget.
                  </li>
                  <li>
                    <strong>Tầng 2 – Application (Tầng Điều phối Use Case – <code className="font-mono">application/coordinator.py</code>):</strong> Quản lý trạng thái phiên làm việc, chụp bản sao dữ liệu đầu vào (<em>Snapshot</em>) kèm số thứ tự phiên bản (<em>Revision</em>) tại thời điểm bấm nút, điều phối tác vụ ký và phát hiện kết quả cũ (<em>Stale-State</em>) khi người dùng chỉnh sửa ô nhập liệu.
                  </li>
                  <li>
                    <strong>Tầng 3 – Domain (Tầng Lõi toán học MHK độc lập – <code className="font-mono">domain/mhk_engine.py</code>):</strong> Chứa toàn bộ các cấu trúc dữ liệu bất biến (<code className="font-mono">@dataclass(frozen=True)</code>) và các hàm toán học thuần túy: <code className="font-mono">generate_keypair()</code>, <code className="font-mono">solve_superincreasing_greedy()</code>, <code className="font-mono">build_frame_and_target()</code>, <code className="font-mono">sign_message()</code> và <code className="font-mono">verify_signature()</code>.
                  </li>
                  <li>
                    <strong>Tầng 4 – Infrastructure (Tầng Đọc/Ghi tệp JSON – <code className="font-mono">infrastructure/json_repository.py</code>):</strong> Đảm nhiệm việc xuất và nhập gói dữ liệu khóa công khai, chữ ký điện tử theo định dạng JSON chuẩn UTF-8, đồng thời kiểm soát lược đồ để không bao giờ ghi khóa bí mật <span className="font-mono">(W, q, r, u)</span> vào tệp chữ ký.
                  </li>
                </ul>

                <Figure3_1_FourTierArchitecture />
              </div>

              <div className="space-y-3">
                <h4 className="font-bold">
                  3.1.3. Thiết kế 4 màn hình giao diện và Bảng quá trình tính toán (Trace Table)
                </h4>
                <p>
                  Để đáp ứng trực tiếp yêu cầu <em>&quot;Tất cả các yêu cầu được thực hiện trên giao diện màn hình của chương trình phần mềm. Hiển thị kết quả các bước quá trình tính toán và kết quả cuối cùng của hệ chữ ký trên màn hình giao diện&quot;</em>, ứng dụng được thiết kế gồm 4 màn hình chuyên biệt kết hợp với Bảng quá trình tính toán (Trace Table) như đặc tả tại Bảng 3.1b và Bảng 3.2.
                </p>

                <table className="w-full border-collapse border border-black text-xs">
                  <caption className="mb-1 text-left font-bold">
                    Bảng 3.1b: Đặc tả chi tiết 4 màn hình giao diện và Bảng quá trình tính toán (Trace Table)
                  </caption>
                  <thead>
                    <tr className="border-b border-black font-bold text-center">
                      <th className="border-r border-black px-2 py-1.5">Tên màn hình</th>
                      <th className="border-r border-black px-2 py-1.5">Các ô nhập liệu (Inputs)</th>
                      <th className="border-r border-black px-2 py-1.5">Các nút bấm điều khiển</th>
                      <th className="px-2 py-1.5">Thông tin đầu ra &amp; Bảng giải trình (Outputs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black px-2 py-1.5 font-semibold">
                        1. Tham số &amp; Khóa (Yêu cầu a, b)
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        • Hộp chọn Profile (<code className="font-mono">mhk-demo-preimage-v1</code>)<br />
                        • Ô nhập số phần tử <span className="font-mono">n</span><br />
                        • Ô nhập dãy siêu tăng <span className="font-mono">W</span><br />
                        • Ô nhập mô-đun <span className="font-mono">q</span> và số nhân <span className="font-mono">r</span>
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        • <em>Kiểm tra &amp; Tạo khóa (pk, sk)</em><br />
                        • <em>Nạp bộ tham số chuẩn</em><br />
                        • <em>Thử ca lỗi dãy W / gcd</em><br />
                        • <em>Xuất pk JSON</em>
                      </td>
                      <td className="px-2 py-1.5">
                        • Trạng thái 4 điều kiện toán học (siêu tăng, tổng W, q, gcd)<br />
                        • Khóa công khai <span className="font-mono">pk = (B, T, key_id)</span><br />
                        • Khóa bí mật <span className="font-mono">sk = (W, q, r, u)</span><br />
                        • Bảng tính từng dòng <span className="font-mono">Bᵢ = (r × Wᵢ) mod q</span> và Trace Table
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black px-2 py-1.5 font-semibold">
                        2. Ký văn bản (Yêu cầu c)
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        • Ô văn bản cần ký <span className="font-mono">M</span><br />
                        • Giới hạn lượt thử bộ đếm <span className="font-mono">k_max</span> (mặc định 4096)<br />
                        • Thông tin bộ khóa <span className="font-mono">(pk, sk)</span> hiện hành
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        • <em>Thực hiện Ký văn bản M</em><br />
                        • <em>Mô phỏng Hủy (CANCELLED)</em><br />
                        • <em>Chuyển sang Xác minh</em><br />
                        • <em>Xuất chữ ký JSON</em>
                      </td>
                      <td className="px-2 py-1.5">
                        • Độ dài byte UTF-8 và chuỗi hex của <span className="font-mono">M</span><br />
                        • Chữ ký <span className="font-mono">σ = (k, x)</span>, <span className="font-mono">SHA-256(frame)</span>, <span className="font-mono">yₖ</span>, <span className="font-mono">t</span><br />
                        • Bảng các lượt thử bộ đếm <span className="font-mono">k</span> và lý do loại/nhận từng mục tiêu
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black px-2 py-1.5 font-semibold">
                        3. Xác minh (Yêu cầu d)
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        • Ô văn bản cần kiểm tra <span className="font-mono">M</span><br />
                        • Ô khóa công khai <span className="font-mono">B</span><br />
                        • Ô bộ đếm <span className="font-mono">k</span><br />
                        • Ô vector nhị phân <span className="font-mono">x</span>
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        • <em>Kiểm tra Xác thực Chữ ký</em><br />
                        • <em>Nạp JSON &amp; Xác minh</em><br />
                        • <em>Thử sửa văn bản / chữ ký</em>
                      </td>
                      <td className="px-2 py-1.5">
                        • Đại diện văn bản <span className="font-mono">yₖ = H(frame) mod (T+1)</span><br />
                        • Bảng đóng góp từng bit <span className="font-mono">Bᵢ × xᵢ</span> và tổng <span className="font-mono">v</span><br />
                        • Phép so sánh <span className="font-mono">v == yₖ</span> và trạng thái kết luận
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r border-black px-2 py-1.5 font-semibold">
                        4. Ví dụ &amp; Hướng dẫn
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        • Danh sách các bộ dữ liệu kịch bản mẫu (TC1, TC2, TC3, TC4 và Phản ví dụ k=123)
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        • <em>Nạp kịch bản lên giao diện</em><br />
                        • <em>Chạy lại toàn bộ Test Cases</em>
                      </td>
                      <td className="px-2 py-1.5">
                        • Bảng kết quả kiểm thử tự động và trình xem mã nguồn Python 4 tầng
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="w-full border-collapse border border-black text-xs">
                  <caption className="mb-1 text-left font-bold">
                    Bảng 3.2: Giải thích ý nghĩa và hướng xử lý 6 trạng thái kết quả của phần mềm
                  </caption>
                  <thead>
                    <tr className="border-b border-black font-bold text-center">
                      <th className="border-r border-black px-2 py-1.5">Mã trạng thái</th>
                      <th className="border-r border-black px-2 py-1.5">Ý nghĩa toán học &amp; hệ thống</th>
                      <th className="px-2 py-1.5">Cách đọc kết quả và hướng xử lý</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black px-2 py-1.5 font-mono font-bold">VALID</td>
                      <td className="border-r border-black px-2 py-1.5">
                        Quan hệ toán học của hồ sơ <code className="font-mono">mhk-demo-preimage-v1</code> khớp hoàn toàn (<span className="font-mono">v == yₖ</span> hoặc tham số khóa hợp lệ).
                      </td>
                      <td className="px-2 py-1.5">
                        Đọc thêm nhãn demo và kiểm tra độc lập độ tin cậy của chủ sở hữu khóa công khai.
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black px-2 py-1.5 font-mono font-bold">INVALID</td>
                      <td className="border-r border-black px-2 py-1.5">
                        Dữ liệu đầu vào đúng cấu trúc nhưng phép đối chiếu không khớp (<span className="font-mono">v ≠ yₖ</span>).
                      </td>
                      <td className="px-2 py-1.5">
                        Kiểm tra xem văn bản <span className="font-mono">M</span>, chữ ký <span className="font-mono">(k, x)</span> hoặc khóa công khai <span className="font-mono">B</span> có bị sửa đổi hay không.
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black px-2 py-1.5 font-mono font-bold">FORMAT_ERROR</td>
                      <td className="border-r border-black px-2 py-1.5">
                        Dữ liệu không đúng cấu trúc, sai kiểu số nguyên hoặc vi phạm điều kiện miền (ví dụ: <span className="font-mono">W</span> không siêu tăng, <span className="font-mono">gcd(r,q) ≠ 1</span>, hoặc <span className="font-mono">x</span> chứa số <span className="font-mono">2</span>).
                      </td>
                      <td className="px-2 py-1.5">
                        Sửa lại trường dữ liệu bị báo lỗi định dạng rồi thực hiện tính lại (không coi là chữ ký hợp lệ cấu trúc).
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black px-2 py-1.5 font-mono font-bold">NOT_FOUND</td>
                      <td className="border-r border-black px-2 py-1.5">
                        Đã thử hết giới hạn bộ đếm (<span className="font-mono">k = 0..4095</span>) nhưng chưa tìm được mục tiêu <span className="font-mono">yₖ</span> có nghiệm ba lô hợp lệ.
                      </td>
                      <td className="px-2 py-1.5">
                        Đây là trạng thái của bước Ký; không coi là văn bản giả mạo. Có thể tăng giới hạn thử hoặc tạo bộ khóa mới.
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black px-2 py-1.5 font-mono font-bold">
                        TIME_LIMIT / CANCELLED
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        Tác vụ ký vượt quá thời gian cho phép hoặc người dùng chủ động bấm nút Hủy khi đang tính.
                      </td>
                      <td className="px-2 py-1.5">
                        Chưa có chữ ký hoàn tất để xuất tệp JSON; kết quả dở dang không được dùng làm chữ ký hiện hành.
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r border-black px-2 py-1.5 font-mono font-bold">
                        UNSUPPORTED_PROFILE
                      </td>
                      <td className="border-r border-black px-2 py-1.5">
                        Trường <code className="font-mono">algorithm_id</code> không khớp với hồ sơ <code className="font-mono">mhk-demo-preimage-v1</code>.
                      </td>
                      <td className="px-2 py-1.5">
                        Chọn đúng hồ sơ thuật toán và định dạng gói dữ liệu tương ứng.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3.2. Cài đặt thử nghiệm chương trình phần mềm */}
            <div className="space-y-4">
              <h3 className="text-base font-bold">
                3.2. Cài đặt thử nghiệm chương trình phần mềm
              </h3>

              <div className="space-y-2">
                <h4 className="font-bold">3.2.1. Tổ chức thư mục mã nguồn dự án và gói nộp bài (*.rar)</h4>
                <p>
                  Tuân thủ quy định nộp bài của Khoa Công nghệ thông tin – Trường Công nghệ – ĐHKTQD (nộp 01 quyển Báo cáo và 01 file nén <code className="font-mono">*.rar</code> chứa file <code className="font-mono">*.DOC</code>, các file mã nguồn Python và file chạy của chương trình phần mềm gửi về địa chỉ email giảng viên <code className="font-mono">tuanlm@neu.edu.vn</code>), toàn bộ gói sản phẩm của nhóm được tổ chức như sau:
                </p>
                <pre className="border border-black bg-white p-3 font-mono text-xs overflow-x-auto">
                  {PYTHON_PROJECT_TREE}
                </pre>

                <table className="w-full border-collapse border border-black text-xs">
                  <caption className="mb-1 text-left font-bold">
                    Bảng 3.3: Danh mục các tệp mã nguồn Python (.py) trong dự án phần mềm chữ ký điện tử MHK
                  </caption>
                  <thead>
                    <tr className="border-b border-black font-bold text-center">
                      <th className="border-r border-black px-2 py-1.5">STT</th>
                      <th className="border-r border-black px-2 py-1.5">Đường dẫn tệp (.py)</th>
                      <th className="border-r border-black px-2 py-1.5">Tầng kiến trúc</th>
                      <th className="px-2 py-1.5">Chức năng &amp; Trách nhiệm chính</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PYTHON_SOURCE_FILES.map((f, i) => (
                      <tr key={f.path} className="border-b border-black">
                        <td className="border-r border-black px-2 py-1.5 text-center">{i + 1}</td>
                        <td className="border-r border-black px-2 py-1.5 font-mono font-bold">{f.path}</td>
                        <td className="border-r border-black px-2 py-1.5 text-center font-mono">{f.layer}</td>
                        <td className="px-2 py-1.5">{f.roleSummary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold">3.2.2. Giải thích các đoạn mã nguồn cốt lõi</h4>
                <p>
                  Dưới đây là mã nguồn Python cốt lõi của chương trình thực hiện 4 chức năng (a, b, c, d) kèm lời chú thích giải thích thuật toán bên dưới từng đoạn mã:
                </p>

                {PYTHON_SOURCE_FILES.map((file, idx) => (
                  <div key={file.path} className="space-y-2 border border-black p-3">
                    <div className="font-bold text-xs uppercase border-b border-black pb-1">
                      Đoạn mã 3.{idx + 1}: {file.title}
                    </div>
                    <p className="text-xs italic">{file.description}</p>
                    <pre className="border border-black bg-white p-2.5 font-mono text-[11px] leading-snug overflow-x-auto max-h-96">
                      {file.code}
                    </pre>
                    <div className="text-xs space-y-1">
                      <div className="font-bold">Giải thích chi tiết hoạt động của đoạn mã:</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {file.annotations.map((note, nIdx) => (
                          <li key={nIdx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3.3. Hướng dẫn cài đặt phần mềm */}
            <div className="space-y-3">
              <h3 className="text-base font-bold">
                3.3. Hướng dẫn cài đặt phần mềm
              </h3>
              <div className="space-y-2">
                <h4 className="font-bold">3.3.1. Hướng dẫn cài đặt phần mềm nền (Python &amp; PySide6)</h4>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>
                    <strong>Tải và cài đặt trình thông dịch Python:</strong> Truy cập trang chính thức <span className="font-mono">https://www.python.org/downloads/</span>, tải bộ cài đặt <strong>Python 3.11+</strong> (64-bit). Khi chạy trình cài đặt trên Windows, bắt buộc đánh dấu tích vào ô <em>&quot;Add python.exe to PATH&quot;</em> trước khi bấm <em>Install Now</em>.
                  </li>
                  <li>
                    <strong>Khởi tạo môi trường ảo (khuyến nghị) và cài đặt thư viện PySide6:</strong> Mở cửa sổ Command Prompt (CMD) hoặc PowerShell tại thư mục <code className="font-mono">mhk_signature_app/</code> và chạy các lệnh sau:
                    <pre className="mt-1 border border-black p-2 font-mono text-xs">
                      python -m venv .venv{'\n'}.venv\Scripts\activate{'\n'}pip install --upgrade pip{'\n'}pip install PySide6 pyinstaller
                    </pre>
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">3.3.2. Hướng dẫn cài đặt và chạy chương trình của đề tài</h4>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>
                    <strong>Chạy chương trình từ tệp thực thi đóng gói sẵn (.exe):</strong> Giải nén tệp nén nộp bài <code className="font-mono">Nhom_MHK_ATTT_Submission.rar</code>, mở thư mục <code className="font-mono">release/</code> và nhấp đúp chuột vào tệp <code className="font-mono">MHK_Signature_App.exe</code>. Chương trình sẽ mở trực tiếp cửa sổ đồ họa mà không yêu cầu máy tính cài sẵn Python.
                  </li>
                  <li>
                    <strong>Chạy chương trình trực tiếp từ mã nguồn Python:</strong> Mở Terminal tại thư mục <code className="font-mono">mhk_signature_app/</code> và chạy lệnh:
                    <pre className="mt-1 border border-black p-2 font-mono text-xs">
                      python main.py
                    </pre>
                  </li>
                  <li>
                    <strong>Chạy bộ kiểm thử đơn vị tự động (Unit Tests) cho 4 kịch bản:</strong>
                    <pre className="mt-1 border border-black p-2 font-mono text-xs">
                      python -m unittest tests/test_mhk_engine.py -v
                    </pre>
                  </li>
                  <li>
                    <strong>Lệnh đóng gói lại tệp chạy .exe từ mã nguồn (nếu cần biên dịch lại):</strong>
                    <pre className="mt-1 border border-black p-2 font-mono text-xs">
                      pyinstaller --noconsole --onefile --name MHK_Signature_App main.py
                    </pre>
                  </li>
                </ol>
              </div>
            </div>

            {/* 3.4. Hướng dẫn chi tiết sử dụng các chức năng của phần mềm (KÈM HÌNH ẢNH) */}
            <div className="space-y-4">
              <h3 className="text-base font-bold">
                3.4. Hướng dẫn chi tiết sử dụng các chức năng của phần mềm
              </h3>

              <div className="space-y-2">
                <h4 className="font-bold">
                  3.4.1. Chức năng nhập tham số và tạo khóa (Yêu cầu a, b)
                </h4>
                <p>
                  Khi khởi động chương trình, người dùng làm việc tại <strong>Màn hình 1 (1. Tham số &amp; Khóa)</strong> để thực hiện Yêu cầu a) và Yêu cầu b):
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Thực hiện Yêu cầu a) (Nhập và kiểm tra tham số đầu vào):</strong> Chọn hồ sơ <code className="font-mono">mhk-demo-preimage-v1</code>, nhập số phần tử <span className="font-mono">n = 5</span>, dãy siêu tăng <span className="font-mono">W = 2, 3, 7, 14, 30</span>, mô-đun <span className="font-mono">q = 61</span> và số nhân <span className="font-mono">r = 17</span>. Bấm nút <strong>&quot;Kiểm tra &amp; Tạo khóa (pk, sk)&quot;</strong>. Khung bên trái kiểm tra và xác nhận cả 4 điều kiện toán học đều đạt <span className="font-mono">[ĐẠT / HỢP LỆ]</span>.
                  </li>
                  <li>
                    <strong>Thực hiện Yêu cầu b) (Tính toán và hiển thị khóa công khai, khóa bí mật):</strong> Khung bên phải hiển thị rõ ràng Khóa công khai <span className="font-mono">B = (34, 51, 58, 55, 22)</span>, tổng <span className="font-mono">T = 220</span>, Khóa bí mật <span className="font-mono">W = (2, 3, 7, 14, 30), q = 61, r = 17</span>, nghịch đảo <span className="font-mono">u = 18</span> cùng bảng tính chi tiết từng phần tử <span className="font-mono">Bᵢ = (17 × Wᵢ) mod 61</span> như Hình 3.2.
                  </li>
                </ul>
                <Figure3_2_KeyGenScreenWireframe />
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">
                  3.4.2. Chức năng ký văn bản M (Yêu cầu c)
                </h4>
                <p>
                  Chuyển sang <strong>Màn hình 2 (2. Ký văn bản)</strong> để thực hiện Yêu cầu c):
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Nhập văn bản cần ký <span className="font-mono">M = &quot;Tôi đồng ý&quot;</span>. Giao diện lập tức hiển thị độ dài chính xác là <strong>15 bytes UTF-8</strong> (<code className="font-mono">54c3b46920c491e1bb936e6720c3bd</code>).
                  </li>
                  <li>
                    Bấm nút <strong>&quot;Thực hiện Ký văn bản M&quot;</strong>. Khung kết quả bên phải hiển thị gói chữ ký <span className="font-mono">σ = (k = 2, x = (1, 0, 0, 0, 1))</span>, giá trị đại diện <span className="font-mono">y₂ = 56</span>, chuỗi băm SHA-256 (<code className="font-mono">e40b8fe9197f26188ac39dee57029c93a2c472be45bbbde89febb4731732bffc</code>) và bảng giải trình đầy đủ 3 lượt thử bộ đếm <span className="font-mono">k = 0, 1, 2</span> như Hình 3.3.
                  </li>
                </ul>
                <Figure3_3_SignScreenWireframe />
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">
                  3.4.3. Chức năng kiểm tra xác thực chữ ký (Yêu cầu d)
                </h4>
                <p>
                  Bấm nút <em>&quot;Chuyển (M, pk, σ) sang Xác minh&quot;</em> hoặc mở <strong>Màn hình 3 (3. Xác minh chữ ký)</strong> để thực hiện Yêu cầu d):
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Khung bên trái chỉ nhận các thông tin công khai: Văn bản <span className="font-mono">M = &quot;Tôi đồng ý&quot;</span>, Khóa công khai <span className="font-mono">B = 34, 51, 58, 55, 22</span>, Bộ đếm <span className="font-mono">k = 2</span> và Vector chữ ký <span className="font-mono">x = 1, 0, 0, 0, 1</span>.
                  </li>
                  <li>
                    Bấm nút <strong>&quot;Kiểm tra Xác thực Chữ ký&quot;</strong>. Khung bên phải hiển thị bảng đối chiếu hai vế: Đại diện văn bản <span className="font-mono">y₂ = 56</span> và Tổng chữ ký công khai <span className="font-mono">v = 34×1 + 22×1 = 56</span>. Do <span className="font-mono">56 == 56</span>, hệ thống kết luận <code className="font-mono">VALID</code> như Hình 3.4.
                  </li>
                </ul>
                <Figure3_4_VerifyScreenWireframe />
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">
                  3.4.4. Chức năng nạp ví dụ mẫu và xuất/nhập tệp JSON
                </h4>
                <p>
                  Tại <strong>Màn hình 4 (4. Ví dụ &amp; Kịch bản)</strong>, người dùng có thể bấm một nút để nạp nhanh các bộ dữ liệu kiểm thử chuẩn, hoặc sử dụng nút <em>&quot;Xuất chữ ký JSON&quot;</em> / <em>&quot;Nạp JSON &amp; Xác minh&quot;</em> để lưu trữ và trao đổi gói dữ liệu xác thực giữa Người ký và Người kiểm tra.
                </p>
              </div>
            </div>

            {/* 3.5. Kịch bản chạy thử nghiệm (Test Cases) và Kết quả */}
            <div className="space-y-3">
              <h3 className="text-base font-bold">
                3.5. Kịch bản chạy thử nghiệm (Test Cases) và Kết quả
              </h3>
              <p>
                Để kiểm chứng độ chính xác và tính chắc chắn của chương trình, nhóm đã xây dựng kế hoạch kiểm thử gồm 4 kịch bản cốt lõi (TC-01 đến TC-04) và 1 kịch bản phân tích bảo mật (TC-05). Kết quả chạy tự động trên giao diện được chụp tại Hình 3.5 và trình bày chi tiết tại Bảng 3.4.
              </p>

              <Figure3_5_TamperAndErrorScenarios />

              <table className="w-full border-collapse border border-black text-xs">
                <caption className="mb-1 text-left font-bold">
                  Bảng 3.4: Bảng tổng hợp 4 Kịch bản chạy thử nghiệm (Test Cases) và Kết quả thực tế
                </caption>
                <thead>
                  <tr className="border-b border-black font-bold text-center">
                    <th className="border-r border-black px-2 py-1.5 w-20">Mã TC</th>
                    <th className="border-r border-black px-2 py-1.5 w-44">Tên kịch bản kiểm thử</th>
                    <th className="border-r border-black px-2 py-1.5">Dữ liệu đầu vào (Input)</th>
                    <th className="border-r border-black px-2 py-1.5">Kết quả kỳ vọng</th>
                    <th className="border-r border-black px-2 py-1.5">Kết quả thực tế trên phần mềm</th>
                    <th className="px-2 py-1.5 w-20">Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">
                      TC-01
                    </td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Chạy bộ số chuẩn &amp; ký văn bản &quot;Tôi đồng ý&quot;
                    </td>
                    <td className="border-r border-black px-2 py-1.5 font-mono text-[11px]">
                      n=5, W=(2,3,7,14,30), q=61, r=17; M=&quot;Tôi đồng ý&quot; (15 bytes UTF-8)
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Sinh B=(34,51,58,55,22), u=18, T=220; loại k=0, k=1; nhận k=2 với x=(1,0,0,0,1); xác thực v=y₂=56 → <code className="font-mono">VALID</code>.
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Khớp chính xác 100%: B=(34,51,58,55,22), k=2, SHA-256=...32bffc, y₂=v=56 → <code className="font-mono font-bold">VALID</code>.
                      {onLoadScenarioInApp && (
                        <div className="mt-1 print:hidden">
                          <button
                            type="button"
                            onClick={() => onLoadScenarioInApp('tc1-standard')}
                            className="border border-black px-1.5 py-0.5 text-[10px] font-sans hover:bg-neutral-100"
                          >
                            [Chạy thử TC-01 trên App]
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">ĐẠT (PASS)</td>
                  </tr>

                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">
                      TC-02
                    </td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Nhập sai điều kiện dãy siêu tăng / nguyên tố cùng nhau
                    </td>
                    <td className="border-r border-black px-2 py-1.5 font-mono text-[11px]">
                      • Ca 2a: W=(2,3,7,12,30), q=61, r=17<br />
                      • Ca 2b: W=(2,3,7,14,30), q=60, r=15
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Chặn tạo khóa; báo lỗi rõ điều kiện vi phạm (<span className="font-mono">W₄=12 ≤ 12</span> và <span className="font-mono">gcd(15,60)=15 ≠ 1</span>) → <code className="font-mono">FORMAT_ERROR</code>.
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Cả hai ca đều bị chặn tại bước kiểm tra tham số và trả về <code className="font-mono font-bold">FORMAT_ERROR</code> kèm giải thích trên Trace Table.
                      {onLoadScenarioInApp && (
                        <div className="mt-1 print:hidden">
                          <button
                            type="button"
                            onClick={() => onLoadScenarioInApp('tc2-bad-superincreasing')}
                            className="border border-black px-1.5 py-0.5 text-[10px] font-sans hover:bg-neutral-100"
                          >
                            [Chạy thử TC-02 trên App]
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">ĐẠT (PASS)</td>
                  </tr>

                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">
                      TC-03
                    </td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Sửa văn bản sau khi ký
                    </td>
                    <td className="border-r border-black px-2 py-1.5 font-mono text-[11px]">
                      Đổi M thành &quot;Tôi không đồng ý&quot; (22 bytes); giữ nguyên B=(34,51,58,55,22), k=2, x=(1,0,0,0,1)
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Tính lại đại diện <span className="font-mono">y₂ = 65</span>; tổng chữ ký <span className="font-mono">v = 56</span>; do <span className="font-mono">56 ≠ 65</span> nên từ chối → <code className="font-mono">INVALID</code>.
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Hiển thị rõ <span className="font-mono">y₂ = 65 ≠ v = 56</span> và kết luận <code className="font-mono font-bold">INVALID</code>.
                      {onLoadScenarioInApp && (
                        <div className="mt-1 print:hidden">
                          <button
                            type="button"
                            onClick={() => onLoadScenarioInApp('tc3-tampered-message')}
                            className="border border-black px-1.5 py-0.5 text-[10px] font-sans hover:bg-neutral-100"
                          >
                            [Chạy thử TC-03 trên App]
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">ĐẠT (PASS)</td>
                  </tr>

                  <tr>
                    <td className="border-r border-black px-2 py-1.5 text-center font-mono font-bold">
                      TC-04
                    </td>
                    <td className="border-r border-black px-2 py-1.5 font-semibold">
                      Sửa vector chữ ký x
                    </td>
                    <td className="border-r border-black px-2 py-1.5 font-mono text-[11px]">
                      Giữ M=&quot;Tôi đồng ý&quot;, k=2;<br />
                      • Ca 4a: sửa bit đầu x=(0,0,0,0,1)<br />
                      • Ca 4b: nhập x=(2,0,0,0,1)
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      • Ca 4a: <span className="font-mono">v = 22 ≠ y₂ = 56</span> → <code className="font-mono">INVALID</code>.<br />
                      • Ca 4b: bit <span className="font-mono">2 ∉ &#123;0,1&#125;</span> → <code className="font-mono">FORMAT_ERROR</code>.
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Phân biệt chính xác lỗi toán học (<code className="font-mono font-bold">INVALID</code>, v=22) và lỗi cấu trúc (<code className="font-mono font-bold">FORMAT_ERROR</code>).
                      {onLoadScenarioInApp && (
                        <div className="mt-1 print:hidden">
                          <button
                            type="button"
                            onClick={() => onLoadScenarioInApp('tc4-tampered-signature')}
                            className="border border-black px-1.5 py-0.5 text-[10px] font-sans hover:bg-neutral-100"
                          >
                            [Chạy thử TC-04 trên App]
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">ĐẠT (PASS)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================================================================
            CHƯƠNG 4: ĐÁNH GIÁ KẾT QUẢ NGHIÊN CỨU VÀ KẾT LUẬN
        ================================================================ */}
        {activeFilter !== 'ch1_2' && (
          <section id="chuong-4" className="mt-8 space-y-4 border-b border-black pb-8 text-sm text-justify">
            <h2 className="text-lg font-bold uppercase">
              CHƯƠNG 4: ĐÁNH GIÁ KẾT QUẢ NGHIÊN CỨU VÀ KẾT LUẬN
            </h2>

            <div className="space-y-3">
              <h3 className="font-bold">4.1. Đánh giá kết quả đạt được</h3>
              <p>
                Sau quá trình nghiên cứu lý thuyết và phát triển phần mềm theo kiến trúc 4 tầng, đề tài đã hoàn thành 100% các mục tiêu và yêu cầu tối thiểu được giao. Bảng đối chiếu kết quả đạt được so với yêu cầu đề bài được tổng hợp tại Bảng 4.1.
              </p>

              <table className="w-full border-collapse border border-black text-xs">
                <caption className="mb-1 text-left font-bold">
                  Bảng 4.1: Đối chiếu kết quả thực hiện của đề tài so với các yêu cầu bắt buộc
                </caption>
                <thead>
                  <tr className="border-b border-black font-bold text-center">
                    <th className="border-r border-black px-2 py-1.5 w-28">Yêu cầu đề bài</th>
                    <th className="border-r border-black px-2 py-1.5">Nội dung yêu cầu</th>
                    <th className="border-r border-black px-2 py-1.5">Kết quả hoàn thành trong phần mềm &amp; báo cáo</th>
                    <th className="px-2 py-1.5 w-28">Mức độ đạt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-bold">Yêu cầu a)</td>
                    <td className="border-r border-black px-2 py-1.5">
                      Cho phép nhập các tham số đầu vào của hệ chữ ký trên màn hình giao diện.
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Màn hình 1 cho phép nhập <span className="font-mono">n, W, q, r</span> và tự động kiểm tra 4 điều kiện toán học kèm thông báo chi tiết từng vị trí vi phạm.
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">Hoàn thành 100%</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-bold">Yêu cầu b)</td>
                    <td className="border-r border-black px-2 py-1.5">
                      Tính toán và hiển thị tập các khóa công khai, khóa bí mật của hệ chữ ký.
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Tính chính xác <span className="font-mono">u = r⁻¹ mod q</span> và <span className="font-mono">Bᵢ = (r × Wᵢ) mod q</span>; hiển thị tách biệt bảng khóa công khai <span className="font-mono">pk</span> và khóa bí mật <span className="font-mono">sk</span>.
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">Hoàn thành 100%</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-bold">Yêu cầu c)</td>
                    <td className="border-r border-black px-2 py-1.5">
                      Tính toán và hiển thị chữ ký lên văn bản M.
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Màn hình 2 ký văn bản UTF-8 qua vòng lặp bộ đếm <span className="font-mono">k</span>, giải tham lam trên <span className="font-mono">W</span>, đối chiếu tổng công khai và tự xác minh trước khi xuất <span className="font-mono">σ = (k, x)</span>.
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">Hoàn thành 100%</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black px-2 py-1.5 text-center font-bold">Yêu cầu d)</td>
                    <td className="border-r border-black px-2 py-1.5">
                      Kiểm tra xác thực chữ ký đã ký lên văn bản M.
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Màn hình 3 kiểm tra độc lập chỉ từ <span className="font-mono">(M, B, k, x)</span>, phát hiện chính xác mọi ca sửa văn bản (<code className="font-mono">INVALID</code>) hoặc sửa chữ ký (<code className="font-mono">INVALID</code> / <code className="font-mono">FORMAT_ERROR</code>).
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">Hoàn thành 100%</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black px-2 py-1.5 text-center font-bold">Yêu cầu chung</td>
                    <td className="border-r border-black px-2 py-1.5">
                      Hiển thị kết quả các bước quá trình tính toán và kết quả cuối cùng trên giao diện.
                    </td>
                    <td className="border-r border-black px-2 py-1.5">
                      Tích hợp Bảng quá trình tính toán (Trace Table) 6 cột và cơ chế đánh dấu phiên bản dữ liệu (<span className="font-mono">Snapshot Revision</span>) trên mọi màn hình.
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold">Hoàn thành 100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">4.2. Hạn chế của hệ thống và Bài học rút ra</h3>
              <p>
                Từ thực nghiệm xây dựng chương trình, nhóm nghiên cứu nhấn mạnh sự khác biệt cốt lõi giữa <strong>tính đúng đắn của chương trình minh họa</strong> và <strong>độ an toàn mật mã trong thực tế</strong>:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Giới hạn của miền đại diện băm nhỏ (<span className="font-mono">T + 1 = 221</span>):</strong> Với bộ tham số nhỏ dùng để giảng dạy, miền giá trị mục tiêu <span className="font-mono">yₖ ∈ [0, 220]</span> quá nhỏ nên không có tính kháng tiền ảnh và kháng va chạm. Như thực nghiệm tại Hình 4.1, kẻ tấn công chỉ cần chọn trước <span className="font-mono">x = (1, 0, 1, 0, 1)</span> (tổng <span className="font-mono">v = 114</span>) và dò bộ đếm đến <span className="font-mono">k = 123</span> là tạo được chữ ký hợp lệ cho văn bản giả mạo mà không cần khóa bí mật.
                </li>
                <li>
                  <strong>Điểm yếu cấu trúc của bài toán Knapsack cơ bản:</strong> Thuật toán tấn công thời gian đa thức của Adi Shamir (1984) [2] đã chứng minh phép che giấu mô-đun một tầng của hệ MHK cơ bản có thể bị phá bằng thuật toán rút gọn cơ sở lưới LLL.
                </li>
                <li>
                  <strong>Bài học về thiết kế phần mềm mật mã:</strong> Không bao giờ được trộn lẫn dữ liệu khóa bí mật vào luồng xác thực công khai; phải tách biệt rõ lỗi cấu trúc định dạng (<code className="font-mono">FORMAT_ERROR</code>) với lỗi không khớp chữ ký (<code className="font-mono">INVALID</code>); và phải quản lý chặt chẽ trạng thái dữ liệu trên giao diện khi người dùng chỉnh sửa đầu vào.
                </li>
              </ul>

              <Figure4_1_ForgeryCounterexample />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold">4.3. Hướng phát triển của đề tài</h3>
              <ol className="list-decimal pl-6 space-y-1">
                <li>
                  <strong>Mở rộng kích thước khóa và tích hợp mô phỏng tấn công lưới LLL:</strong> Cho phép sinh tự động dãy siêu tăng kích thước lớn (<span className="font-mono">n = 128, 256</span> phần tử) và bổ sung màn hình trực quan hóa thuật toán rút gọn lưới LLL của Shamir để phục vụ giảng dạy chuyên sâu về phân tích mật mã (Cryptanalysis).
                </li>
                <li>
                  <strong>Tích hợp đối chiếu với các chuẩn chữ ký số hiện đại (RSA-PSS, ECDSA, Ed25519):</strong> Mở rộng tầng Domain để đặt hệ MHK cạnh các lược đồ chuẩn công nghiệp hiện nay, giúp sinh viên so sánh kích thước khóa, tốc độ ký/xác thực và cơ sở toán học.
                </li>
                <li>
                  <strong>Bổ sung mô hình Quản lý Chứng thư số (Mini-PKI):</strong> Minh họa cách gắn kết khóa công khai <span className="font-mono">pk</span> với danh tính thực của người ký thông qua chữ ký của Tổ chức chứng thực chữ ký số (CA).
                </li>
              </ol>
            </div>
          </section>
        )}

        {/* ================================================================
            TÀI LIỆU THAM KHẢO & PHỤ LỤC
        ================================================================ */}
        <section id="tai-lieu-tham-khao" className="mt-8 space-y-4 text-sm">
          <h2 className="text-lg font-bold uppercase">
            TÀI LIỆU THAM KHẢO &amp; PHỤ LỤC
          </h2>
          <div className="space-y-2 text-xs">
            <div className="font-bold uppercase">Danh mục Tài liệu tham khảo (Chuẩn IEEE):</div>
            <p>
              [1] Khoa Công nghệ thông tin – Trường Công nghệ, ĐHKTQD, <em>Tài liệu hướng dẫn bài tập lớn học phần An toàn và bảo mật thông tin &amp; Đặc tả hệ thống chữ ký điện tử MHK v2.0 (Hồ sơ mhk-demo-preimage-v1)</em>, Hà Nội, 2026.
            </p>
            <p>
              [2] A. Shamir, &quot;A Polynomial-Time Algorithm for Breaking the Basic Merkle–Hellman Cryptosystem,&quot; <em>IEEE Transactions on Information Theory</em>, vol. 30, no. 5, pp. 699–704, Sept. 1984, doi: 10.1109/TIT.1984.1056964.
            </p>
            <p>
              [3] R. C. Merkle and M. E. Hellman, &quot;Hiding Information and Signatures in Trapdoor Knapsacks,&quot; <em>IEEE Transactions on Information Theory</em>, vol. 24, no. 5, pp. 525–530, Sept. 1978.
            </p>
            <p>
              [4] W. Stallings, <em>Cryptography and Network Security: Principles and Practice</em>, 8th ed. Boston, MA: Pearson, 2020.
            </p>
            <p>
              [5] A. J. Menezes, P. C. van Oorschot, and S. A. Vanstone, <em>Handbook of Applied Cryptography</em>. Boca Raton, FL: CRC Press, 1996.
            </p>
            <p>
              [6] R. C. Martin, <em>Clean Architecture: A Craftsman&apos;s Guide to Software Structure and Design</em>. Boston, MA: Prentice Hall, 2017.
            </p>
          </div>

          <div className="space-y-2 text-xs pt-2">
            <div className="font-bold uppercase">
              Phụ lục A: Cấu trúc tệp JSON chuẩn của hệ thống (Không chứa khóa bí mật)
            </div>
            <pre className="border border-black bg-white p-3 font-mono text-[11px] overflow-x-auto">
{`{
  "schema": "mhk-public-verification-bundle-v1",
  "algorithm_id": "mhk-demo-preimage-v1",
  "message": "Tôi đồng ý",
  "public_key": {
    "algorithm_id": "mhk-demo-preimage-v1",
    "key_id": "mhk-42cbcba3",
    "n": 5,
    "B": [34, 51, 58, 55, 22],
    "T": 220
  },
  "signature": {
    "algorithm_id": "mhk-demo-preimage-v1",
    "format_version": "1.0",
    "mode": "demo-preimage",
    "key_id": "mhk-42cbcba3",
    "k": 2,
    "x": [1, 0, 0, 0, 1],
    "message_utf8_len": 15,
    "y_k": 56,
    "sha256_hex": "e40b8fe9197f26188ac39dee57029c93a2c472be45bbbde89febb4731732bffc"
  }
}`}
            </pre>
          </div>
        </section>
      </article>
    </div>
  );
};
