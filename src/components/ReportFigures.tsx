import React from 'react';

/**
 * Academic Monochrome Figures for Chapters 1, 3, and 4 of the Information Security Report.
 * Includes both actual captured GUI screenshots from the running software and structured
 * academic tables, strictly preserving black-and-white academic layout (no colors).
 */

export const REPORT_IMAGE_ASSETS = [
  {
    id: 'hinh_1_1',
    code: 'Hình 1.1',
    chapter: 'Chương 1 (Mục 1.5.2)',
    filename: 'hinh_1_1_mo_hinh_luong_du_lieu.png',
    path: '/img/hinh_1_1_mo_hinh_luong_du_lieu.png',
    caption:
      'Hình 1.1: Mô hình luồng dữ liệu từ bước Tạo khóa (pk, sk), Ký văn bản M tạo chữ ký σ đến bước Xác thực công khai.',
  },
  {
    id: 'hinh_3_1',
    code: 'Hình 3.1',
    chapter: 'Chương 3 (Mục 3.1.2)',
    filename: 'hinh_3_1_kien_truc_4_tang.png',
    path: '/img/hinh_3_1_kien_truc_4_tang.png',
    caption:
      'Hình 3.1: Sơ đồ kiến trúc 4 tầng (Presentation – Application – Domain – Infrastructure) của phần mềm chữ ký điện tử MHK.',
  },
  {
    id: 'hinh_3_2',
    code: 'Hình 3.2',
    chapter: 'Chương 3 (Mục 3.4.1)',
    filename: 'hinh_3_2_keygen.png',
    path: '/img/hinh_3_2_keygen.png',
    caption:
      'Hình 3.2: Ảnh chụp màn hình thực tế Màn hình 1 (Tham số và Khóa) sau khi kiểm tra điều kiện và sinh cặp khóa với bộ tham số chuẩn n=5, W=(2,3,7,14,30), q=61, r=17.',
  },
  {
    id: 'hinh_3_3',
    code: 'Hình 3.3',
    chapter: 'Chương 3 (Mục 3.4.2)',
    filename: 'hinh_3_3_sign.png',
    path: '/img/hinh_3_3_sign.png',
    caption:
      'Hình 3.3: Ảnh chụp màn hình thực tế Màn hình 2 (Ký văn bản) hiển thị chi tiết 3 lượt thử bộ đếm k=0, k=1, k=2 khi ký văn bản "Tôi đồng ý".',
  },
  {
    id: 'hinh_3_4',
    code: 'Hình 3.4',
    chapter: 'Chương 3 (Mục 3.4.3)',
    filename: 'hinh_3_4_verify.png',
    path: '/img/hinh_3_4_verify.png',
    caption:
      'Hình 3.4: Ảnh chụp màn hình thực tế Màn hình 3 (Xác minh chữ ký) thực hiện kiểm tra độc lập từ (M, B, k, x) và trả về trạng thái VALID khi v = y₂ = 56.',
  },
  {
    id: 'hinh_3_5',
    code: 'Hình 3.5',
    chapter: 'Chương 3 (Mục 3.5)',
    filename: 'hinh_3_5_testcases.png',
    path: '/img/hinh_3_5_testcases.png',
    caption:
      'Hình 3.5: Ảnh chụp màn hình thực tế Màn hình 4 (Ví dụ & Kịch bản kiểm thử) xác nhận toàn bộ các kịch bản TC-01, TC-02, TC-03, TC-04 và Phản ví dụ đều đạt [PASS / ĐẠT].',
  },
  {
    id: 'hinh_4_1',
    code: 'Hình 4.1',
    chapter: 'Chương 4 (Mục 4.2)',
    filename: 'hinh_4_1_forgery.png',
    path: '/img/hinh_4_1_forgery.png',
    caption:
      'Hình 4.1: Ảnh chụp màn hình thực nghiệm phản ví dụ giả mạo chữ ký tại bộ đếm k = 123 với tổng v = y₁₂₃ = 114 trên màn hình Xác minh mà không cần khóa bí mật.',
  },
];

export const ReportImageGallery: React.FC = () => (
  <section className="my-4 border-2 border-black bg-white p-5 text-black print:hidden">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-3">
      <div>
        <h3 className="text-sm font-bold uppercase">
          Thư mục Tổng hợp Hình ảnh Báo cáo (/img/ — Đủ 7 Hình Chương 1, 3, 4)
        </h3>
        <p className="mt-0.5 text-xs">
          Toàn bộ hình ảnh đã được tổng hợp vào thư mục <code className="font-mono font-bold">/img/</code> (và <code className="font-mono font-bold">/public/img/</code>). Bấm vào từng ảnh để tải lẻ hoặc tải trọn bộ file nén <code className="font-mono font-bold">.ZIP</code>.
        </p>
      </div>
      <a
        href="/img/Tat_Ca_Hinh_Anh_Bao_Cao_MHK.zip"
        download="Tat_Ca_Hinh_Anh_Bao_Cao_MHK.zip"
        className="border border-black bg-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 whitespace-nowrap shrink-0"
      >
        Tải Trọn bộ 7 Ảnh Báo cáo (/img/Tat_Ca_Hinh_Anh_Bao_Cao_MHK.zip)
      </a>
    </div>

    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      {REPORT_IMAGE_ASSETS.map((img) => (
        <div key={img.id} className="border border-black p-3 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between border-b border-black pb-1.5 text-xs">
              <span className="font-bold">
                {img.code} — {img.chapter}
              </span>
              <code className="font-mono text-[11px]">/img/{img.filename}</code>
            </div>
            <div className="mt-2 border border-black bg-white p-1">
              <img
                src={img.path}
                alt={img.caption}
                referrerPolicy="no-referrer"
                className="w-full h-44 object-contain bg-white"
              />
            </div>
            <p className="mt-2 text-xs italic">{img.caption}</p>
          </div>
          <div className="pt-1 flex items-center justify-end gap-2">
            <a
              href={img.path}
              target="_blank"
              rel="noreferrer"
              className="border border-black bg-white px-2.5 py-1 text-xs font-medium text-black hover:bg-neutral-100"
            >
              Mở ảnh gốc
            </a>
            <a
              href={img.path}
              download={img.filename}
              className="border border-black bg-black px-3 py-1 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              Tải {img.filename}
            </a>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export const Figure1_1_SystemDataFlow: React.FC = () => (
  <figure id="fig-1-1" className="my-6 border border-black bg-white p-4 text-black">
    <div className="mb-3 text-center text-xs font-bold uppercase">
      Sơ đồ luồng dữ liệu tổng thể của Hệ chữ ký điện tử MHK (mhk-demo-preimage-v1)
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs">
      <div className="border border-black p-3">
        <div className="border-b border-black pb-1 font-bold text-center">
          1. TRẠM TẠO KHÓA (NGƯỜI KÝ)
        </div>
        <ul className="mt-2 space-y-1 list-disc pl-4">
          <li>Đầu vào: n = 5, W = (2,3,7,14,30), q = 61, r = 17</li>
          <li>Kiểm tra: W siêu tăng (ΣW=56 &lt; 61), gcd(17,61)=1</li>
          <li>Tính nghịch đảo: u = r⁻¹ mod q = 18</li>
          <li>Tính Bᵢ = (r × Wᵢ) mod q → B = (34,51,58,55,22)</li>
          <li>Khóa bí mật sk = (W, q, r, u) [Giữ kín]</li>
          <li>Khóa công khai pk = (B, T=220) [Công bố]</li>
        </ul>
      </div>

      <div className="border border-black p-3">
        <div className="border-b border-black pb-1 font-bold text-center">
          2. TRẠM KÝ VĂN BẢN (NGƯỜI KÝ)
        </div>
        <ul className="mt-2 space-y-1 list-disc pl-4">
          <li>Đầu vào: Văn bản M = &quot;Tôi đồng ý&quot; (15 bytes UTF-8) + sk</li>
          <li>Đóng gói frame(M, k) với k = 0, 1, 2...</li>
          <li>Băm SHA-256: yₖ = H(frame) mod (T+1 = 221)</li>
          <li>Cửa sập: t = (u × yₖ) mod q</li>
          <li>Giải tham lam trên W tìm x ∈ &#123;0,1&#125;ⁿ (dư = 0)</li>
          <li>Đối chiếu công khai: ΣBᵢxᵢ == yₖ (Nhận k=2, x=(1,0,0,0,1))</li>
        </ul>
      </div>

      <div className="border border-black p-3">
        <div className="border-b border-black pb-1 font-bold text-center">
          3. TRẠM XÁC THỰC (NGƯỜI KIỂM TRA)
        </div>
        <ul className="mt-2 space-y-1 list-disc pl-4">
          <li>Đầu vào công khai: M, pk = B, chữ ký σ = (k, x)</li>
          <li>Không sử dụng khóa bí mật (W, q, r, u)</li>
          <li>Kiểm tra định dạng: x ∈ &#123;0,1&#125;⁵, 0 ≤ k &lt; 4096</li>
          <li>Tính lại đại diện: yₖ = SHA-256(frame(M, k)) mod 221</li>
          <li>Tính tổng công khai: v = ΣBᵢxᵢ = 34 + 22 = 56</li>
          <li>So sánh: v == yₖ (56 == 56 → Kết luận VALID)</li>
        </ul>
      </div>
    </div>
    <figcaption className="mt-3 text-center text-xs italic">
      Hình 1.1: Mô hình luồng dữ liệu từ bước Tạo khóa (pk, sk), Ký văn bản M tạo chữ ký σ đến bước Xác thực công khai.
    </figcaption>
  </figure>
);

export const Figure3_1_FourTierArchitecture: React.FC = () => (
  <figure id="fig-3-1" className="my-6 border border-black bg-white p-4 text-black">
    <div className="mx-auto max-w-3xl space-y-3 text-xs">
      <div className="border border-black p-3">
        <div className="flex items-center justify-between border-b border-black pb-1 font-bold">
          <span>TẦNG 1: PRESENTATION LAYER (Giao diện đồ họa PySide6 / Qt Widgets)</span>
          <span className="font-mono">presentation/main_window.py</span>
        </div>
        <p className="mt-1.5">
          Hiển thị 4 màn hình chức năng (Tham số &amp; Khóa; Ký văn bản; Xác minh; Ví dụ &amp; Hướng dẫn) và Bảng quá trình tính toán (Trace Table). Chỉ tiếp nhận sự kiện người dùng và cập nhật widget trên luồng giao diện chính.
        </p>
      </div>

      <div className="text-center font-mono text-xs font-bold">
        ↓ Gọi sự kiện thao tác (User Action) / Nhận kết quả cập nhật UI ↑
      </div>

      <div className="border border-black p-3">
        <div className="flex items-center justify-between border-b border-black pb-1 font-bold">
          <span>TẦNG 2: APPLICATION LAYER (Điều phối Use Case &amp; Quản lý Snapshot/Revision)</span>
          <span className="font-mono">application/coordinator.py</span>
        </div>
        <p className="mt-1.5">
          Chụp bản sao dữ liệu đầu vào (Snapshot) kèm số phiên bản (Revision) tại thời điểm bấm nút; điều phối tác vụ ký trên luồng nền (Worker/Cancel); đánh dấu kết quả cũ (Stale) ngay khi người dùng chỉnh sửa tham số hoặc văn bản M.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center font-mono text-xs font-bold">
        <div>↓ Gọi phép toán mật mã thuần túy</div>
        <div>↓ Gọi đọc/ghi tệp định dạng chuẩn</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border border-black p-3">
          <div className="border-b border-black pb-1 font-bold">
            TẦNG 3: DOMAIN LAYER (Lõi toán học MHK độc lập)
          </div>
          <div className="mt-1 font-mono text-[11px]">domain/mhk_engine.py</div>
          <ul className="mt-1.5 list-disc pl-4 space-y-0.5">
            <li>Kiểm tra dãy siêu tăng W, mô-đun q và gcd(r, q) = 1</li>
            <li>Tính nghịch đảo u = r⁻¹ mod q và khóa công khai Bᵢ</li>
            <li>Đóng gói frame, băm SHA-256 và giải tham lam trên W</li>
            <li>Hàm Verify độc lập: chỉ nhận (M, pk, σ), không đọc sk</li>
          </ul>
        </div>

        <div className="border border-black p-3">
          <div className="border-b border-black pb-1 font-bold">
            TẦNG 4: INFRASTRUCTURE LAYER (Đọc/Ghi tệp JSON)
          </div>
          <div className="mt-1 font-mono text-[11px]">infrastructure/json_repository.py</div>
          <ul className="mt-1.5 list-disc pl-4 space-y-0.5">
            <li>Xuất/nhập khóa công khai pk và chữ ký σ ra tệp JSON UTF-8</li>
            <li>Kiểm tra lược đồ JSON và nhãn hồ sơ mhk-demo-preimage-v1</li>
            <li>Loại bỏ tuyệt đối các trường bí mật (W, q, r, u) khi xuất chữ ký</li>
          </ul>
        </div>
      </div>
    </div>
    <figcaption className="mt-3 text-center text-xs italic">
      Hình 3.1: Sơ đồ kiến trúc 4 tầng (Presentation – Application – Domain – Infrastructure) của phần mềm chữ ký điện tử MHK.
    </figcaption>
  </figure>
);

export const Figure3_2_KeyGenScreenWireframe: React.FC = () => (
  <figure className="my-6 border border-black bg-white p-4 text-black space-y-3">
    <div className="border border-black bg-white p-1">
      <img
        src="/img/hinh_3_2_keygen.png"
        alt="Hình 3.2: Giao diện Màn hình 1 (Tham số và Khóa) khi tạo khóa chuẩn"
        referrerPolicy="no-referrer"
        className="w-full h-auto block border border-black"
      />
    </div>
    <div className="border border-black p-2.5 text-xs">
      <div className="font-bold">Mô tả chi tiết trạng thái hiển thị trên Hình 3.2:</div>
      <p className="mt-1">
        Ở khung bên trái, người dùng chọn hồ sơ <code className="font-mono">mhk-demo-preimage-v1</code> và nhập bộ tham số <span className="font-mono">n = 5, W = (2, 3, 7, 14, 30), q = 61, r = 17</span>. Cả 4 điều kiện toán học đều đạt <span className="font-mono">[ĐẠT / HỢP LỆ]</span>. Khung bên phải hiển thị khóa công khai <span className="font-mono">B = (34, 51, 58, 55, 22)</span>, tổng <span className="font-mono">T = 220</span>, nghịch đảo <span className="font-mono">u = 18</span> và bảng tính từng dòng <span className="font-mono">Bᵢ = (17 × Wᵢ) mod 61</span>.
      </p>
    </div>
    <figcaption className="text-center text-xs italic">
      Hình 3.2: Ảnh chụp màn hình thực tế Màn hình 1 (Tham số và Khóa) sau khi kiểm tra điều kiện và sinh cặp khóa với bộ tham số chuẩn n=5, W=(2,3,7,14,30), q=61, r=17.
    </figcaption>
  </figure>
);

export const Figure3_3_SignScreenWireframe: React.FC = () => (
  <figure className="my-6 border border-black bg-white p-4 text-black space-y-3">
    <div className="border border-black bg-white p-1">
      <img
        src="/img/hinh_3_3_sign.png"
        alt="Hình 3.3: Giao diện Màn hình 2 (Ký văn bản) với 3 lượt thử bộ đếm k"
        referrerPolicy="no-referrer"
        className="w-full h-auto block border border-black"
      />
    </div>
    <div className="border border-black p-2.5 text-xs">
      <div className="font-bold">Mô tả chi tiết trạng thái hiển thị trên Hình 3.3:</div>
      <p className="mt-1">
        Khi ký văn bản <span className="font-mono">M = &quot;Tôi đồng ý&quot;</span> (15 bytes UTF-8), Bảng giải trình bộ đếm <span className="font-mono">k</span> ghi nhận 3 lượt thử: Lượt <span className="font-mono">k = 0</span> (<span className="font-mono">y₀ = 104, t = 42</span>) bị loại vì tổng công khai <span className="font-mono">165 ≠ 104</span>; Lượt <span className="font-mono">k = 1</span> (<span className="font-mono">y₁ = 163, t = 6</span>) bị loại vì giải tham lam trên <span className="font-mono">W</span> còn dư <span className="font-mono">1 ≠ 0</span>; Lượt <span className="font-mono">k = 2</span> (<span className="font-mono">y₂ = 56, t = 32</span>) tìm được <span className="font-mono">x = (1, 0, 0, 0, 1)</span> có dư bằng <span className="font-mono">0</span> và tổng công khai <span className="font-mono">34 + 22 = 56 == y₂</span> nên được chấp nhận (<span className="font-mono">VALID</span>).
      </p>
    </div>
    <figcaption className="text-center text-xs italic">
      Hình 3.3: Ảnh chụp màn hình thực tế Màn hình 2 (Ký văn bản) hiển thị chi tiết 3 lượt thử bộ đếm k=0, k=1, k=2 khi ký văn bản &quot;Tôi đồng ý&quot;.
    </figcaption>
  </figure>
);

export const Figure3_4_VerifyScreenWireframe: React.FC = () => (
  <figure className="my-6 border border-black bg-white p-4 text-black space-y-3">
    <div className="border border-black bg-white p-1">
      <img
        src="/img/hinh_3_4_verify.png"
        alt="Hình 3.4: Giao diện Màn hình 3 (Xác minh chữ ký) trả về VALID"
        referrerPolicy="no-referrer"
        className="w-full h-auto block border border-black"
      />
    </div>
    <div className="border border-black p-2.5 text-xs">
      <div className="font-bold">Mô tả chi tiết trạng thái hiển thị trên Hình 3.4:</div>
      <p className="mt-1">
        Bộ xác minh chỉ nhận đầu vào công khai <span className="font-mono">M = &quot;Tôi đồng ý&quot;</span>, <span className="font-mono">B = (34, 51, 58, 55, 22)</span>, <span className="font-mono">k = 2</span> và <span className="font-mono">x = (1, 0, 0, 0, 1)</span>. Phía đại diện văn bản tính được <span className="font-mono">y₂ = 56</span>; phía tổng chữ ký công khai cộng các phần tử tại bit 1 được <span className="font-mono">v = 34 + 22 = 56</span>. Do <span className="font-mono">56 == 56</span>, hệ thống kết luận <span className="font-mono">VALID</span> mà không cần truy cập khóa bí mật.
      </p>
    </div>
    <figcaption className="text-center text-xs italic">
      Hình 3.4: Ảnh chụp màn hình thực tế Màn hình 3 (Xác minh chữ ký) thực hiện kiểm tra độc lập từ (M, B, k, x) và trả về trạng thái VALID khi v = y₂ = 56.
    </figcaption>
  </figure>
);

export const Figure3_5_TamperAndErrorScenarios: React.FC = () => (
  <figure className="my-6 border border-black bg-white p-4 text-black space-y-3">
    <div className="border border-black bg-white p-1">
      <img
        src="/img/hinh_3_5_testcases.png"
        alt="Hình 3.5: Giao diện Màn hình 4 hiển thị bảng kết quả chạy tự động các Kịch bản kiểm thử TC1-TC5"
        referrerPolicy="no-referrer"
        className="w-full h-auto block border border-black"
      />
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-xs">
      <div className="border border-black p-2.5">
        <div className="border-b border-black pb-1 font-bold">
          KỊCH BẢN 2: SAI THAM SỐ ĐẦU VÀO
        </div>
        <div className="mt-1.5 font-mono text-[11px] space-y-1">
          <div>• Nhập W = (2, 3, 7, 12, 30) → W₄ = 12 ≤ 12</div>
          <div>• Nhập q = 60, r = 15 → gcd(15, 60) = 15 ≠ 1</div>
          <div className="font-bold pt-1">→ Kết quả: FORMAT_ERROR</div>
        </div>
      </div>

      <div className="border border-black p-2.5">
        <div className="border-b border-black pb-1 font-bold">
          KỊCH BẢN 3: SỬA VĂN BẢN M SAU KHI KÝ
        </div>
        <div className="mt-1.5 font-mono text-[11px] space-y-1">
          <div>• Sửa M = &quot;Tôi không đồng ý&quot; (22 bytes)</div>
          <div>• Đại diện mới y₂ = 65 ≠ Tổng v = 56</div>
          <div className="font-bold pt-1">→ Kết quả: INVALID</div>
        </div>
      </div>

      <div className="border border-black p-2.5">
        <div className="border-b border-black pb-1 font-bold">
          KỊCH BẢN 4: SỬA VECTOR CHỮ KÝ x
        </div>
        <div className="mt-1.5 font-mono text-[11px] space-y-1">
          <div>• Ca 4a: x = (0,0,0,0,1) → v = 22 ≠ 56 (INVALID)</div>
          <div>• Ca 4b: x = (2,0,0,0,1) → x₁ = 2 ∉ &#123;0,1&#125;</div>
          <div className="font-bold pt-1">→ Kết quả: INVALID / FORMAT_ERROR</div>
        </div>
      </div>
    </div>
    <figcaption className="text-center text-xs italic">
      Hình 3.5: Ảnh chụp màn hình thực tế Màn hình 4 (Ví dụ &amp; Kịch bản kiểm thử) xác nhận toàn bộ các kịch bản TC-01, TC-02, TC-03, TC-04 và Phản ví dụ đều đạt [PASS / ĐẠT].
    </figcaption>
  </figure>
);

export const Figure4_1_ForgeryCounterexample: React.FC = () => (
  <figure className="my-6 border border-black bg-white p-4 text-black space-y-3">
    <div className="border border-black bg-white p-1">
      <img
        src="/img/hinh_4_1_forgery.png"
        alt="Hình 4.1: Minh họa thực nghiệm phản ví dụ giả mạo chữ ký tại k=123 trên màn hình Xác minh"
        referrerPolicy="no-referrer"
        className="w-full h-auto block border border-black"
      />
    </div>
    <div className="border border-black p-2.5 text-xs">
      <div className="font-bold">Phân tích kết quả thực nghiệm trên Hình 4.1:</div>
      <p className="mt-1">
        Kẻ tấn công không hề biết khóa bí mật <span className="font-mono">(W, q, r, u)</span> nhưng chọn trước vector <span className="font-mono">x = (1, 0, 1, 0, 1)</span> có tổng trên khóa công khai <span className="font-mono">B = (34, 51, 58, 55, 22)</span> là <span className="font-mono">v = 34 + 58 + 22 = 114</span>. Với văn bản giả mạo <span className="font-mono">M = &quot;Thông điệp giả mạo MHK&quot;</span>, kẻ tấn công chỉ cần thử bộ đếm đến <span className="font-mono">k = 123</span> là thu được <span className="font-mono">y₁₂₃ = 114 == v</span>, khiến màn hình Xác minh trả về <span className="font-mono">VALID</span>. Thực nghiệm này chứng minh trực quan vì sao miền băm nhỏ (<span className="font-mono">T + 1 = 221</span>) chỉ được phép dùng cho mục đích minh họa học thuật.
      </p>
    </div>
    <figcaption className="text-center text-xs italic">
      Hình 4.1: Ảnh chụp màn hình thực nghiệm phản ví dụ giả mạo chữ ký tại bộ đếm k = 123 với tổng v = y₁₂₃ = 114 trên màn hình Xác minh mà không cần khóa bí mật.
    </figcaption>
  </figure>
);
