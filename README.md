# Hệ thống Chữ ký Điện tử MHK (`mhk-demo-preimage-v1`)

Dự án Bài tập lớn / Tiểu luận môn **An toàn và Bảo mật Thông tin** — **Khoa Công nghệ thông tin – Trường Công nghệ – Đại học Kinh tế Quốc dân (ĐHKTQD)** (Học kỳ 1, 2026–2027).

## 1. Cấu trúc mã nguồn

```text
ATTT-NEU/
├── python_mhk/                                # Mã nguồn chương trình Python (4 tầng) & kiểm thử
│   ├── __init__.py
│   ├── main.py                                # Điểm khởi chạy giao diện PySide6
│   ├── requirements.txt                       # Thư viện cần cài: PySide6>=6.6.0, pytest>=8.0.0
│   ├── domain/mhk_engine.py                   # Lõi toán học MHK (Generate, Sign, Verify, Trace)
│   ├── application/coordinator.py             # Điều phối Use Case & Snapshot Revision
│   ├── infrastructure/json_repository.py      # Xuất/nhập JSON & bảo vệ khóa bí mật sk
│   ├── presentation/main_window.py            # Giao diện PySide6 4 màn hình & Trace Table
│   └── tests/test_mhk_engine.py               # Kiểm thử đơn vị tự động (TC-01..TC-04 & Forgery)
├── run.py                                     # File chạy nhanh chương trình từ thư mục gốc
├── run_mac_linux.sh                           # Script tự động cài môi trường & chạy trên macOS/Linux
└── run_windows.bat                            # Script tự động cài môi trường & chạy trên Windows
```

## 2. Hướng dẫn cài đặt và chạy chương trình

Yêu cầu: **Python 3.10 trở lên**.

### Cách 1: Chạy bằng script tự động
- **Windows:** Nhấp đúp file `run_windows.bat` (hoặc chạy trong CMD/PowerShell).
- **macOS / Linux:**
  ```bash
  chmod +x run_mac_linux.sh
  ./run_mac_linux.sh
  ```

### Cách 2: Chạy thủ công
```bash
pip install -r python_mhk/requirements.txt
python3 run.py
```

### Chạy kiểm thử tự động (Unit Tests)
```bash
python3 -m unittest python_mhk/tests/test_mhk_engine.py -v
```
