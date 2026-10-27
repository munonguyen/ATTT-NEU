import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from domain.mhk_engine import (
    generate_keypair,
    sign_message,
    verify_signature,
    SignaturePacket,
    ResultStatus,
    SUPPORTED_PROFILE,
)


class TestMHKEngine(unittest.TestCase):
    def test_tc1_standard_flow_toi_dong_y(self):
        status, _, pk, sk, _ = generate_keypair(5, [2, 3, 7, 14, 30], 61, 17)
        self.assertEqual(status, ResultStatus.VALID)
        self.assertEqual(pk.B, (34, 51, 58, 55, 22))
        self.assertEqual(pk.T, 220)
        self.assertEqual(sk.u, 18)

        sign_status, sig, trials = sign_message("Tôi đồng ý", sk, pk)
        self.assertEqual(sign_status, ResultStatus.VALID)
        self.assertEqual(len(trials), 3)
        self.assertEqual((trials[0]["y_k"], trials[0]["t"], trials[0]["v_public"]), (104, 42, 165))
        self.assertEqual((trials[1]["y_k"], trials[1]["t"], trials[1]["rem"]), (163, 6, 1))
        self.assertEqual(sig.k, 2)
        self.assertEqual(sig.x, (1, 0, 0, 0, 1))

        v_status, y_k, v = verify_signature("Tôi đồng ý", pk, sig)
        self.assertEqual(v_status, ResultStatus.VALID)
        self.assertEqual(y_k, 56)
        self.assertEqual(v, 56)

    def test_tc2_invalid_parameters(self):
        st1, _, _, _, _ = generate_keypair(5, [2, 3, 7, 12, 30], 61, 17)
        self.assertEqual(st1, ResultStatus.FORMAT_ERROR)
        st2, _, _, _, _ = generate_keypair(5, [2, 3, 7, 14, 30], 60, 15)
        self.assertEqual(st2, ResultStatus.FORMAT_ERROR)

    def test_tc3_tampered_message(self):
        _, _, pk, _, _ = generate_keypair(5, [2, 3, 7, 14, 30], 61, 17)
        sig = SignaturePacket(SUPPORTED_PROFILE, "1.0", "demo-preimage", pk.key_id, 2, (1, 0, 0, 0, 1))
        v_status, y_k, v = verify_signature("Tôi không đồng ý", pk, sig)
        self.assertEqual(v_status, ResultStatus.INVALID)
        self.assertEqual((y_k, v), (65, 56))

    def test_tc4_tampered_signature_vector(self):
        _, _, pk, _, _ = generate_keypair(5, [2, 3, 7, 14, 30], 61, 17)
        sig_flipped = SignaturePacket(SUPPORTED_PROFILE, "1.0", "demo-preimage", pk.key_id, 2, (0, 0, 0, 0, 1))
        v_status, y_k, v = verify_signature("Tôi đồng ý", pk, sig_flipped)
        self.assertEqual(v_status, ResultStatus.INVALID)
        self.assertEqual((y_k, v), (56, 22))

        sig_malformed = SignaturePacket(SUPPORTED_PROFILE, "1.0", "demo-preimage", pk.key_id, 2, (2, 0, 0, 0, 1))
        v_status_fmt, _, _ = verify_signature("Tôi đồng ý", pk, sig_malformed)
        self.assertEqual(v_status_fmt, ResultStatus.FORMAT_ERROR)

    def test_forgery_counterexample_small_hash_domain(self):
        _, _, pk, _, _ = generate_keypair(5, [2, 3, 7, 14, 30], 61, 17)
        forged_sig = SignaturePacket(SUPPORTED_PROFILE, "1.0", "demo-preimage", pk.key_id, 123, (1, 0, 1, 0, 1))
        v_status, y_k, v = verify_signature("Thông điệp giả mạo MHK", pk, forged_sig)
        self.assertEqual(v_status, ResultStatus.VALID)
        self.assertEqual((y_k, v), (114, 114))


if __name__ == "__main__":
    unittest.main()
