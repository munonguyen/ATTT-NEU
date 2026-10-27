/**
 * DOMAIN LAYER: MHK Digital Signature Mathematical Core (mhk-demo-preimage-v1)
 * Pure, zero-dependency cryptographic and arithmetic engine following Specification v2.0.
 * Verifier strictly uses only (M, pk, sigma) and never accesses secret key parameters (W, q, r, u).
 */

export type ResultStatus =
  | 'VALID'
  | 'INVALID'
  | 'FORMAT_ERROR'
  | 'NOT_FOUND'
  | 'TIME_LIMIT'
  | 'CANCELLED'
  | 'UNSUPPORTED_PROFILE';

export const SUPPORTED_PROFILE = 'mhk-demo-preimage-v1';
export const MAX_COUNTER_LIMIT = 4096;

export interface TraceStep {
  stepNumber: number;
  stage: string;
  expression: string;
  inputSummary: string;
  outputSummary: string;
  decisionReason: string;
  status: 'ok' | 'skip' | 'error' | 'highlight';
}

export interface ParameterCheck {
  id: string;
  label: string;
  expression: string;
  passed: boolean;
  detail: string;
}

export interface BElementRow {
  index: number;
  w_i: number;
  product: number;
  q: number;
  b_i: number;
  formula: string;
}

export interface PublicKey {
  algorithm_id: string;
  key_id: string;
  n: number;
  B: number[];
  T: number;
}

export interface SecretKey {
  algorithm_id: string;
  key_id: string;
  n: number;
  W: number[];
  q: number;
  r: number;
  u: number;
}

export interface KeyPairResult {
  status: ResultStatus;
  message: string;
  pk?: PublicKey;
  sk?: SecretKey;
  checks: ParameterCheck[];
  bTable: BElementRow[];
  trace: TraceStep[];
  snapshotRevision: number;
}

export interface GreedyStepDetail {
  index: number; // 1-based
  w_i: number;
  remainingBefore: number;
  bit: 0 | 1;
  remainingAfter: number;
}

export interface SignTrialRow {
  k: number;
  sha256_hex: string;
  y_k: number;
  t: number;
  x: number[];
  greedyRemainder: number;
  greedySteps: GreedyStepDetail[];
  publicSumV: number;
  accepted: boolean;
  reason: string;
}

export interface SignaturePacket {
  algorithm_id: string;
  format_version: string;
  mode: string;
  key_id: string;
  k: number;
  x: number[];
  message_utf8_len?: number;
  y_k?: number;
  sha256_hex?: string;
}

export interface SignResult {
  status: ResultStatus;
  message: string;
  signature?: SignaturePacket;
  mBytesHex: string;
  mByteLength: number;
  trials: SignTrialRow[];
  selfVerifyStatus?: ResultStatus;
  trace: TraceStep[];
  snapshotRevision: number;
}

export interface BitContributionRow {
  index: number;
  b_i: number;
  x_i: number;
  contribution: number;
}

export interface VerifyResult {
  status: ResultStatus;
  message: string;
  y_k?: number;
  v?: number;
  T?: number;
  k?: number;
  x?: number[];
  sha256_hex?: string;
  frameHex?: string;
  mByteLength?: number;
  bitContributions?: BitContributionRow[];
  trace: TraceStep[];
  snapshotRevision: number;
}

// ============================================================================
// Pure FIPS 180-4 SHA-256 Implementation (Synchronous, deterministic in Browser & Node)
// ============================================================================

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function sha256BytesToHex(data: Uint8Array): string {
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const bitLen = BigInt(data.length) * 8n;
  const padLen = ((data.length + 9 + 63) & ~63);
  const padded = new Uint8Array(padLen);
  padded.set(data, 0);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setBigUint64(padLen - 8, bitLen, false);

  const w = new Uint32Array(64);

  for (let offset = 0; offset < padLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h[0], b = h[1], c = h[2], d = h[3];
    let e = h[4], f = h[5], g = h[6], hh = h[7];

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }

  return Array.from(h)
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

export function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// Number Theory Helpers (GCD, Extended Euclid, Modulo)
// ============================================================================

export function mod(a: number, m: number): number {
  return ((a % m) + m) % m;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function modInverse(r: number, q: number): number | null {
  let t = 0, newT = 1;
  let rem = q, newRem = mod(r, q);

  while (newRem !== 0) {
    const quotient = Math.floor(rem / newRem);
    [t, newT] = [newT, t - quotient * newT];
    [rem, newRem] = [newRem, rem - quotient * newRem];
  }

  if (rem > 1) return null;
  if (t < 0) t += q;
  return t;
}

export function computeKeyId(B: number[]): string {
  const raw = utf8ToBytes(`MHK-DEMO-v1:${B.join(',')}`);
  return `mhk-${sha256BytesToHex(raw).slice(0, 8)}`;
}

// ============================================================================
// Frame Builder & Hash Representative y_k
// ============================================================================

export interface FrameComputation {
  frameBytes: Uint8Array;
  frameHex: string;
  mBytes: Uint8Array;
  mBytesHex: string;
  sha256_hex: string;
  y_k: number;
  modulus: number;
}

export function computeFrameAndTarget(message: string, k: number, T: number): FrameComputation {
  const labelBytes = utf8ToBytes('MHK-DEMO-v1');
  const mBytes = utf8ToBytes(message);
  const frameLen = labelBytes.length + 1 + 8 + mBytes.length + 8;
  const frameBytes = new Uint8Array(frameLen);
  const view = new DataView(frameBytes.buffer);

  let offset = 0;
  frameBytes.set(labelBytes, offset);
  offset += labelBytes.length;

  frameBytes[offset] = 0x00;
  offset += 1;

  view.setBigUint64(offset, BigInt(mBytes.length), false); // 8-byte big-endian length
  offset += 8;

  frameBytes.set(mBytes, offset);
  offset += mBytes.length;

  view.setBigUint64(offset, BigInt(k), false); // 8-byte big-endian counter k

  const sha256_hex = sha256BytesToHex(frameBytes);
  const modulus = T + 1;
  const hashBigInt = BigInt('0x' + sha256_hex);
  const y_k = Number(hashBigInt % BigInt(modulus));

  return {
    frameBytes,
    frameHex: bytesToHex(frameBytes),
    mBytes,
    mBytesHex: bytesToHex(mBytes),
    sha256_hex,
    y_k,
    modulus,
  };
}

// ============================================================================
// 1. Parameter Validation & Key Generation
// ============================================================================

export interface RawKeyGenInput {
  profile: string;
  nInput: string | number;
  wInput: string | number[];
  qInput: string | number;
  rInput: string | number;
  revision?: number;
}

export function parseWSequence(wInput: string | number[]): { ok: boolean; values: number[]; error?: string } {
  if (Array.isArray(wInput)) {
    if (wInput.some((v) => !Number.isInteger(v))) {
      return { ok: false, values: [], error: 'Dãy W chứa phần tử không phải số nguyên.' };
    }
    return { ok: true, values: [...wInput] };
  }
  const trimmed = wInput.trim();
  if (!trimmed) {
    return { ok: false, values: [], error: 'Dãy W không được để trống.' };
  }
  const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
  const values: number[] = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) {
      return { ok: false, values: [], error: `Phần tử "${part}" trong dãy W không phải số nguyên hợp lệ.` };
    }
    values.push(Number(part));
  }
  return { ok: true, values };
}

export function generateKeys(input: RawKeyGenInput): KeyPairResult {
  const revision = input.revision ?? 1;
  const trace: TraceStep[] = [];
  const checks: ParameterCheck[] = [];
  let stepNo = 1;

  // Check profile
  if (input.profile !== SUPPORTED_PROFILE) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra Profile',
      expression: `profile == "${SUPPORTED_PROFILE}"`,
      inputSummary: `profile = "${input.profile}"`,
      outputSummary: 'UNSUPPORTED_PROFILE',
      decisionReason: `Hệ thống chỉ hỗ trợ hồ sơ thuật toán "${SUPPORTED_PROFILE}".`,
      status: 'error',
    });
    return {
      status: 'UNSUPPORTED_PROFILE',
      message: `Hồ sơ thuật toán "${input.profile}" không được hỗ trợ. Vui lòng chọn "${SUPPORTED_PROFILE}".`,
      checks,
      bTable: [],
      trace,
      snapshotRevision: revision,
    };
  }

  // Parse integers n, q, r
  const nStr = String(input.nInput).trim();
  const qStr = String(input.qInput).trim();
  const rStr = String(input.rInput).trim();

  if (!/^-?\d+$/.test(nStr) || !/^-?\d+$/.test(qStr) || !/^-?\d+$/.test(rStr)) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra cú pháp tham số',
      expression: 'n, q, r ∈ ℤ',
      inputSummary: `n="${nStr}", q="${qStr}", r="${rStr}"`,
      outputSummary: 'FORMAT_ERROR',
      decisionReason: 'Tham số n, q, r phải là các số nguyên hợp lệ.',
      status: 'error',
    });
    return {
      status: 'FORMAT_ERROR',
      message: 'Lỗi định dạng (FORMAT_ERROR): Các tham số n, q, r phải là số nguyên.',
      checks,
      bTable: [],
      trace,
      snapshotRevision: revision,
    };
  }

  const n = Number(nStr);
  const q = Number(qStr);
  const r = Number(rStr);
  const parsedW = parseWSequence(input.wInput);

  if (!parsedW.ok) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Phân tích dãy W',
      expression: 'W = (W₁, W₂, ..., Wₙ)',
      inputSummary: String(input.wInput),
      outputSummary: 'FORMAT_ERROR',
      decisionReason: parsedW.error || 'Dãy W sai định dạng.',
      status: 'error',
    });
    return {
      status: 'FORMAT_ERROR',
      message: `Lỗi định dạng (FORMAT_ERROR): ${parsedW.error}`,
      checks,
      bTable: [],
      trace,
      snapshotRevision: revision,
    };
  }

  const W = parsedW.values;

  // Check 1: n >= 2 and |W| == n
  const checkLenPassed = n >= 2 && W.length === n;
  checks.push({
    id: 'length_match',
    label: 'Số phần tử n và độ dài dãy W',
    expression: `n = ${n}, |W| = ${W.length}`,
    passed: checkLenPassed,
    detail: checkLenPassed
      ? `Hợp lệ: Dãy W có đúng ${n} phần tử.`
      : `Không hợp lệ: n = ${n} nhưng dãy W có ${W.length} phần tử (yêu cầu n ≥ 2 và |W| = n).`,
  });

  trace.push({
    stepNumber: stepNo++,
    stage: 'Kiểm tra kích thước',
    expression: '|W| == n ∧ n ≥ 2',
    inputSummary: `n = ${n}, W = (${W.join(', ')})`,
    outputSummary: checkLenPassed ? 'Đạt' : 'Lỗi kích thước',
    decisionReason: checkLenPassed
      ? `Dãy W gồm đúng ${n} phần tử.`
      : `Số lượng phần tử trong W (${W.length}) không khớp với n (${n}).`,
    status: checkLenPassed ? 'ok' : 'error',
  });

  // Check 2: Superincreasing W
  let prefixSum = 0;
  let superincreasingPassed = W.length > 0;
  const superDetails: string[] = [];

  for (let i = 0; i < W.length; i++) {
    const w_i = W[i];
    if (i === 0) {
      if (w_i <= 0) {
        superincreasingPassed = false;
        superDetails.push(`W₁ = ${w_i} ≤ 0 (vi phạm nguyên dương)`);
      } else {
        superDetails.push(`W₁ = ${w_i} > 0`);
      }
    } else {
      const cond = w_i > prefixSum;
      if (!cond) superincreasingPassed = false;
      superDetails.push(`W_${i + 1}=${w_i} ${cond ? '>' : '≤'} ${prefixSum}`);
    }
    prefixSum += w_i;
  }

  const sumW = W.reduce((acc, val) => acc + val, 0);

  checks.push({
    id: 'superincreasing',
    label: 'Điều kiện dãy siêu tăng W',
    expression: 'Wᵢ > Σ_{j<i} Wⱼ (∀i)',
    passed: superincreasingPassed,
    detail: superDetails.join('; '),
  });

  trace.push({
    stepNumber: stepNo++,
    stage: 'Kiểm tra dãy siêu tăng',
    expression: 'Wᵢ > Σ_{j=1}^{i-1} Wⱼ',
    inputSummary: `W = (${W.join(', ')})`,
    outputSummary: superincreasingPassed ? `Đạt (ΣW = ${sumW})` : 'Vi phạm dãy siêu tăng',
    decisionReason: superDetails.join('; '),
    status: superincreasingPassed ? 'ok' : 'error',
  });

  // Check 3: Modulus q > sum(W)
  const checkQPassed = superincreasingPassed && q > sumW;
  checks.push({
    id: 'modulus_q',
    label: 'Điều kiện mô-đun q > ΣWᵢ',
    expression: `q = ${q} > ΣWᵢ = ${sumW}`,
    passed: checkQPassed,
    detail: checkQPassed
      ? `Hợp lệ: q = ${q} lớn hơn tổng dãy bí mật ΣW = ${sumW}.`
      : `Không hợp lệ: q = ${q} phải lớn hơn ΣW = ${sumW}.`,
  });

  trace.push({
    stepNumber: stepNo++,
    stage: 'Kiểm tra mô-đun q',
    expression: 'q > Σ_{i=1}^n Wᵢ',
    inputSummary: `q = ${q}, ΣW = ${sumW}`,
    outputSummary: checkQPassed ? `${q} > ${sumW} (Đạt)` : `${q} ≤ ${sumW} (Lỗi)`,
    decisionReason: checkQPassed
      ? 'Mô-đun q đủ lớn để đảm bảo tính đơn ánh khi giải ba lô siêu tăng.'
      : 'Mô-đun q không lớn hơn tổng các phần tử trong W.',
    status: checkQPassed ? 'ok' : 'error',
  });

  // Check 4: Multiplier r in (1, q) and gcd(r, q) == 1
  const g = q > 0 ? gcd(r, q) : 0;
  const checkRRange = r > 1 && r < q;
  const checkCoprime = checkRRange && g === 1;

  checks.push({
    id: 'coprime_r',
    label: 'Điều kiện số nhân r và gcd(r, q) = 1',
    expression: `1 < r < q ∧ gcd(${r}, ${q}) = ${g}`,
    passed: checkCoprime,
    detail: checkCoprime
      ? `Hợp lệ: 1 < ${r} < ${q} và gcd(${r}, ${q}) = 1 (nguyên tố cùng nhau).`
      : `Không hợp lệ: yêu cầu 1 < r < q và gcd(r, q) = 1 (hiện tại r = ${r}, q = ${q}, gcd = ${g}).`,
  });

  trace.push({
    stepNumber: stepNo++,
    stage: 'Kiểm tra số nhân r',
    expression: '1 < r < q ∧ gcd(r, q) == 1',
    inputSummary: `r = ${r}, q = ${q}`,
    outputSummary: checkCoprime ? `gcd(${r}, ${q}) = 1 (Đạt)` : `gcd(${r}, ${q}) = ${g} (Lỗi)`,
    decisionReason: checkCoprime
      ? 'r và q nguyên tố cùng nhau nên tồn tại nghịch đảo u = r⁻¹ mod q.'
      : 'Không thể tìm nghịch đảo mô-đun nếu gcd(r, q) ≠ 1 hoặc r nằm ngoài khoảng (1, q).',
    status: checkCoprime ? 'ok' : 'error',
  });

  if (!checkLenPassed || !superincreasingPassed || !checkQPassed || !checkCoprime) {
    return {
      status: 'FORMAT_ERROR',
      message: 'Tham số đầu vào vi phạm điều kiện toán học của hệ MHK (FORMAT_ERROR). Xem chi tiết từng điều kiện bên dưới.',
      checks,
      bTable: [],
      trace,
      snapshotRevision: revision,
    };
  }

  // Compute modular inverse u = r^-1 mod q
  const u = modInverse(r, q)!;
  trace.push({
    stepNumber: stepNo++,
    stage: 'Tính nghịch đảo u',
    expression: 'u = r⁻¹ mod q',
    inputSummary: `r = ${r}, q = ${q}`,
    outputSummary: `u = ${u}`,
    decisionReason: `Kiểm tra: ${r} × ${u} = ${r * u} = ${Math.floor((r * u) / q)} × ${q} + 1 ≡ 1 (mod ${q}).`,
    status: 'highlight',
  });

  // Compute public key sequence B_i = (r * W_i) mod q
  const B: number[] = [];
  const bTable: BElementRow[] = [];

  for (let i = 0; i < n; i++) {
    const w_i = W[i];
    const prod = r * w_i;
    const b_i = mod(prod, q);
    B.push(b_i);
    bTable.push({
      index: i + 1,
      w_i,
      product: prod,
      q,
      b_i,
      formula: `(${r} × ${w_i}) mod ${q} = ${prod} mod ${q} = ${b_i}`,
    });

    trace.push({
      stepNumber: stepNo++,
      stage: `Tính khóa công khai B_${i + 1}`,
      expression: `B_${i + 1} = (r × W_${i + 1}) mod q`,
      inputSummary: `r = ${r}, W_${i + 1} = ${w_i}, q = ${q}`,
      outputSummary: `B_${i + 1} = ${b_i}`,
      decisionReason: `${r} × ${w_i} = ${prod} = ${Math.floor(prod / q)} × ${q} + ${b_i}.`,
      status: 'ok',
    });
  }

  const T = B.reduce((acc, val) => acc + val, 0);
  const key_id = computeKeyId(B);

  trace.push({
    stepNumber: stepNo++,
    stage: 'Tổng hợp khóa pk, sk và T',
    expression: 'T = Σ_{i=1}^n Bᵢ',
    inputSummary: `B = (${B.join(', ')})`,
    outputSummary: `T = ${T}, miền băm T+1 = ${T + 1}`,
    decisionReason: `Hoàn tất tạo khóa với key_id = "${key_id}".`,
    status: 'highlight',
  });

  const pk: PublicKey = {
    algorithm_id: SUPPORTED_PROFILE,
    key_id,
    n,
    B,
    T,
  };

  const sk: SecretKey = {
    algorithm_id: SUPPORTED_PROFILE,
    key_id,
    n,
    W,
    q,
    r,
    u,
  };

  return {
    status: 'VALID',
    message: `Tạo cặp khóa thành công: B = (${B.join(', ')}), T = ${T}, nghịch đảo u = ${u}.`,
    pk,
    sk,
    checks,
    bTable,
    trace,
    snapshotRevision: revision,
  };
}

// ============================================================================
// 2. Superincreasing Greedy Solver
// ============================================================================

export function solveSuperincreasingGreedy(
  W: number[],
  target: number
): { x: number[]; remainder: number; steps: GreedyStepDetail[] } {
  const n = W.length;
  const x = new Array<number>(n).fill(0);
  const steps: GreedyStepDetail[] = [];
  let rem = target;

  for (let i = n - 1; i >= 0; i--) {
    const before = rem;
    const w_i = W[i];
    if (w_i <= rem) {
      x[i] = 1;
      rem -= w_i;
      steps.push({
        index: i + 1,
        w_i,
        remainingBefore: before,
        bit: 1,
        remainingAfter: rem,
      });
    } else {
      x[i] = 0;
      steps.push({
        index: i + 1,
        w_i,
        remainingBefore: before,
        bit: 0,
        remainingAfter: rem,
      });
    }
  }

  return { x, remainder: rem, steps };
}

// ============================================================================
// 3. Signing Algorithm (with Counter Loop k = 0 .. 4095)
// ============================================================================

export interface SignOptions {
  maxCounter?: number;
  startCounter?: number;
  simulateCancelAt?: number;
  simulateTimeoutAt?: number;
  revision?: number;
}

export function signMessage(
  message: string,
  sk: SecretKey,
  pk: PublicKey,
  options: SignOptions = {}
): SignResult {
  const revision = options.revision ?? 1;
  const trace: TraceStep[] = [];
  const trials: SignTrialRow[] = [];
  let stepNo = 1;

  if (sk.algorithm_id !== SUPPORTED_PROFILE || pk.algorithm_id !== SUPPORTED_PROFILE) {
    return {
      status: 'UNSUPPORTED_PROFILE',
      message: `Hồ sơ thuật toán không được hỗ trợ (${sk.algorithm_id}).`,
      mBytesHex: '',
      mByteLength: 0,
      trials: [],
      trace: [
        {
          stepNumber: 1,
          stage: 'Kiểm tra Profile',
          expression: `algorithm_id == "${SUPPORTED_PROFILE}"`,
          inputSummary: sk.algorithm_id,
          outputSummary: 'UNSUPPORTED_PROFILE',
          decisionReason: 'Hồ sơ thuật toán của khóa không tương thích.',
          status: 'error',
        },
      ],
      snapshotRevision: revision,
    };
  }

  const mBytes = utf8ToBytes(message);
  const mBytesHex = bytesToHex(mBytes);
  const maxCounter = Math.min(options.maxCounter ?? MAX_COUNTER_LIMIT, MAX_COUNTER_LIMIT);
  const startCounter = Math.max(options.startCounter ?? 0, 0);

  trace.push({
    stepNumber: stepNo++,
    stage: 'Chuẩn bị dữ liệu ký',
    expression: 'M_bytes = UTF8(M)',
    inputSummary: `M = "${message}"`,
    outputSummary: `${mBytes.length} bytes (${mBytesHex.slice(0, 30)}${mBytesHex.length > 30 ? '...' : ''})`,
    decisionReason: `Biểu diễn UTF-8 chính xác ${mBytes.length} bytes; miền đại diện T+1 = ${pk.T + 1}.`,
    status: 'ok',
  });

  for (let k = startCounter; k < maxCounter; k++) {
    if (options.simulateCancelAt !== undefined && k >= options.simulateCancelAt) {
      trace.push({
        stepNumber: stepNo++,
        stage: `Dừng tại k = ${k}`,
        expression: 'User Cancel Signal',
        inputSummary: `k = ${k}`,
        outputSummary: 'CANCELLED',
        decisionReason: 'Người dùng đã bấm nút Hủy tác vụ ký.',
        status: 'error',
      });
      return {
        status: 'CANCELLED',
        message: `Tác vụ ký đã bị hủy tại lượt thử k = ${k} (CANCELLED). Chưa có chữ ký hoàn tất để xuất.`,
        mBytesHex,
        mByteLength: mBytes.length,
        trials,
        trace,
        snapshotRevision: revision,
      };
    }

    if (options.simulateTimeoutAt !== undefined && k >= options.simulateTimeoutAt) {
      trace.push({
        stepNumber: stepNo++,
        stage: `Hết thời gian tại k = ${k}`,
        expression: 'Timeout Limit Exceeded',
        inputSummary: `k = ${k}`,
        outputSummary: 'TIME_LIMIT',
        decisionReason: 'Vượt quá thời gian cho phép của tác vụ ký.',
        status: 'error',
      });
      return {
        status: 'TIME_LIMIT',
        message: `Tác vụ ký vượt quá giới hạn thời gian tại lượt thử k = ${k} (TIME_LIMIT).`,
        mBytesHex,
        mByteLength: mBytes.length,
        trials,
        trace,
        snapshotRevision: revision,
      };
    }

    const frameInfo = computeFrameAndTarget(message, k, pk.T);
    const y_k = frameInfo.y_k;
    const t = mod(sk.u * y_k, sk.q);
    const greedy = solveSuperincreasingGreedy(sk.W, t);
    const publicSumV = pk.B.reduce((acc, b_i, idx) => acc + b_i * greedy.x[idx], 0);

    const greedySummary = greedy.steps
      .map((s) => (s.bit === 1 ? `chọn W_${s.index}=${s.w_i} (còn ${s.remainingAfter})` : `bỏ W_${s.index}=${s.w_i}`))
      .join(', ');

    if (greedy.remainder !== 0) {
      const reason = `Giải tham lam trên W còn dư ${greedy.remainder} ≠ 0; loại k = ${k}.`;
      trials.push({
        k,
        sha256_hex: frameInfo.sha256_hex,
        y_k,
        t,
        x: greedy.x,
        greedyRemainder: greedy.remainder,
        greedySteps: greedy.steps,
        publicSumV,
        accepted: false,
        reason,
      });

      if (trials.length <= 20) {
        trace.push({
          stepNumber: stepNo++,
          stage: `Thử bộ đếm k = ${k}`,
          expression: `y_${k} = ${y_k} → t = (${sk.u}×${y_k}) mod ${sk.q} = ${t}`,
          inputSummary: `SHA256=${frameInfo.sha256_hex.slice(0, 12)}...`,
          outputSummary: `x=(${greedy.x.join(',')}), dư=${greedy.remainder}`,
          decisionReason: `${greedySummary} → ${reason}`,
          status: 'skip',
        });
      }
      continue;
    }

    if (publicSumV !== y_k) {
      const reason = `Dư bằng 0 với x=(${greedy.x.join(',')}) nhưng tổng công khai ΣBᵢxᵢ = ${publicSumV} ≠ y_${k} (${y_k}); loại k = ${k}.`;
      trials.push({
        k,
        sha256_hex: frameInfo.sha256_hex,
        y_k,
        t,
        x: greedy.x,
        greedyRemainder: 0,
        greedySteps: greedy.steps,
        publicSumV,
        accepted: false,
        reason,
      });

      if (trials.length <= 20) {
        trace.push({
          stepNumber: stepNo++,
          stage: `Thử bộ đếm k = ${k}`,
          expression: `y_${k} = ${y_k} → t = (${sk.u}×${y_k}) mod ${sk.q} = ${t}`,
          inputSummary: `x=(${greedy.x.join(',')}), dư=0`,
          outputSummary: `ΣBᵢxᵢ = ${publicSumV} ≠ ${y_k}`,
          decisionReason: reason,
          status: 'skip',
        });
      }
      continue;
    }

    // Accepted!
    const reason = `Tìm được nghiệm x=(${greedy.x.join(',')}); dư = 0 và tổng công khai ΣBᵢxᵢ = ${publicSumV} = y_${k}; nhận k = ${k}.`;
    trials.push({
      k,
      sha256_hex: frameInfo.sha256_hex,
      y_k,
      t,
      x: greedy.x,
      greedyRemainder: 0,
      greedySteps: greedy.steps,
      publicSumV,
      accepted: true,
      reason,
    });

    trace.push({
      stepNumber: stepNo++,
      stage: `Thử bộ đếm k = ${k} (Thành công)`,
      expression: `y_${k} = ${y_k} → t = (${sk.u}×${y_k}) mod ${sk.q} = ${t}`,
      inputSummary: `SHA256=${frameInfo.sha256_hex.slice(0, 16)}...`,
      outputSummary: `x = (${greedy.x.join(', ')})`,
      decisionReason: `${greedySummary} → dư = 0.`,
      status: 'highlight',
    });

    const selectedPublicTerms = pk.B.map((b_i, idx) => (greedy.x[idx] === 1 ? `${b_i}` : null))
      .filter(Boolean)
      .join(' + ');

    trace.push({
      stepNumber: stepNo++,
      stage: 'Đối chiếu trên khóa công khai B',
      expression: 'v = Σ_{i=1}^n Bᵢxᵢ == y_k',
      inputSummary: `B=(${pk.B.join(',')}), x=(${greedy.x.join(',')})`,
      outputSummary: `v = ${selectedPublicTerms || '0'} = ${publicSumV} == y_${k}`,
      decisionReason: `Khớp mục tiêu công khai y_${k} = ${y_k}. Tạo chữ ký σ = (k=${k}, x=(${greedy.x.join(',')})).`,
      status: 'ok',
    });

    const signature: SignaturePacket = {
      algorithm_id: SUPPORTED_PROFILE,
      format_version: '1.0',
      mode: 'demo-preimage',
      key_id: pk.key_id,
      k,
      x: greedy.x,
      message_utf8_len: mBytes.length,
      y_k,
      sha256_hex: frameInfo.sha256_hex,
    };

    // Mandatory self-verification before returning
    const selfCheck = verifySignature(message, pk, signature, revision);
    trace.push({
      stepNumber: stepNo++,
      stage: 'Tự xác minh (Self-Verify)',
      expression: 'Verify(M, pk, σ)',
      inputSummary: `k=${k}, x=(${greedy.x.join(',')})`,
      outputSummary: selfCheck.status,
      decisionReason: 'Kiểm tra độc lập bằng hàm xác minh công khai trước khi trả kết quả.',
      status: selfCheck.status === 'VALID' ? 'highlight' : 'error',
    });

    return {
      status: selfCheck.status,
      message: `Ký văn bản thành công tại bộ đếm k = ${k}: vector chữ ký x = (${greedy.x.join(', ')}), mục tiêu y_${k} = ${y_k}.`,
      signature,
      mBytesHex,
      mByteLength: mBytes.length,
      trials,
      selfVerifyStatus: selfCheck.status,
      trace,
      snapshotRevision: revision,
    };
  }

  trace.push({
    stepNumber: stepNo++,
    stage: 'Kết thúc vòng lặp bộ đếm k',
    expression: `k ∈ [0, ${maxCounter - 1}]`,
    inputSummary: `Đã thử ${trials.length} lượt`,
    outputSummary: 'NOT_FOUND',
    decisionReason: `Không tìm được nghiệm hợp lệ sau ${trials.length} lượt thử.`,
    status: 'error',
  });

  return {
    status: 'NOT_FOUND',
    message: `Hết ${trials.length} lượt thử (k = 0..${maxCounter - 1}) mà chưa tìm được nghiệm (NOT_FOUND). Không coi là văn bản giả mạo.`,
    mBytesHex,
    mByteLength: mBytes.length,
    trials,
    trace,
    snapshotRevision: revision,
  };
}

// ============================================================================
// 4. Verification Algorithm (Strictly Public: uses ONLY M, pk, sigma)
// ============================================================================

export interface RawVerifyInput {
  message: string;
  bInput: string | number[];
  kInput: string | number;
  xInput: string | number[];
  profile?: string;
  expectedKeyId?: string;
  signatureKeyId?: string;
  revision?: number;
}

export function parseXVector(xInput: string | number[]): {
  ok: boolean;
  bits: number[];
  error?: string;
} {
  if (Array.isArray(xInput)) {
    for (let i = 0; i < xInput.length; i++) {
      const v = xInput[i];
      if (v !== 0 && v !== 1) {
        return {
          ok: false,
          bits: [],
          error: `Phần tử x_${i + 1} = ${v} không hợp lệ (vector chữ ký x chỉ được chứa bit 0 hoặc 1).`,
        };
      }
    }
    return { ok: true, bits: [...xInput] };
  }

  const cleaned = xInput.trim().replace(/^[([{\s]+|[)\]}\s]+$/g, '');
  if (!cleaned) {
    return { ok: false, bits: [], error: 'Vector chữ ký x không được để trống.' };
  }

  const parts = cleaned.split(/[\s,;]+/).filter(Boolean);
  const bits: number[] = [];

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p !== '0' && p !== '1') {
      return {
        ok: false,
        bits: [],
        error: `Giá trị "${p}" tại vị trí ${i + 1} không phải bit 0/1 (FORMAT_ERROR).`,
      };
    }
    bits.push(Number(p));
  }
  return { ok: true, bits };
}

export function verifyFromRawInputs(input: RawVerifyInput): VerifyResult {
  const revision = input.revision ?? 1;
  const trace: TraceStep[] = [];
  let stepNo = 1;
  const profile = input.profile ?? SUPPORTED_PROFILE;

  if (profile !== SUPPORTED_PROFILE) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra Profile',
      expression: `profile == "${SUPPORTED_PROFILE}"`,
      inputSummary: `profile = "${profile}"`,
      outputSummary: 'UNSUPPORTED_PROFILE',
      decisionReason: `Không hỗ trợ hồ sơ thuật toán "${profile}".`,
      status: 'error',
    });
    return {
      status: 'UNSUPPORTED_PROFILE',
      message: `Hồ sơ thuật toán "${profile}" không được hỗ trợ (UNSUPPORTED_PROFILE).`,
      trace,
      snapshotRevision: revision,
    };
  }

  // Parse B
  const parsedB = parseWSequence(input.bInput);
  if (!parsedB.ok || parsedB.values.length < 2 || parsedB.values.some((b) => b <= 0)) {
    const errMsg = parsedB.error || 'Khóa công khai B phải gồm tối thiểu 2 số nguyên dương.';
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra định dạng khóa công khai B',
      expression: 'B ∈ ℤ⁺ⁿ (n ≥ 2)',
      inputSummary: String(input.bInput),
      outputSummary: 'FORMAT_ERROR',
      decisionReason: errMsg,
      status: 'error',
    });
    return {
      status: 'FORMAT_ERROR',
      message: `Lỗi định dạng khóa công khai B (FORMAT_ERROR): ${errMsg}`,
      trace,
      snapshotRevision: revision,
    };
  }
  const B = parsedB.values;
  const n = B.length;

  // Check key_id mismatch if both are provided
  if (
    input.expectedKeyId &&
    input.signatureKeyId &&
    input.expectedKeyId.trim() !== '' &&
    input.signatureKeyId.trim() !== '' &&
    input.expectedKeyId.trim() !== input.signatureKeyId.trim()
  ) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra định danh bộ khóa (key_id)',
      expression: 'pk.key_id == σ.key_id',
      inputSummary: `pk="${input.expectedKeyId}", σ="${input.signatureKeyId}"`,
      outputSummary: 'FORMAT_ERROR',
      decisionReason: 'Định danh bộ khóa (key_id) của chữ ký không khớp với khóa công khai hiện tại.',
      status: 'error',
    });
    return {
      status: 'FORMAT_ERROR',
      message: `Lỗi định dạng (FORMAT_ERROR): key_id của chữ ký (${input.signatureKeyId}) không khớp với khóa công khai (${input.expectedKeyId}).`,
      trace,
      snapshotRevision: revision,
    };
  }

  // Parse k
  const kStr = String(input.kInput).trim();
  if (!/^-?\d+$/.test(kStr)) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra bộ đếm k',
      expression: `0 ≤ k < ${MAX_COUNTER_LIMIT}`,
      inputSummary: `k = "${kStr}"`,
      outputSummary: 'FORMAT_ERROR',
      decisionReason: 'Bộ đếm k không phải là số nguyên hợp lệ.',
      status: 'error',
    });
    return {
      status: 'FORMAT_ERROR',
      message: `Lỗi định dạng (FORMAT_ERROR): Bộ đếm k ("${kStr}") phải là số nguyên trong khoảng [0, ${MAX_COUNTER_LIMIT - 1}].`,
      trace,
      snapshotRevision: revision,
    };
  }
  const k = Number(kStr);
  if (k < 0 || k >= MAX_COUNTER_LIMIT) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra miền giá trị bộ đếm k',
      expression: `0 ≤ k < ${MAX_COUNTER_LIMIT}`,
      inputSummary: `k = ${k}`,
      outputSummary: 'FORMAT_ERROR',
      decisionReason: `Bộ đếm k = ${k} nằm ngoài giới hạn cho phép [0, ${MAX_COUNTER_LIMIT - 1}].`,
      status: 'error',
    });
    return {
      status: 'FORMAT_ERROR',
      message: `Lỗi định dạng (FORMAT_ERROR): Bộ đếm k = ${k} vượt ngoài miền cho phép [0, ${MAX_COUNTER_LIMIT - 1}].`,
      trace,
      snapshotRevision: revision,
    };
  }

  // Parse x
  const parsedX = parseXVector(input.xInput);
  if (!parsedX.ok) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra định dạng vector chữ ký x',
      expression: 'x ∈ {0, 1}ⁿ',
      inputSummary: String(input.xInput),
      outputSummary: 'FORMAT_ERROR',
      decisionReason: parsedX.error || 'Vector x chứa giá trị ngoài {0, 1}.',
      status: 'error',
    });
    return {
      status: 'FORMAT_ERROR',
      message: `Lỗi định dạng vector chữ ký (FORMAT_ERROR): ${parsedX.error}`,
      trace,
      snapshotRevision: revision,
    };
  }

  const x = parsedX.bits;
  if (x.length !== n) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra độ dài vector chữ ký x',
      expression: `|x| == |B| == ${n}`,
      inputSummary: `|x| = ${x.length}, |B| = ${n}`,
      outputSummary: 'FORMAT_ERROR',
      decisionReason: `Vector x có ${x.length} bit nhưng khóa công khai B có ${n} phần tử.`,
      status: 'error',
    });
    return {
      status: 'FORMAT_ERROR',
      message: `Lỗi định dạng (FORMAT_ERROR): Độ dài vector x (${x.length}) không khớp với số phần tử khóa công khai B (${n}).`,
      trace,
      snapshotRevision: revision,
    };
  }

  const pk: PublicKey = {
    algorithm_id: profile,
    key_id: input.expectedKeyId || computeKeyId(B),
    n,
    B,
    T: B.reduce((acc, v) => acc + v, 0),
  };

  const sig: SignaturePacket = {
    algorithm_id: profile,
    format_version: '1.0',
    mode: 'demo-preimage',
    key_id: input.signatureKeyId || pk.key_id,
    k,
    x,
  };

  return verifySignature(input.message, pk, sig, revision);
}

export function verifySignature(
  message: string,
  pk: PublicKey,
  sig: SignaturePacket,
  revision: number = 1
): VerifyResult {
  const trace: TraceStep[] = [];
  let stepNo = 1;

  if (pk.algorithm_id !== SUPPORTED_PROFILE || sig.algorithm_id !== SUPPORTED_PROFILE) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra Profile',
      expression: `algorithm_id == "${SUPPORTED_PROFILE}"`,
      inputSummary: `pk="${pk.algorithm_id}", σ="${sig.algorithm_id}"`,
      outputSummary: 'UNSUPPORTED_PROFILE',
      decisionReason: 'Hồ sơ thuật toán không được hỗ trợ.',
      status: 'error',
    });
    return {
      status: 'UNSUPPORTED_PROFILE',
      message: 'Không hỗ trợ hồ sơ thuật toán này (UNSUPPORTED_PROFILE).',
      trace,
      snapshotRevision: revision,
    };
  }

  if (
    !Array.isArray(pk.B) ||
    pk.B.length < 2 ||
    !Array.isArray(sig.x) ||
    sig.x.length !== pk.B.length ||
    sig.x.some((bit) => bit !== 0 && bit !== 1) ||
    !Number.isInteger(sig.k) ||
    sig.k < 0 ||
    sig.k >= MAX_COUNTER_LIMIT
  ) {
    trace.push({
      stepNumber: stepNo++,
      stage: 'Kiểm tra cấu trúc dữ liệu (Format Validation)',
      expression: 'x ∈ {0,1}ⁿ ∧ 0 ≤ k < 4096 ∧ |x| == |B|',
      inputSummary: `k=${sig.k}, x=(${Array.isArray(sig.x) ? sig.x.join(',') : ''})`,
      outputSummary: 'FORMAT_ERROR',
      decisionReason: 'Chữ ký hoặc khóa công khai sai cấu trúc hoặc vượt miền.',
      status: 'error',
    });
    return {
      status: 'FORMAT_ERROR',
      message: 'Dữ liệu chữ ký hoặc khóa công khai không đúng cấu trúc hoặc miền (FORMAT_ERROR).',
      trace,
      snapshotRevision: revision,
    };
  }

  const T = pk.B.reduce((acc, b) => acc + b, 0);

  trace.push({
    stepNumber: stepNo++,
    stage: 'Kiểm tra định dạng đầu vào',
    expression: `|x| = ${sig.x.length} bit ∈ {0,1}, k = ${sig.k} ∈ [0, 4095], T = ΣBᵢ = ${T}`,
    inputSummary: `B=(${pk.B.join(',')}), k=${sig.k}, x=(${sig.x.join(',')})`,
    outputSummary: 'Hợp lệ cấu trúc',
    decisionReason: 'Đầy đủ dữ liệu công khai; không truy cập khóa bí mật (W, q, r, u).',
    status: 'ok',
  });

  // Compute y_k from M and k
  const frameInfo = computeFrameAndTarget(message, sig.k, T);
  const y_k = frameInfo.y_k;

  trace.push({
    stepNumber: stepNo++,
    stage: 'Tính đại diện văn bản y_k',
    expression: `y_${sig.k} = SHA256(frame(M, k=${sig.k})) mod (T + 1)`,
    inputSummary: `M="${message}" (${frameInfo.mBytes.length} bytes), k=${sig.k}, T+1=${T + 1}`,
    outputSummary: `y_${sig.k} = ${y_k}`,
    decisionReason: `SHA-256 = ${frameInfo.sha256_hex.slice(0, 24)}... mod ${T + 1} = ${y_k}.`,
    status: 'ok',
  });

  // Compute public subset sum v = sum(B_i * x_i)
  const bitContributions: BitContributionRow[] = pk.B.map((b_i, idx) => ({
    index: idx + 1,
    b_i,
    x_i: sig.x[idx],
    contribution: b_i * sig.x[idx],
  }));

  const v = bitContributions.reduce((acc, row) => acc + row.contribution, 0);
  const selectedTerms = bitContributions
    .filter((r) => r.x_i === 1)
    .map((r) => `${r.b_i}`)
    .join(' + ');

  trace.push({
    stepNumber: stepNo++,
    stage: 'Tính tổng chữ ký công khai v',
    expression: 'v = Σ_{i=1}^n Bᵢ × xᵢ',
    inputSummary: `B=(${pk.B.join(',')}), x=(${sig.x.join(',')})`,
    outputSummary: `v = ${selectedTerms || '0'} = ${v}`,
    decisionReason: `Cộng các phần tử Bᵢ tại vị trí bit xᵢ = 1.`,
    status: 'ok',
  });

  const isMatch = v === y_k;
  const finalStatus: ResultStatus = isMatch ? 'VALID' : 'INVALID';

  trace.push({
    stepNumber: stepNo++,
    stage: 'So sánh v với y_k',
    expression: `v == y_${sig.k} (${v} ${isMatch ? '==' : '≠'} ${y_k})`,
    inputSummary: `v = ${v}, y_${sig.k} = ${y_k}`,
    outputSummary: finalStatus,
    decisionReason: isMatch
      ? `Khớp quan hệ toán học của profile demo (${v} = ${y_k} → VALID).`
      : `Không khớp quan hệ toán học (${v} ≠ ${y_k} → INVALID). Văn bản hoặc chữ ký đã bị thay đổi.`,
    status: isMatch ? 'highlight' : 'error',
  });

  return {
    status: finalStatus,
    message: isMatch
      ? `Xác thực thành công (VALID): Tổng công khai v = ${v} khớp với đại diện văn bản y_${sig.k} = ${y_k} theo hồ sơ ${SUPPORTED_PROFILE}.`
      : `Xác thực thất bại (INVALID): Tổng công khai v = ${v} khác với đại diện văn bản y_${sig.k} = ${y_k}.`,
    y_k,
    v,
    T,
    k: sig.k,
    x: sig.x,
    sha256_hex: frameInfo.sha256_hex,
    frameHex: frameInfo.frameHex,
    mByteLength: frameInfo.mBytes.length,
    bitContributions,
    trace,
    snapshotRevision: revision,
  };
}
