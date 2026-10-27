"""
application/coordinator.py
Tầng Application điều phối các ca sử dụng (Use Cases) và quản lý Snapshot/Revision.
Đảm bảo kết quả của dữ liệu cũ hoặc tác vụ đã hủy không ghi đè trạng thái hiện hành.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional
from python_mhk.domain.mhk_engine import (
    PublicKey,
    SecretKey,
    SignaturePacket,
    ResultStatus,
    generate_keypair,
    sign_message,
    verify_signature,
)


@dataclass
class WorkspaceSnapshot:
    revision: int
    message: str
    pk: Optional[PublicKey] = None
    sk: Optional[SecretKey] = None
    signature: Optional[SignaturePacket] = None
    is_stale: bool = False


class MHKApplicationCoordinator:
    def __init__(self) -> None:
        self._revision: int = 1
        self.current_pk: Optional[PublicKey] = None
        self.current_sk: Optional[SecretKey] = None
        self.current_signature: Optional[SignaturePacket] = None
        self.last_signed_revision: Optional[int] = None

    @property
    def revision(self) -> int:
        return self._revision

    def bump_revision(self) -> int:
        """Tăng số phiên bản (revision) mỗi khi người dùng thay đổi tham số hoặc văn bản M."""
        self._revision += 1
        return self._revision

    def is_result_stale(self, result_revision: int) -> bool:
        """Kiểm tra xem kết quả trên màn hình có thuộc phiên bản dữ liệu cũ hay không."""
        return result_revision != self._revision

    def execute_keygen(self, n: int, W: List[int], q: int, r: int, profile: str):
        snap_rev = self.bump_revision()
        status, msg, pk, sk, trace = generate_keypair(n, W, q, r, profile)
        if status == ResultStatus.VALID:
            self.current_pk = pk
            self.current_sk = sk
            self.current_signature = None
        return snap_rev, status, msg, pk, sk, trace

    def execute_sign(self, message: str, max_counter: int = 4096):
        snap_rev = self._revision
        if not self.current_sk or not self.current_pk:
            return snap_rev, ResultStatus.FORMAT_ERROR, None, [], []
        status, sig, trials, trace = sign_message(
            message, self.current_sk, self.current_pk, max_counter
        )
        if status == ResultStatus.VALID and snap_rev == self._revision:
            self.current_signature = sig
            self.last_signed_revision = snap_rev
        return snap_rev, status, sig, trials, trace

    def execute_verify(self, message: str, pk: PublicKey, sig: SignaturePacket):
        snap_rev = self._revision
        status, y_k, v, trace = verify_signature(message, pk, sig)
        return snap_rev, status, y_k, v, trace
