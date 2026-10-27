"""
main.py
Điểm khởi chạy ứng dụng giao diện đồ họa Hệ thống Chữ ký Điện tử MHK.
Chạy lệnh: python -m python_mhk.main
"""

import sys
from PySide6.QtWidgets import QApplication
from python_mhk.presentation.main_window import MHKMainWindow


def main() -> None:
    app = QApplication(sys.argv)
    app.setApplicationName("MHK Digital Signature System (mhk-demo-preimage-v1)")
    window = MHKMainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
