"""
presentation/main_window.py
Giao diện đồ họa PySide6 thực hiện đầy đủ 4 yêu cầu (a, b, c, d) trên màn hình
và hiển thị Bảng quá trình tính toán (Trace Table) từng bước.
"""

from __future__ import annotations
from typing import List
from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QTabWidget,
    QLabel,
    QLineEdit,
    QPlainTextEdit,
    QPushButton,
    QTableWidget,
    QTableWidgetItem,
    QHeaderView,
    QGroupBox,
    QFormLayout,
)
from python_mhk.application.coordinator import MHKApplicationCoordinator
from python_mhk.domain.mhk_engine import (
    PublicKey,
    SignaturePacket,
    TraceStep,
    SUPPORTED_PROFILE,
)


class MHKMainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.coordinator = MHKApplicationCoordinator()
        self.setWindowTitle("Hệ thống Chữ ký Điện tử MHK (mhk-demo-preimage-v1)")
        self.resize(1280, 820)

        central = QWidget(self)
        self.setCentralWidget(central)
        root_layout = QVBoxLayout(central)

        self.status_banner = QLabel("Hồ sơ: mhk-demo-preimage-v1 | Phiên bản dữ liệu: Rev #1")
        root_layout.addWidget(self.status_banner)

        self.tabs = QTabWidget()
        self.tab_keys = QWidget()
        self.tab_sign = QWidget()
        self.tab_verify = QWidget()
        self.tab_examples = QWidget()

        self.tabs.addTab(self.tab_keys, "1. Tham số & Khóa (Yêu cầu a, b)")
        self.tabs.addTab(self.tab_sign, "2. Ký văn bản M (Yêu cầu c)")
        self.tabs.addTab(self.tab_verify, "3. Xác minh chữ ký (Yêu cầu d)")
        self.tabs.addTab(self.tab_examples, "4. Ví dụ & Kịch bản kiểm thử")
        root_layout.addWidget(self.tabs, stretch=3)

        trace_group = QGroupBox("Bảng quá trình tính toán từng bước (Trace Table)")
        trace_layout = QVBoxLayout(trace_group)
        self.trace_table = QTableWidget(0, 6)
        self.trace_table.setHorizontalHeaderLabels([
            "Bước",
            "Giai đoạn",
            "Biểu thức toán học",
            "Đầu vào",
            "Kết quả",
            "Nguyên nhân quyết định",
        ])
        self.trace_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        trace_layout.addWidget(self.trace_table)
        root_layout.addWidget(trace_group, stretch=2)

        self._build_keys_tab()
        self._build_sign_tab()
        self._build_verify_tab()

    def _build_keys_tab(self) -> None:
        layout = QHBoxLayout(self.tab_keys)
        form_box = QGroupBox("Nhập tham số đầu vào (Yêu cầu a)")
        form = QFormLayout(form_box)

        self.input_n = QLineEdit("5")
        self.input_w = QLineEdit("2, 3, 7, 14, 30")
        self.input_q = QLineEdit("61")
        self.input_r = QLineEdit("17")
        form.addRow("Số phần tử (n):", self.input_n)
        form.addRow("Dãy siêu tăng (W):", self.input_w)
        form.addRow("Mô-đun (q > sum(W)):", self.input_q)
        form.addRow("Số nhân (r, gcd(r,q)=1):", self.input_r)

        btn_keygen = QPushButton("Kiểm tra & Tạo cặp khóa (pk, sk)")
        btn_keygen.clicked.connect(self.on_generate_keys)
        form.addRow(btn_keygen)

        out_box = QGroupBox("Kết quả Khóa công khai pk & Khóa bí mật sk (Yêu cầu b)")
        out_layout = QVBoxLayout(out_box)
        self.lbl_key_output = QPlainTextEdit()
        self.lbl_key_output.setReadOnly(True)
        out_layout.addWidget(self.lbl_key_output)

        layout.addWidget(form_box, 1)
        layout.addWidget(out_box, 1)

    def _build_sign_tab(self) -> None:
        layout = QHBoxLayout(self.tab_sign)
        left_box = QGroupBox("Nhập văn bản cần ký M (Yêu cầu c)")
        left_layout = QVBoxLayout(left_box)
        self.input_sign_msg = QPlainTextEdit("Tôi đồng ý")
        btn_sign = QPushButton("Thực hiện Ký văn bản M")
        btn_sign.clicked.connect(self.on_sign_message)
        btn_send_verify = QPushButton("Chuyển (M, pk, σ) sang màn hình Xác minh ->")
        btn_send_verify.clicked.connect(self.on_transfer_to_verify)
        left_layout.addWidget(self.input_sign_msg)
        left_layout.addWidget(btn_sign)
        left_layout.addWidget(btn_send_verify)

        right_box = QGroupBox("Kết quả Chữ ký σ & Các lượt thử bộ đếm k")
        right_layout = QVBoxLayout(right_box)
        self.lbl_sign_output = QPlainTextEdit()
        self.lbl_sign_output.setReadOnly(True)
        right_layout.addWidget(self.lbl_sign_output)

        layout.addWidget(left_box, 1)
        layout.addWidget(right_box, 1)

    def _build_verify_tab(self) -> None:
        layout = QHBoxLayout(self.tab_verify)
        left_box = QGroupBox("Dữ liệu công khai kiểm tra (M, B, k, x) (Yêu cầu d)")
        form = QFormLayout(left_box)
        self.verify_msg = QLineEdit("Tôi đồng ý")
        self.verify_b = QLineEdit("34, 51, 58, 55, 22")
        self.verify_k = QLineEdit("2")
        self.verify_x = QLineEdit("1, 0, 0, 0, 1")
        form.addRow("Văn bản M:", self.verify_msg)
        form.addRow("Khóa công khai B:", self.verify_b)
        form.addRow("Bộ đếm k:", self.verify_k)
        form.addRow("Vector chữ ký x:", self.verify_x)
        btn_verify = QPushButton("Kiểm tra Xác thực Chữ ký")
        btn_verify.clicked.connect(self.on_verify_signature)
        form.addRow(btn_verify)

        right_box = QGroupBox("Kết quả Đối chiếu v = sum(B_i * x_i) và y_k")
        right_layout = QVBoxLayout(right_box)
        self.lbl_verify_output = QPlainTextEdit()
        self.lbl_verify_output.setReadOnly(True)
        right_layout.addWidget(self.lbl_verify_output)

        layout.addWidget(left_box, 1)
        layout.addWidget(right_box, 1)

    def _populate_trace(self, steps: List[TraceStep]) -> None:
        self.trace_table.setRowCount(len(steps))
        for row_idx, st in enumerate(steps):
            vals = [
                str(st.step_no),
                st.stage,
                st.expression,
                st.input_summary,
                st.output_summary,
                st.decision_reason,
            ]
            for col_idx, text in enumerate(vals):
                item = QTableWidgetItem(text)
                item.setFlags(item.flags() ^ Qt.ItemFlag.ItemIsEditable)
                self.trace_table.setItem(row_idx, col_idx, item)

    def on_generate_keys(self) -> None:
        try:
            n = int(self.input_n.text().strip())
            W = [int(p.strip()) for p in self.input_w.text().split(",") if p.strip()]
            q = int(self.input_q.text().strip())
            r = int(self.input_r.text().strip())
        except ValueError:
            self.lbl_key_output.setPlainText("Trạng thái: FORMAT_ERROR (Tham số phải là số nguyên)")
            return

        rev, status, msg, pk, sk, trace = self.coordinator.execute_keygen(
            n, W, q, r, SUPPORTED_PROFILE
        )
        self._populate_trace(trace)
        if pk and sk:
            self.lbl_key_output.setPlainText(
                f"Trạng thái: {status.value} (Snapshot Rev #{rev})\n"
                f"Khóa công khai pk: B = {pk.B}, T = {pk.T}, key_id = {pk.key_id}\n"
                f"Khóa bí mật sk   : W = {sk.W}, q = {sk.q}, r = {sk.r}, u = {sk.u}"
            )
        else:
            self.lbl_key_output.setPlainText(f"Trạng thái: {status.value}\nChi tiết: {msg}")

    def on_sign_message(self) -> None:
        msg = self.input_sign_msg.toPlainText()
        rev, status, sig, trials, trace = self.coordinator.execute_sign(msg)
        self._populate_trace(trace)
        if sig:
            self.lbl_sign_output.setPlainText(
                f"Trạng thái: {status.value} (Snapshot Rev #{rev})\n"
                f"Chữ ký σ: k = {sig.k}, x = {sig.x}\n"
                f"Số lượt đã thử: {len(trials)}"
            )
        else:
            self.lbl_sign_output.setPlainText(f"Trạng thái: {status.value}")

    def on_transfer_to_verify(self) -> None:
        if self.coordinator.current_pk and self.coordinator.current_signature:
            self.verify_msg.setText(self.input_sign_msg.toPlainText())
            self.verify_b.setText(", ".join(map(str, self.coordinator.current_pk.B)))
            self.verify_k.setText(str(self.coordinator.current_signature.k))
            self.verify_x.setText(", ".join(map(str, self.coordinator.current_signature.x)))
            self.tabs.setCurrentWidget(self.tab_verify)
            self.on_verify_signature()

    def on_verify_signature(self) -> None:
        try:
            B = tuple(int(p.strip()) for p in self.verify_b.text().split(",") if p.strip())
            k = int(self.verify_k.text().strip())
            x = tuple(int(p.strip()) for p in self.verify_x.text().split(",") if p.strip())
        except ValueError:
            self.lbl_verify_output.setPlainText("Trạng thái: FORMAT_ERROR")
            return

        pk = PublicKey(SUPPORTED_PROFILE, "verify-key", len(B), B, sum(B))
        sig = SignaturePacket(SUPPORTED_PROFILE, "1.0", "demo-preimage", "verify-key", k, x)
        rev, status, y_k, v, trace = self.coordinator.execute_verify(
            self.verify_msg.text(), pk, sig
        )
        self._populate_trace(trace)
        self.lbl_verify_output.setPlainText(
            f"Trạng thái xác thực: {status.value} (Snapshot Rev #{rev})\n"
            f"Đại diện văn bản y_{k} = {y_k}\n"
            f"Tổng chữ ký công khai v = {v}\n"
            f"Kết luận so sánh: {v} {'==' if v == y_k else '!='} {y_k} -> {status.value}"
        )
