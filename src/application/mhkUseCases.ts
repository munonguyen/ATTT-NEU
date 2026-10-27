/**
 * APPLICATION LAYER: Use Case Coordinator, Snapshot/Revision State Management,
 * Built-in Academic Presets & Automated Test Case Runner (TC1 - TC4 + Forgery Analysis).
 */

import {
  generateKeys,
  signMessage,
  verifyFromRawInputs,
  KeyPairResult,
  SignResult,
  VerifyResult,
  SUPPORTED_PROFILE,
  ResultStatus,
} from '../domain/mhkCrypto';

export interface AcademicPreset {
  id: string;
  code: string;
  title: string;
  category: 'standard' | 'error_param' | 'tamper_msg' | 'tamper_sig' | 'forgery_limit';
  description: string;
  targetScreen: 'keys' | 'sign' | 'verify';
  params: {
    profile: string;
    n: string;
    W: string;
    q: string;
    r: string;
  };
  signMessageText: string;
  verifyInputs: {
    message: string;
    B: string;
    k: string;
    x: string;
  };
  expectedOutcome: {
    status: ResultStatus;
    summary: string;
  };
}

export const ACADEMIC_PRESETS: AcademicPreset[] = [
  {
    id: 'tc1-standard',
    code: 'Kịch bản 1 (TC1)',
    title: 'Bộ tham số chuẩn & Ký văn bản "Tôi đồng ý"',
    category: 'standard',
    description:
      'Minh họa xuyên suốt tài liệu: n=5, W=(2,3,7,14,30), q=61, r=17 → B=(34,51,58,55,22), u=18, T=220. Ký M="Tôi đồng ý" (15 bytes) thử qua k=0 (bỏ vì ΣBᵢxᵢ=165≠104), k=1 (bỏ vì dư 1), nhận k=2 với x=(1,0,0,0,1) và y₂=v=56.',
    targetScreen: 'keys',
    params: {
      profile: SUPPORTED_PROFILE,
      n: '5',
      W: '2, 3, 7, 14, 30',
      q: '61',
      r: '17',
    },
    signMessageText: 'Tôi đồng ý',
    verifyInputs: {
      message: 'Tôi đồng ý',
      B: '34, 51, 58, 55, 22',
      k: '2',
      x: '1, 0, 0, 0, 1',
    },
    expectedOutcome: {
      status: 'VALID',
      summary: 'Tạo khóa hợp lệ, ký thành công ở k=2 với x=(1,0,0,0,1), xác thực v = y₂ = 56 → VALID.',
    },
  },
  {
    id: 'tc2-bad-superincreasing',
    code: 'Kịch bản 2a (TC2-W)',
    title: 'Nhập sai điều kiện dãy siêu tăng W = (2, 3, 7, 12, 30)',
    category: 'error_param',
    description:
      'Kiểm tra bắt lỗi tham số đầu vào khi phần tử W₄ = 12 không lớn hơn tổng các phần tử đứng trước (2 + 3 + 7 = 12). Hệ thống từ chối tạo khóa và trả về FORMAT_ERROR.',
    targetScreen: 'keys',
    params: {
      profile: SUPPORTED_PROFILE,
      n: '5',
      W: '2, 3, 7, 12, 30',
      q: '61',
      r: '17',
    },
    signMessageText: 'Tôi đồng ý',
    verifyInputs: {
      message: 'Tôi đồng ý',
      B: '34, 51, 58, 55, 22',
      k: '2',
      x: '1, 0, 0, 0, 1',
    },
    expectedOutcome: {
      status: 'FORMAT_ERROR',
      summary: 'Phát hiện W₄ = 12 ≤ 2+3+7 = 12 (vi phạm tính chất siêu tăng) → Trạng thái FORMAT_ERROR.',
    },
  },
  {
    id: 'tc2-bad-coprime',
    code: 'Kịch bản 2b (TC2-GCD)',
    title: 'Nhập sai điều kiện nguyên tố cùng nhau (q = 60, r = 15)',
    category: 'error_param',
    description:
      'Kiểm tra bắt lỗi khi số nhân r = 15 và mô-đun q = 60 có ước chung lớn nhất gcd(15, 60) = 15 ≠ 1 nên không tồn tại nghịch đảo u = r⁻¹ mod q.',
    targetScreen: 'keys',
    params: {
      profile: SUPPORTED_PROFILE,
      n: '5',
      W: '2, 3, 7, 14, 30',
      q: '60',
      r: '15',
    },
    signMessageText: 'Tôi đồng ý',
    verifyInputs: {
      message: 'Tôi đồng ý',
      B: '34, 51, 58, 55, 22',
      k: '2',
      x: '1, 0, 0, 0, 1',
    },
    expectedOutcome: {
      status: 'FORMAT_ERROR',
      summary: 'Phát hiện gcd(15, 60) = 15 ≠ 1 (không tồn tại nghịch đảo modulo) → Trạng thái FORMAT_ERROR.',
    },
  },
  {
    id: 'tc3-tampered-message',
    code: 'Kịch bản 3 (TC3)',
    title: 'Sửa văn bản sau khi ký ("Tôi không đồng ý")',
    category: 'tamper_msg',
    description:
      'Giữ nguyên chữ ký hợp lệ σ = (k=2, x=(1,0,0,0,1)) của "Tôi đồng ý" nhưng sửa nội dung văn bản thành "Tôi không đồng ý" (22 bytes). Khi đó đại diện băm y₂ = 65 ≠ v = 56 → Từ chối chữ ký (INVALID).',
    targetScreen: 'verify',
    params: {
      profile: SUPPORTED_PROFILE,
      n: '5',
      W: '2, 3, 7, 14, 30',
      q: '61',
      r: '17',
    },
    signMessageText: 'Tôi đồng ý',
    verifyInputs: {
      message: 'Tôi không đồng ý',
      B: '34, 51, 58, 55, 22',
      k: '2',
      x: '1, 0, 0, 0, 1',
    },
    expectedOutcome: {
      status: 'INVALID',
      summary: 'Đại diện văn bản mới y₂ = 65 trong khi tổng công khai v = 56 (56 ≠ 65) → Trạng thái INVALID.',
    },
  },
  {
    id: 'tc4-tampered-signature',
    code: 'Kịch bản 4a (TC4-Bit)',
    title: 'Sửa bit đầu của vector chữ ký x thành (0, 0, 0, 0, 1)',
    category: 'tamper_sig',
    description:
      'Giữ nguyên văn bản M = "Tôi đồng ý" (y₂ = 56) nhưng sửa bit đầu của vector chữ ký từ 1 thành 0: x = (0,0,0,0,1). Tổng công khai v chỉ còn B₅ = 22 ≠ 56 → Từ chối chữ ký (INVALID).',
    targetScreen: 'verify',
    params: {
      profile: SUPPORTED_PROFILE,
      n: '5',
      W: '2, 3, 7, 14, 30',
      q: '61',
      r: '17',
    },
    signMessageText: 'Tôi đồng ý',
    verifyInputs: {
      message: 'Tôi đồng ý',
      B: '34, 51, 58, 55, 22',
      k: '2',
      x: '0, 0, 0, 0, 1',
    },
    expectedOutcome: {
      status: 'INVALID',
      summary: 'Tổng chữ ký v = 22 khác đại diện văn bản y₂ = 56 (22 ≠ 56) → Trạng thái INVALID.',
    },
  },
  {
    id: 'tc4-malformed-signature',
    code: 'Kịch bản 4b (TC4-Format)',
    title: 'Nhập phần tử không phải nhị phân trong vector x = (2, 0, 0, 0, 1)',
    category: 'tamper_sig',
    description:
      'Kiểm tra phân biệt giữa chữ ký sai phép tính (INVALID) và chữ ký sai cấu trúc định dạng (FORMAT_ERROR) khi vector x chứa số 2.',
    targetScreen: 'verify',
    params: {
      profile: SUPPORTED_PROFILE,
      n: '5',
      W: '2, 3, 7, 14, 30',
      q: '61',
      r: '17',
    },
    signMessageText: 'Tôi đồng ý',
    verifyInputs: {
      message: 'Tôi đồng ý',
      B: '34, 51, 58, 55, 22',
      k: '2',
      x: '2, 0, 0, 0, 1',
    },
    expectedOutcome: {
      status: 'FORMAT_ERROR',
      summary: 'Phần tử x₁ = 2 ∉ {0, 1} bị chặn ngay ở bước kiểm tra định dạng → Trạng thái FORMAT_ERROR.',
    },
  },
  {
    id: 'tc5-forgery-counterexample',
    code: 'Phản ví dụ Bảo mật (Mục 2.5)',
    title: 'Giả mạo chữ ký trên miền băm nhỏ (T+1 = 221) không cần khóa bí mật',
    category: 'forgery_limit',
    description:
      'Minh họa giới hạn bảo mật ở trang 9: Kẻ tấn công chọn trước x=(1,0,1,0,1) có tổng công khai v = 34+58+22 = 114, rồi thử bộ đếm cho M="Thông điệp giả mạo MHK" đến k=123 được y₁₂₃ = 114. Bộ xác minh trả về VALID dù không dùng W, q, r, u.',
    targetScreen: 'verify',
    params: {
      profile: SUPPORTED_PROFILE,
      n: '5',
      W: '2, 3, 7, 14, 30',
      q: '61',
      r: '17',
    },
    signMessageText: 'Thông điệp giả mạo MHK',
    verifyInputs: {
      message: 'Thông điệp giả mạo MHK',
      B: '34, 51, 58, 55, 22',
      k: '123',
      x: '1, 0, 1, 0, 1',
    },
    expectedOutcome: {
      status: 'VALID',
      summary:
        'y₁₂₃ = 114 khớp v = 34+58+22 = 114 → VALID (Chứng minh miền băm 221 giá trị chỉ dùng cho mục đích học thuật, dễ bị tấn công tiền ảnh/va chạm).',
    },
  },
];

export interface AutomatedTestCaseReport {
  id: string;
  code: string;
  title: string;
  inputSummary: string;
  expectedStatus: ResultStatus;
  actualStatus: ResultStatus;
  passed: boolean;
  measuredDetails: string;
}

export function runAllAutomatedTestCases(): AutomatedTestCaseReport[] {
  const results: AutomatedTestCaseReport[] = [];

  // TC1: Standard KeyGen + Sign + Verify
  const tc1Keys: KeyPairResult = generateKeys({
    profile: SUPPORTED_PROFILE,
    nInput: 5,
    wInput: '2, 3, 7, 14, 30',
    qInput: 61,
    rInput: 17,
  });
  const tc1Sign: SignResult | undefined =
    tc1Keys.pk && tc1Keys.sk ? signMessage('Tôi đồng ý', tc1Keys.sk, tc1Keys.pk) : undefined;
  const tc1Verify: VerifyResult = verifyFromRawInputs({
    message: 'Tôi đồng ý',
    bInput: '34, 51, 58, 55, 22',
    kInput: 2,
    xInput: '1, 0, 0, 0, 1',
  });

  const tc1Passed =
    tc1Keys.status === 'VALID' &&
    tc1Sign?.status === 'VALID' &&
    tc1Sign.signature?.k === 2 &&
    tc1Verify.status === 'VALID' &&
    tc1Verify.y_k === 56 &&
    tc1Verify.v === 56;

  results.push({
    id: 'TC1',
    code: 'TC-01',
    title: 'Chạy bộ số chuẩn & Ký văn bản "Tôi đồng ý"',
    inputSummary: 'n=5, W=(2,3,7,14,30), q=61, r=17; M="Tôi đồng ý" (15 bytes)',
    expectedStatus: 'VALID',
    actualStatus: tc1Verify.status,
    passed: tc1Passed,
    measuredDetails: `B=(34,51,58,55,22), u=18, T=220; k=0 (v=165≠104 loại), k=1 (dư 1 loại), k=2 nhận x=(1,0,0,0,1), y₂=v=56.`,
  });

  // TC2: Invalid Superincreasing & Coprime
  const tc2Super = generateKeys({
    profile: SUPPORTED_PROFILE,
    nInput: 5,
    wInput: '2, 3, 7, 12, 30',
    qInput: 61,
    rInput: 17,
  });
  const tc2Coprime = generateKeys({
    profile: SUPPORTED_PROFILE,
    nInput: 5,
    wInput: '2, 3, 7, 14, 30',
    qInput: 60,
    rInput: 15,
  });
  results.push({
    id: 'TC2',
    code: 'TC-02',
    title: 'Nhập sai điều kiện dãy siêu tăng / nguyên tố cùng nhau',
    inputSummary: 'Ca A: W=(2,3,7,12,30); Ca B: q=60, r=15',
    expectedStatus: 'FORMAT_ERROR',
    actualStatus: tc2Super.status === 'FORMAT_ERROR' && tc2Coprime.status === 'FORMAT_ERROR' ? 'FORMAT_ERROR' : 'VALID',
    passed: tc2Super.status === 'FORMAT_ERROR' && tc2Coprime.status === 'FORMAT_ERROR',
    measuredDetails: `Ca A: W₄=12 ≤ 2+3+7=12 (FORMAT_ERROR). Ca B: gcd(15,60)=15 ≠ 1 (FORMAT_ERROR).`,
  });

  // TC3: Tampered Message after Signing
  const tc3Verify = verifyFromRawInputs({
    message: 'Tôi không đồng ý',
    bInput: '34, 51, 58, 55, 22',
    kInput: 2,
    xInput: '1, 0, 0, 0, 1',
  });
  results.push({
    id: 'TC3',
    code: 'TC-03',
    title: 'Sửa văn bản sau khi ký thành "Tôi không đồng ý"',
    inputSummary: 'M="Tôi không đồng ý" (22 bytes), B=(34,51,58,55,22), k=2, x=(1,0,0,0,1)',
    expectedStatus: 'INVALID',
    actualStatus: tc3Verify.status,
    passed: tc3Verify.status === 'INVALID' && tc3Verify.y_k === 65 && tc3Verify.v === 56,
    measuredDetails: `Đại diện băm mới y₂ = ${tc3Verify.y_k}, tổng chữ ký công khai v = ${tc3Verify.v} (56 ≠ 65 → INVALID).`,
  });

  // TC4: Tampered Signature Vector x
  const tc4Bit = verifyFromRawInputs({
    message: 'Tôi đồng ý',
    bInput: '34, 51, 58, 55, 22',
    kInput: 2,
    xInput: '0, 0, 0, 0, 1',
  });
  const tc4Format = verifyFromRawInputs({
    message: 'Tôi đồng ý',
    bInput: '34, 51, 58, 55, 22',
    kInput: 2,
    xInput: '2, 0, 0, 0, 1',
  });
  results.push({
    id: 'TC4',
    code: 'TC-04',
    title: 'Sửa vector chữ ký x thành (0,0,0,0,1) hoặc sai định dạng (2,0,0,0,1)',
    inputSummary: 'M="Tôi đồng ý", k=2; Ca A: x=(0,0,0,0,1); Ca B: x=(2,0,0,0,1)',
    expectedStatus: 'INVALID',
    actualStatus: tc4Bit.status,
    passed:
      tc4Bit.status === 'INVALID' &&
      tc4Bit.v === 22 &&
      tc4Bit.y_k === 56 &&
      tc4Format.status === 'FORMAT_ERROR',
    measuredDetails: `Ca A: v = 22 ≠ y₂ = 56 (INVALID). Ca B: x₁ = 2 ∉ {0,1} (FORMAT_ERROR).`,
  });

  // TC5: Security Limit Forgery Counterexample
  const tc5Forgery = verifyFromRawInputs({
    message: 'Thông điệp giả mạo MHK',
    bInput: '34, 51, 58, 55, 22',
    kInput: 123,
    xInput: '1, 0, 1, 0, 1',
  });
  results.push({
    id: 'TC5',
    code: 'TC-05 (Phản ví dụ)',
    title: 'Phản ví dụ giả mạo chữ ký khi miền băm nhỏ (T+1 = 221)',
    inputSummary: 'M="Thông điệp giả mạo MHK", B=(34,51,58,55,22), k=123, x=(1,0,1,0,1) (không dùng sk)',
    expectedStatus: 'VALID',
    actualStatus: tc5Forgery.status,
    passed: tc5Forgery.status === 'VALID' && tc5Forgery.y_k === 114 && tc5Forgery.v === 114,
    measuredDetails: `Kẻ tấn công chọn x=(1,0,1,0,1) → v=114, dò k=123 được y₁₂₃=114 → Verify báo VALID mà không cần W, q, r, u.`,
  });

  return results;
}
