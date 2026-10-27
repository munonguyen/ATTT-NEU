"""
infrastructure/json_repository.py
Đọc/ghi dữ liệu JSON cho khóa công khai và chữ ký điện tử MHK.
Tuyệt đối không lưu các tham số bí mật (W, q, r, u) vào tệp chữ ký xuất ra.
"""

from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, Union
from python_mhk.domain.mhk_engine import PublicKey, SignaturePacket, SUPPORTED_PROFILE


def export_signature_bundle(
    file_path: Union[str, Path], message: str, pk: PublicKey, sig: SignaturePacket
) -> None:
    """Xuất gói dữ liệu xác thực công khai ra tệp JSON (không chứa W, q, r, u)."""
    payload: Dict[str, Any] = {
        "schema": "mhk-public-verification-bundle-v1",
        "algorithm_id": sig.algorithm_id,
        "message": message,
        "public_key": {
            "algorithm_id": pk.algorithm_id,
            "key_id": pk.key_id,
            "n": pk.n,
            "B": list(pk.B),
            "T": pk.T,
        },
        "signature": {
            "algorithm_id": sig.algorithm_id,
            "format_version": sig.format_version,
            "mode": sig.mode,
            "key_id": sig.key_id,
            "k": sig.k,
            "x": list(sig.x),
        },
    }
    Path(file_path).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def import_signature_bundle(file_path: Union[str, Path]) -> Dict[str, Any]:
    """Đọc tệp JSON và kiểm tra các trường bắt buộc trước khi nạp lên giao diện."""
    raw_text = Path(file_path).read_text(encoding="utf-8")
    data = json.loads(raw_text)
    if data.get("algorithm_id") != SUPPORTED_PROFILE:
        raise ValueError(f"UNSUPPORTED_PROFILE: {data.get('algorithm_id')}")
    return data
