# Hệ thống Chữ ký Điện tử MHK (`mhk-demo-preimage-v1`)

Dự án Bài tập lớn / Tiểu luận môn **An toàn và Bảo mật Thông tin** — **Khoa Công nghệ thông tin – Trường Công nghệ – Đại học Kinh tế Quốc dân (ĐHKTQD)** (Học kỳ 1, 2026–2027).

## 1. Các chức năng chính theo yêu cầu đề bài

- **a)** Nhập tham số đầu vào $(n, W, q, r, \text{profile})$ trên màn hình giao diện và kiểm tra tự động 4 điều kiện toán học:
  1. $|W| = n \ge 2$ và $w_i > 0$.
  2. Dãy siêu tăng: $w_i > \sum_{j=1}^{i-1} w_j$.
  3. Mô-đun: $q > \sum_{i=1}^n w_i$.
  4. Số nhân: $1 < r < q$ và $\gcd(r, q) = 1$.
- **b)** Tính toán và hiển thị tập Khóa công khai $pk = (B, T)$ với $b_i = (r \cdot w_i) \bmod q$, $T = \sum_{i=1}^n b_i$ và tập Khóa bí mật $sk = (W, q, r, u)$ với $u = r^{-1} \bmod q$.
- **c)** Ký số lên văn bản $M$ (UTF-8) theo khung chuẩn `b"MHK-DEMO-v1\x00" + len(M_bytes)_8B_BE + M_bytes + k_8B_BE`, tìm bộ đếm $k \in [0, 4095]$ thỏa mãn giải tham lam trên $W$ dư $0$ và $\sum_{i=1}^n b_i x_i = y_k$.
- **d)** Xác thực chữ ký hoàn toàn độc lập với khóa bí mật (chỉ dùng $M$, $pk=(B,T)$ và $\sigma=(k,x)$).
- **Hiển thị trung gian**: Bảng quá trình tính toán (**Trace Table 6 cột**) hiển thị đầy đủ từng bước tạo khóa, duyệt bộ đếm $k$, giải tham lam ngược và đối chiếu xác thực.

---

## 2. Cấu trúc thư mục dự án

```text
├── python_mhk/                         # Ứng dụng Python 4 tầng (Presentation, Application, Domain, Infrastructure)
│   ├── main.py                         # Điểm khởi chạy giao diện PySide6
│   ├── requirements.txt                # PySide6>=6.6.0, pytest>=8.0.0
│   ├── domain/mhk_engine.py            # Lõi toán học MHK độc lập
│   ├── application/coordinator.py      # Điều phối Use Case & Snapshot Revision
│   ├── infrastructure/json_repository.py # Xuất/Nhập JSON & bảo vệ khóa bí mật sk
│   ├── presentation/main_window.py     # Giao diện PySide6 4 màn hình & Trace Table
│   └── tests/test_mhk_engine.py        # Bộ kiểm thử đơn vị tự động (TC-01..TC-05)
├── src/                                # Ứng dụng Web trực quan & Trình xuất Báo cáo Word (.DOC)
│   ├── domain/mhkCrypto.ts             # Lõi toán học TypeScript đồng nhất 100% với Python
│   ├── components/ReportDocumentView.tsx # Toàn văn Báo cáo Tiểu luận (Chương 1–4, Times New Roman 13pt)
│   └── App.tsx                         # Giao diện 5 phân hệ
└── public/assets/
    ├── aistudio/an_to_n_th_ng_tin_a03d95f8 # File đề cương chi tiết đã cập nhật Chương 3 & 4
    └── report_figures/                 # Hình ảnh chụp giao diện thực tế (Hình 3.1 – 3.5, Hình 4.1)
```

---

## 3. Hướng dẫn chạy và kiểm thử

### Chạy ứng dụng Python (`python_mhk/`)
```bash
pip install -r python_mhk/requirements.txt
python3 -m unittest python_mhk/tests/test_mhk_engine.py -v
python3 -m python_mhk.main
```

### Chạy ứng dụng Web & Xuất Báo cáo `.DOC`
```bash
npm install
npm run dev
```
