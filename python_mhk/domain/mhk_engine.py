from __future__ import annotations
import hashlib
import math
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Tuple

SUPPORTED_PROFILE = "mhk-demo-preimage-v1"
MAX_COUNTER_LIMIT = 4096


class ResultStatus(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    FORMAT_ERROR = "FORMAT_ERROR"
    NOT_FOUND = "NOT_FOUND"
    TIME_LIMIT = "TIME_LIMIT"
    CANCELLED = "CANCELLED"
    UNSUPPORTED_PROFILE = "UNSUPPORTED_PROFILE"


@dataclass(frozen=True)
class TraceStep:
    step_no: int
    stage: str
    expression: str
    input_summary: str
    output_summary: str
    decision_reason: str


@dataclass(frozen=True)
class PublicKey:
    algorithm_id: str
    key_id: str
    n: int
    B: Tuple[int, ...]
    T: int


@dataclass(frozen=True)
class SecretKey:
    algorithm_id: str
    key_id: str
    n: int
    W: Tuple[int, ...]
    q: int
    r: int
    u: int


@dataclass(frozen=True)
class SignaturePacket:
    algorithm_id: str
    format_version: str
    mode: str
    key_id: str
    k: int
    x: Tuple[int, ...]


def extended_gcd(a: int, b: int) -> Tuple[int, int, int]:
    old_r, r = a, b
    old_s, s = 1, 0
    old_t, t = 0, 1
    while r != 0:
        quotient = old_r // r
        old_r, r = r, old_r - quotient * r
        old_s, s = s, old_s - quotient * s
        old_t, t = t, old_t - quotient * t
    return old_r, old_s, old_t


def mod_inverse(r: int, q: int) -> Optional[int]:
    g, x, _ = extended_gcd(r % q, q)
    if g != 1:
        return None
    return x % q


def build_frame_and_target(message: str, k: int, T: int) -> Tuple[bytes, str, int]:
    m_bytes = message.encode("utf-8")
    frame = (
        b"MHK-DEMO-v1\x00"
        + len(m_bytes).to_bytes(8, byteorder="big", signed=False)
        + m_bytes
        + k.to_bytes(8, byteorder="big", signed=False)
    )
    digest_hex = hashlib.sha256(frame).hexdigest()
    y_k = int(digest_hex, 16) % (T + 1)
    return frame, digest_hex, y_k


def solve_superincreasing_greedy(W: Tuple[int, ...], target: int) -> Tuple[Tuple[int, ...], int]:
    n = len(W)
    x = [0] * n
    rem = target
    for i in range(n - 1, -1, -1):
        if W[i] <= rem:
            x[i] = 1
            rem -= W[i]
        else:
            x[i] = 0
    return tuple(x), rem


def generate_keypair(
    n: int, W: List[int], q: int, r: int, profile: str = SUPPORTED_PROFILE
) -> Tuple[ResultStatus, str, Optional[PublicKey], Optional[SecretKey], List[TraceStep]]:
    trace: List[TraceStep] = []
    if profile != SUPPORTED_PROFILE:
        return ResultStatus.UNSUPPORTED_PROFILE, "Profile không hỗ trợ", None, None, trace

    if n < 2 or len(W) != n:
        return ResultStatus.FORMAT_ERROR, "Độ dài dãy W không khớp với n", None, None, trace

    prefix_sum = 0
    for idx, w_i in enumerate(W):
        if w_i <= 0 or (idx > 0 and w_i <= prefix_sum):
            return (
                ResultStatus.FORMAT_ERROR,
                f"Vi phạm điều kiện siêu tăng tại W_{idx+1}={w_i} <= {prefix_sum}",
                None,
                None,
                trace,
            )
        prefix_sum += w_i

    if q <= prefix_sum:
        return ResultStatus.FORMAT_ERROR, f"Mô-đun q={q} phải lớn hơn tổng W={prefix_sum}", None, None, trace

    if not (1 < r < q) or math.gcd(r, q) != 1:
        return ResultStatus.FORMAT_ERROR, f"gcd(r={r}, q={q}) != 1 hoặc r ngoài (1, q)", None, None, trace

    u = mod_inverse(r, q)
    assert u is not None

    B = tuple((r * w_i) % q for w_i in W)
    T = sum(B)
    key_id = "mhk-" + hashlib.sha256(f"MHK-DEMO-v1:{','.join(map(str, B))}".encode()).hexdigest()[:8]

    pk = PublicKey(algorithm_id=profile, key_id=key_id, n=n, B=B, T=T)
    sk = SecretKey(algorithm_id=profile, key_id=key_id, n=n, W=tuple(W), q=q, r=r, u=u)
    return ResultStatus.VALID, "Tạo khóa thành công", pk, sk, trace


def sign_message(
    message: str, sk: SecretKey, pk: PublicKey, max_counter: int = MAX_COUNTER_LIMIT
) -> Tuple[ResultStatus, Optional[SignaturePacket], List[dict]]:
    if sk.algorithm_id != SUPPORTED_PROFILE or pk.algorithm_id != SUPPORTED_PROFILE:
        return ResultStatus.UNSUPPORTED_PROFILE, None, []

    trials = []
    for k in range(max_counter):
        _, digest_hex, y_k = build_frame_and_target(message, k, pk.T)
        t = (sk.u * y_k) % sk.q
        x, rem = solve_superincreasing_greedy(sk.W, t)
        v_public = sum(b_i * x_i for b_i, x_i in zip(pk.B, x))

        accepted = (rem == 0) and (v_public == y_k)
        trials.append({
            "k": k,
            "sha256": digest_hex,
            "y_k": y_k,
            "t": t,
            "x": x,
            "rem": rem,
            "v_public": v_public,
            "accepted": accepted,
        })

        if accepted:
            sig = SignaturePacket(
                algorithm_id=SUPPORTED_PROFILE,
                format_version="1.0",
                mode="demo-preimage",
                key_id=pk.key_id,
                k=k,
                x=x,
            )
            verify_status, _, _ = verify_signature(message, pk, sig)
            return verify_status, sig, trials

    return ResultStatus.NOT_FOUND, None, trials


def verify_signature(
    message: str, pk: PublicKey, sig: SignaturePacket
) -> Tuple[ResultStatus, Optional[int], Optional[int]]:
    if pk.algorithm_id != SUPPORTED_PROFILE or sig.algorithm_id != SUPPORTED_PROFILE:
        return ResultStatus.UNSUPPORTED_PROFILE, None, None

    if len(sig.x) != len(pk.B) or any(bit not in (0, 1) for bit in sig.x):
        return ResultStatus.FORMAT_ERROR, None, None

    if not (0 <= sig.k < MAX_COUNTER_LIMIT):
        return ResultStatus.FORMAT_ERROR, None, None

    T = sum(pk.B)
    _, _, y_k = build_frame_and_target(message, sig.k, T)
    v = sum(b_i * x_i for b_i, x_i in zip(pk.B, sig.x))

    if v == y_k:
        return ResultStatus.VALID, y_k, v
    return ResultStatus.INVALID, y_k, v
