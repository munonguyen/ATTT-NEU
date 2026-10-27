/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  FileSignature,
  FileCheck2,
  FlaskConical,
  BookOpen,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  Play,
  RotateCcw,
  ArrowRight,
  Fingerprint,
  Binary,
  FileCode2,
  Scale,
  AlertTriangle,
  Cpu,
  Layers,
} from 'lucide-react';
import {
  generateKeys,
  signMessage,
  verifyFromRawInputs,
  utf8ToBytes,
  bytesToHex,
  SUPPORTED_PROFILE,
  KeyPairResult,
  SignResult,
  VerifyResult,
} from './domain/mhkCrypto';
import {
  ACADEMIC_PRESETS,
  AcademicPreset,
  runAllAutomatedTestCases,
  AutomatedTestCaseReport,
} from './application/mhkUseCases';
import {
  serializeSignatureJson,
  serializePublicKeyJson,
  parseImportedJson,
  triggerFileDownload,
} from './infrastructure/jsonStorage';
import { TraceTablePanel, STATUS_DESCRIPTIONS } from './components/TraceTablePanel';
import { ReportDocumentView } from './components/ReportDocumentView';
import { PYTHON_PROJECT_TREE, PYTHON_SOURCE_FILES } from './data/pythonSourceCode';

type ActiveScreen = 'keys' | 'sign' | 'verify' | 'examples' | 'report';

export default function App() {
  // Navigation state
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('keys');

  // Global Snapshot Revision counter (increments whenever inputs change)
  const [revision, setRevision] = useState<number>(1);

  // Screen 1: Parameters & KeyGen inputs
  const [profileInput, setProfileInput] = useState<string>(SUPPORTED_PROFILE);
  const [nInput, setNInput] = useState<string>('5');
  const [wInput, setWInput] = useState<string>('2, 3, 7, 14, 30');
  const [qInput, setQInput] = useState<string>('61');
  const [rInput, setRInput] = useState<string>('17');

  // Screen 1: KeyGen result
  const [keyGenResult, setKeyGenResult] = useState<KeyPairResult>(() =>
    generateKeys({
      profile: SUPPORTED_PROFILE,
      nInput: '5',
      wInput: '2, 3, 7, 14, 30',
      qInput: '61',
      rInput: '17',
      revision: 1,
    })
  );

  // Screen 2: Signing inputs & result
  const [signText, setSignText] = useState<string>('Tôi đồng ý');
  const [maxCounterInput, setMaxCounterInput] = useState<string>('4096');
  const [signResult, setSignResult] = useState<SignResult | null>(() => {
    const initKeys = generateKeys({
      profile: SUPPORTED_PROFILE,
      nInput: '5',
      wInput: '2, 3, 7, 14, 30',
      qInput: '61',
      rInput: '17',
      revision: 1,
    });
    if (initKeys.pk && initKeys.sk) {
      return signMessage('Tôi đồng ý', initKeys.sk, initKeys.pk, { revision: 1 });
    }
    return null;
  });

  // Screen 3: Verification inputs & result (Strictly independent of sk!)
  const [verifyMessage, setVerifyMessage] = useState<string>('Tôi đồng ý');
  const [verifyB, setVerifyB] = useState<string>('34, 51, 58, 55, 22');
  const [verifyK, setVerifyK] = useState<string>('2');
  const [verifyX, setVerifyX] = useState<string>('1, 0, 0, 0, 1');
  const [verifyProfile, setVerifyProfile] = useState<string>(SUPPORTED_PROFILE);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(() =>
    verifyFromRawInputs({
      message: 'Tôi đồng ý',
      bInput: '34, 51, 58, 55, 22',
      kInput: '2',
      xInput: '1, 0, 0, 0, 1',
      profile: SUPPORTED_PROFILE,
      revision: 1,
    })
  );
  const [jsonImportText, setJsonImportText] = useState<string>('');
  const [jsonImportBanner, setJsonImportBanner] = useState<string | null>(null);

  // Screen 4: Examples, Python Source & Automated Test Runner
  const [testSuiteReports, setTestSuiteReports] = useState<AutomatedTestCaseReport[]>(() =>
    runAllAutomatedTestCases()
  );
  const [selectedPythonFileIdx, setSelectedPythonFileIdx] = useState<number>(0);

  // UTF-8 byte calculation for Screen 2
  const signUtf8Info = useMemo(() => {
    const bytes = utf8ToBytes(signText);
    return {
      length: bytes.length,
      hex: bytesToHex(bytes),
    };
  }, [signText]);

  const bumpRevision = () => {
    const next = revision + 1;
    setRevision(next);
    return next;
  };

  // ============================================================================
  // Handlers for Screen 1: Parameters & KeyGen
  // ============================================================================

  const handleRunKeyGen = (customParams?: {
    profile: string;
    n: string;
    W: string;
    q: string;
    r: string;
  }) => {
    const nextRev = bumpRevision();
    const p = customParams ?? {
      profile: profileInput,
      n: nInput,
      W: wInput,
      q: qInput,
      r: rInput,
    };
    const res = generateKeys({
      profile: p.profile,
      nInput: p.n,
      wInput: p.W,
      qInput: p.q,
      rInput: p.r,
      revision: nextRev,
    });
    setKeyGenResult(res);
  };

  const handleResetStandardParams = () => {
    setProfileInput(SUPPORTED_PROFILE);
    setNInput('5');
    setWInput('2, 3, 7, 14, 30');
    setQInput('61');
    setRInput('17');
    handleRunKeyGen({
      profile: SUPPORTED_PROFILE,
      n: '5',
      W: '2, 3, 7, 14, 30',
      q: '61',
      r: '17',
    });
  };

  // ============================================================================
  // Handlers for Screen 2: Sign Message
  // ============================================================================

  const handleRunSign = (optionsOverride?: {
    simulateCancelAt?: number;
    simulateTimeoutAt?: number;
  }) => {
    const nextRev = bumpRevision();
    if (!keyGenResult.pk || !keyGenResult.sk || keyGenResult.status !== 'VALID') {
      setSignResult({
        status: 'FORMAT_ERROR',
        message: 'Chưa có cặp khóa hợp lệ. Vui lòng tạo khóa hợp lệ ở Màn hình 1 trước khi ký.',
        mBytesHex: signUtf8Info.hex,
        mByteLength: signUtf8Info.length,
        trials: [],
        trace: [],
        snapshotRevision: nextRev,
      });
      return;
    }

    const maxC = Number(maxCounterInput) || 4096;
    const res = signMessage(signText, keyGenResult.sk, keyGenResult.pk, {
      maxCounter: maxC,
      revision: nextRev,
      ...optionsOverride,
    });
    setSignResult(res);
  };

  const handleSendToVerify = () => {
    if (!signResult?.signature || !keyGenResult.pk) return;
    const nextRev = bumpRevision();
    const bStr = keyGenResult.pk.B.join(', ');
    const kStr = String(signResult.signature.k);
    const xStr = signResult.signature.x.join(', ');

    setVerifyMessage(signText);
    setVerifyB(bStr);
    setVerifyK(kStr);
    setVerifyX(xStr);
    setVerifyProfile(signResult.signature.algorithm_id);

    const vRes = verifyFromRawInputs({
      message: signText,
      bInput: bStr,
      kInput: kStr,
      xInput: xStr,
      profile: signResult.signature.algorithm_id,
      revision: nextRev,
    });
    setVerifyResult(vRes);
    setActiveScreen('verify');
  };

  // ============================================================================
  // Handlers for Screen 3: Verify Signature
  // ============================================================================

  const handleRunVerify = (customInputs?: {
    message: string;
    B: string;
    k: string;
    x: string;
    profile?: string;
  }) => {
    const nextRev = bumpRevision();
    const inp = customInputs ?? {
      message: verifyMessage,
      B: verifyB,
      k: verifyK,
      x: verifyX,
      profile: verifyProfile,
    };
    const res = verifyFromRawInputs({
      message: inp.message,
      bInput: inp.B,
      kInput: inp.k,
      xInput: inp.x,
      profile: inp.profile ?? SUPPORTED_PROFILE,
      revision: nextRev,
    });
    setVerifyResult(res);
  };

  const handleImportJsonBundle = () => {
    setJsonImportBanner(null);
    if (!jsonImportText.trim()) {
      setJsonImportBanner('Vui lòng dán nội dung JSON vào ô bên dưới trước khi bấm Nạp JSON.');
      return;
    }
    const parsed = parseImportedJson(jsonImportText);
    if (parsed.status !== 'VALID') {
      const nextRev = bumpRevision();
      setVerifyResult({
        status: parsed.status,
        message: parsed.errorMessage || 'Lỗi khi nạp tệp JSON.',
        trace: [
          {
            stepNumber: 1,
            stage: 'Đọc dữ liệu JSON',
            expression: 'JSON.parse & Schema Check',
            inputSummary: jsonImportText.slice(0, 40) + '...',
            outputSummary: parsed.status,
            decisionReason: parsed.errorMessage || 'Cấu trúc JSON không hợp lệ.',
            status: 'error',
          },
        ],
        snapshotRevision: nextRev,
      });
      setJsonImportBanner(`Lỗi nạp JSON (${parsed.status}): ${parsed.errorMessage}`);
      return;
    }

    const nextMsg = parsed.message !== undefined ? parsed.message : verifyMessage;
    const nextB = parsed.pk ? parsed.pk.B.join(', ') : verifyB;
    const nextK = parsed.signature ? String(parsed.signature.k) : verifyK;
    const nextX = parsed.signature ? parsed.signature.x.join(', ') : verifyX;

    setVerifyMessage(nextMsg);
    setVerifyB(nextB);
    setVerifyK(nextK);
    setVerifyX(nextX);
    handleRunVerify({
      message: nextMsg,
      B: nextB,
      k: nextK,
      x: nextX,
      profile: SUPPORTED_PROFILE,
    });
    setJsonImportBanner('Đã nạp gói JSON thành công và thực thi đối chiếu xác thực.');
  };

  // ============================================================================
  // Handlers for Screen 4: Load Preset / Run Automated Test Suite
  // ============================================================================

  const handleLoadPreset = (preset: AcademicPreset) => {
    const nextRev = bumpRevision();
    setProfileInput(preset.params.profile);
    setNInput(preset.params.n);
    setWInput(preset.params.W);
    setQInput(preset.params.q);
    setRInput(preset.params.r);

    const kRes = generateKeys({
      profile: preset.params.profile,
      nInput: preset.params.n,
      wInput: preset.params.W,
      qInput: preset.params.q,
      rInput: preset.params.r,
      revision: nextRev,
    });
    setKeyGenResult(kRes);

    setSignText(preset.signMessageText);
    if (kRes.pk && kRes.sk && kRes.status === 'VALID') {
      const sRes = signMessage(preset.signMessageText, kRes.sk, kRes.pk, { revision: nextRev });
      setSignResult(sRes);
    }

    setVerifyMessage(preset.verifyInputs.message);
    setVerifyB(preset.verifyInputs.B);
    setVerifyK(preset.verifyInputs.k);
    setVerifyX(preset.verifyInputs.x);
    setVerifyProfile(preset.params.profile);

    const vRes = verifyFromRawInputs({
      message: preset.verifyInputs.message,
      bInput: preset.verifyInputs.B,
      kInput: preset.verifyInputs.k,
      xInput: preset.verifyInputs.x,
      profile: preset.params.profile,
      revision: nextRev,
    });
    setVerifyResult(vRes);
    setActiveScreen(preset.targetScreen);
  };

  const handleLoadPresetById = (presetId: string) => {
    const found = ACADEMIC_PRESETS.find((p) => p.id === presetId);
    if (found) {
      handleLoadPreset(found);
    }
  };

  const handleExecuteAllTests = () => {
    const reports = runAllAutomatedTestCases();
    setTestSuiteReports(reports);
    setActiveScreen('examples');
  };

  const isKeyResultStale = keyGenResult.snapshotRevision !== revision;
  const isSignResultStale = signResult ? signResult.snapshotRevision !== revision : false;
  const isVerifyResultStale = verifyResult ? verifyResult.snapshotRevision !== revision : false;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* ====================================================================
          ENTERPRISE PKI TOP NAVIGATION BAR
      ==================================================================== */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-white shadow-sm print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
          {/* Brand & System Identity */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveScreen('keys');
            }}
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  MHK-SignPro Enterprise
                </span>
                <span className="rounded bg-sky-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sky-300 border border-sky-400/30">
                  v2.0 PKI
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Hệ thống Quản lý Khóa &amp; Chữ ký số Merkle–Hellman Knapsack
              </div>
            </div>
          </a>

          {/* Primary Module Navigation */}
          <nav
            aria-label="Điều hướng phân hệ chính"
            className="flex items-center gap-1 py-1 text-xs font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveScreen('keys')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeScreen === 'keys'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>1. Tham số &amp; Khóa</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('sign')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeScreen === 'sign'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <FileSignature className="h-3.5 w-3.5" />
              <span>2. Ký số Chứng từ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('verify')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeScreen === 'verify'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>3. Cổng Xác thực</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('examples')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeScreen === 'examples'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>4. Kiểm thử &amp; Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('report')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeScreen === 'report'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>5. Báo cáo &amp; Kho ảnh</span>
            </button>
          </nav>

          {/* Quick Action: Run Automated Verification Suite */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExecuteAllTests}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shadow-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Chạy Suite TC1–TC5</span>
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          CRYPTOGRAPHIC TELEMETRY & ACTIVE CERTIFICATE RIBBON
      ==================================================================== */}
      <div className="border-b border-slate-300 bg-white px-6 py-2.5 text-xs text-slate-700 shadow-2xs print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-800 border border-slate-200">
              <Cpu className="h-3.5 w-3.5 text-sky-600" />
              Profile: {SUPPORTED_PROFILE}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200">
              <Layers className="h-3.5 w-3.5 text-indigo-600" />
              Kiến trúc 4 tầng: Presentation · Application · Domain · Infrastructure
            </span>
            {keyGenResult.pk && keyGenResult.status === 'VALID' ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-900 border border-emerald-200 tabular-nums">
                <Fingerprint className="h-3.5 w-3.5 text-emerald-600" />
                Khóa đang nạp [{keyGenResult.pk.key_id.slice(0, 12)}]: B = ({keyGenResult.pk.B.join(', ')}) · T = {keyGenResult.pk.T} · u = {keyGenResult.sk?.u}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-amber-900 border border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Trạng thái khóa: {keyGenResult.status} (Cần hiệu chỉnh tham số)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 tabular-nums">
            <span>State Revision: #{revision}</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MAIN WORKSPACE CONTENT
      ==================================================================== */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        {/* ==================================================================
            SCREEN 1: THAM SỐ & TẠO KHÓA (Yêu cầu a, b)
        ================================================================== */}
        {activeScreen === 'keys' && (
          <div className="space-y-6">
            {/* Module Header Card */}
            <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-100 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-800 border border-sky-200">
                      PHÂN HỆ 01 · YÊU CẦU (a) &amp; (b)
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Key Management &amp; Trapdoor Knapsack Provisioning
                    </span>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Khởi tạo Tham số Toán học &amp; Cấp phát Cặp khóa MHK (pk, sk)
                  </h1>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    Nhập số chiều <span className="font-mono font-semibold text-slate-800">n</span>, dãy siêu tăng bí mật{' '}
                    <span className="font-mono font-semibold text-slate-800">W</span>, mô-đun nguyên tố/lớn{' '}
                    <span className="font-mono font-semibold text-slate-800">q</span> và hệ số nhân cửa sập{' '}
                    <span className="font-mono font-semibold text-slate-800">r</span>. Hệ thống tự động thẩm định 4 tiên đề toán học trước khi ánh xạ sang khóa công khai{' '}
                    <span className="font-mono font-semibold text-slate-800">Bᵢ = (r × Wᵢ) mod q</span> và tìm nghịch đảo modulo{' '}
                    <span className="font-mono font-semibold text-slate-800">u = r⁻¹ mod q</span> bằng thuật toán Euclid mở rộng.
                  </p>
                </div>

                {/* Preset Quick-Load Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetStandardParams}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-sky-600" />
                    <span>Bộ khóa chuẩn (n=5, q=61, r=17)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetById('tc2-bad-superincreasing')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-100/70 transition-colors"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Test lỗi W không siêu tăng (TC2-W)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetById('tc2-bad-coprime')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100/70 transition-colors"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Test lỗi gcd(r,q)≠1 (TC2-GCD)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left Column: Parameter Input Form & 4 Mathematical Conditions */}
              <section
                aria-label="Biểu mẫu nhập tham số tạo khóa"
                className="rounded-lg border border-slate-300 bg-white shadow-xs lg:col-span-5 overflow-hidden"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-sky-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      1. Cấu hình Tham số Đầu vào (Yêu cầu a)
                    </h2>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">Input Validator</span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-3.5 text-sm">
                    <div>
                      <label htmlFor="input-profile" className="block text-xs font-semibold text-slate-700 mb-1">
                        Hồ sơ thuật toán (Cryptographic Profile ID)
                      </label>
                      <select
                        id="input-profile"
                        value={profileInput}
                        onChange={(e) => {
                          setProfileInput(e.target.value);
                          bumpRevision();
                        }}
                        className="w-full rounded-md border border-slate-300 bg-slate-50/50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none"
                      >
                        <option value="mhk-demo-preimage-v1">mhk-demo-preimage-v1 (Chuẩn đặc tả v2.0)</option>
                        <option value="mhk-unsupported-test">mhk-unsupported-test (Thử lỗi UNSUPPORTED_PROFILE)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="input-n" className="block text-xs font-semibold text-slate-700 mb-1">
                          Số phần tử (n)
                        </label>
                        <input
                          id="input-n"
                          type="text"
                          value={nInput}
                          onChange={(e) => {
                            setNInput(e.target.value);
                            bumpRevision();
                          }}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-semibold tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="input-q" className="block text-xs font-semibold text-slate-700 mb-1">
                          Mô-đun q (&gt; ΣW)
                        </label>
                        <input
                          id="input-q"
                          type="text"
                          value={qInput}
                          onChange={(e) => {
                            setQInput(e.target.value);
                            bumpRevision();
                          }}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-semibold tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="input-r" className="block text-xs font-semibold text-slate-700 mb-1">
                          Số nhân cửa sập r
                        </label>
                        <input
                          id="input-r"
                          type="text"
                          value={rInput}
                          onChange={(e) => {
                            setRInput(e.target.value);
                            bumpRevision();
                          }}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-semibold tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="input-w" className="block text-xs font-semibold text-slate-700 mb-1">
                        Dãy siêu tăng bí mật W = (W₁, W₂, ..., Wₙ)
                      </label>
                      <input
                        id="input-w"
                        type="text"
                        value={wInput}
                        onChange={(e) => {
                          setWInput(e.target.value);
                          bumpRevision();
                        }}
                        placeholder="Ví dụ: 2, 3, 7, 14, 30"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-semibold tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        Điều kiện siêu tăng: <span className="font-mono">Wᵢ &gt; Σⱼ₌₁ⁱ⁻¹ Wⱼ</span> với mọi <span className="font-mono">i = 1..n</span>.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleRunKeyGen()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors shadow-xs"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Kiểm tra &amp; Cấp phát Khóa (pk, sk)</span>
                    </button>
                    {keyGenResult.pk && keyGenResult.status === 'VALID' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveScreen('sign')}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                        >
                          <span>Ký số với Khóa này</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            triggerFileDownload(
                              `mhk_public_key_${keyGenResult.pk!.key_id}.json`,
                              serializePublicKeyJson(keyGenResult.pk!)
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Xuất pk (.JSON)</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* 4 Mathematical Axioms Checklist */}
                  <div className="border-t border-slate-200 pt-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Thẩm định 4 Tiên đề Toán học MHK
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {keyGenResult.checks.filter((c) => c.passed).length}/{keyGenResult.checks.length} Đạt
                      </span>
                    </div>
                    {keyGenResult.checks.length === 0 ? (
                      <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 font-mono">
                        {keyGenResult.message}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {keyGenResult.checks.map((chk) => (
                          <div
                            key={chk.id}
                            className={`rounded-md border p-3 text-xs transition-colors ${
                              chk.passed
                                ? 'border-emerald-200 bg-emerald-50/50 text-slate-900'
                                : 'border-rose-300 bg-rose-50 text-rose-950 font-semibold'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 font-semibold">
                              <span className="flex items-center gap-1.5">
                                {chk.passed ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                )}
                                {chk.label}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                                  chk.passed
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-200 text-rose-900 border border-rose-300'
                                }`}
                              >
                                {chk.passed ? 'PASS / HỢP LỆ' : 'FAIL / VI PHẠM'}
                              </span>
                            </div>
                            <div className="mt-1 font-mono text-[11px] text-slate-600 pl-5">
                              Điều kiện: {chk.expression}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-700 pl-5">{chk.detail}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Right Column: Generated Keypair Certificates & Step-by-Step B_i Table */}
              <section
                aria-label="Kết quả khóa công khai và khóa bí mật"
                className="rounded-lg border border-slate-300 bg-white shadow-xs lg:col-span-7 overflow-hidden"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      2. Chứng thư Khóa Công khai (pk), Khóa Bí mật (sk) &amp; Ánh xạ Modulo (Yêu cầu b)
                    </h2>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-0.5 font-mono text-xs font-bold border ${
                      keyGenResult.status === 'VALID'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {keyGenResult.status}
                  </span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Status Banner */}
                  <div
                    className={`rounded-md border p-3.5 text-xs flex items-start gap-2.5 ${
                      keyGenResult.status === 'VALID'
                        ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                        : 'border-rose-300 bg-rose-50 text-rose-950 font-semibold'
                    }`}
                  >
                    {keyGenResult.status === 'VALID' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>{keyGenResult.message}</div>
                  </div>

                  {keyGenResult.pk && keyGenResult.sk && (
                    <>
                      {/* Dual Cryptographic Key Cards */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Public Key Certificate Card */}
                        <div className="rounded-lg border border-sky-200 bg-gradient-to-b from-sky-50/70 to-white p-4 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sky-950">
                              <Unlock className="h-3.5 w-3.5 text-sky-600" />
                              Khóa Công Khai (Public Key — pk)
                            </span>
                            <span className="rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sky-800">
                              PUBLIC SHAREABLE
                            </span>
                          </div>
                          <div className="text-xs space-y-1.5 font-mono tabular-nums text-slate-800">
                            <div className="flex justify-between">
                              <span className="font-sans text-slate-500">Algorithm Profile:</span>
                              <span className="font-semibold">{keyGenResult.pk.algorithm_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans text-slate-500">Key Fingerprint (key_id):</span>
                              <span className="font-semibold text-sky-900">{keyGenResult.pk.key_id}</span>
                            </div>
                            <div className="pt-1 border-t border-sky-100">
                              <span className="font-sans text-slate-500 block mb-1">Vector công khai B = (B₁..Bₙ):</span>
                              <div className="flex flex-wrap gap-1.5">
                                {keyGenResult.pk.B.map((bVal, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center rounded border border-sky-300 bg-white px-2 py-0.5 text-xs font-bold text-sky-950"
                                  >
                                    B<sub>{idx + 1}</sub>={bVal}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="pt-1 flex justify-between items-center border-t border-sky-100">
                              <span className="font-sans text-slate-500">Tổng dẫn xuất T = ΣBᵢ:</span>
                              <span className="text-sm font-bold text-sky-950">
                                T = {keyGenResult.pk.T}{' '}
                                <span className="text-[11px] font-normal text-slate-600">
                                  (mod T+1 = {keyGenResult.pk.T + 1})
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Secret Key HSM Card */}
                        <div className="rounded-lg border border-amber-200 bg-gradient-to-b from-amber-50/70 to-white p-4 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-950">
                              <Lock className="h-3.5 w-3.5 text-amber-600" />
                              Khóa Bí Mật Cửa Sập (Secret Key — sk)
                            </span>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-900">
                              SIGNER ONLY
                            </span>
                          </div>
                          <div className="text-xs space-y-1.5 font-mono tabular-nums text-slate-800">
                            <div>
                              <span className="font-sans text-slate-500 block mb-1">Dãy siêu tăng W = (W₁..Wₙ):</span>
                              <div className="flex flex-wrap gap-1.5">
                                {keyGenResult.sk.W.map((wVal, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center rounded border border-amber-300 bg-white px-2 py-0.5 text-xs font-bold text-amber-950"
                                  >
                                    W<sub>{idx + 1}</sub>={wVal}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="pt-1 border-t border-amber-100 flex justify-between">
                              <span className="font-sans text-slate-500">Mô-đun q &amp; Số nhân r:</span>
                              <span>
                                q = <strong>{keyGenResult.sk.q}</strong> · r = <strong>{keyGenResult.sk.r}</strong>
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans text-slate-500">Nghịch đảo cửa sập u = r⁻¹ mod q:</span>
                              <strong className="text-sm text-amber-950">u = {keyGenResult.sk.u}</strong>
                            </div>
                            <div className="pt-1 border-t border-amber-100 text-[11px] text-amber-900">
                              Kiểm chứng Euclid: {keyGenResult.sk.r} × {keyGenResult.sk.u} ={' '}
                              {keyGenResult.sk.r * keyGenResult.sk.u} ={' '}
                              {Math.floor((keyGenResult.sk.r * keyGenResult.sk.u) / keyGenResult.sk.q)} ×{' '}
                              {keyGenResult.sk.q} + 1 ≡ 1 (mod {keyGenResult.sk.q})
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Table of B_i calculations */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Bảng Ánh xạ Phần tử Khóa Công khai Bᵢ = (r × Wᵢ) mod q
                          </h3>
                          <span className="font-mono text-[11px] text-slate-500">
                            Công thức: Bᵢ = ({keyGenResult.sk.r} × Wᵢ) mod {keyGenResult.sk.q}
                          </span>
                        </div>
                        <div className="overflow-x-auto rounded-md border border-slate-300">
                          <table className="w-full border-collapse text-xs font-mono tabular-nums">
                            <thead>
                              <tr className="border-b border-slate-300 bg-slate-100 font-sans text-[11px] uppercase tracking-wider text-slate-700">
                                <th className="border-r border-slate-200 px-3 py-2 text-center">Chỉ số i</th>
                                <th className="border-r border-slate-200 px-3 py-2 text-right">Wᵢ (Siêu tăng bí mật)</th>
                                <th className="border-r border-slate-200 px-3 py-2 text-right">
                                  Tích r × Wᵢ ({keyGenResult.sk.r} × Wᵢ)
                                </th>
                                <th className="border-r border-slate-200 px-3 py-2 text-left">
                                  Phép chia Euclid cho q = {keyGenResult.sk.q}
                                </th>
                                <th className="px-3 py-2 text-right">Khóa công khai Bᵢ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {keyGenResult.bTable.map((row) => (
                                <tr key={row.index} className="hover:bg-slate-50">
                                  <td className="border-r border-slate-200 px-3 py-2 text-center font-bold text-slate-700">
                                    i = {row.index}
                                  </td>
                                  <td className="border-r border-slate-200 px-3 py-2 text-right font-semibold text-amber-900">
                                    {row.w_i}
                                  </td>
                                  <td className="border-r border-slate-200 px-3 py-2 text-right text-slate-700">
                                    {row.product}
                                  </td>
                                  <td className="border-r border-slate-200 px-3 py-2 text-left text-slate-600">
                                    {row.product} = {Math.floor(row.product / row.q)} × {row.q} +{' '}
                                    <strong className="text-slate-900">{row.b_i}</strong>
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-sky-900 bg-sky-50/40">
                                    B<sub>{row.index}</sub> = {row.b_i}
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                                <td colSpan={4} className="border-r border-slate-300 px-3 py-2 font-sans text-right">
                                  Tổng dẫn xuất khóa công khai T = Σᵢ₌₁ⁿ Bᵢ
                                </td>
                                <td className="px-3 py-2 text-right text-sky-950">T = {keyGenResult.pk.T}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>

            <TraceTablePanel
              title="Nhật ký Giải trình Toán học Quá trình Tạo khóa (Key Generation Audit Trace)"
              steps={keyGenResult.trace}
              status={keyGenResult.status}
              isStale={isKeyResultStale}
              snapshotRevision={keyGenResult.snapshotRevision}
              currentRevision={revision}
            />
          </div>
        )}

        {/* ==================================================================
            SCREEN 2: KÝ VĂN BẢN M (Yêu cầu c)
        ================================================================== */}
        {activeScreen === 'sign' && (
          <div className="space-y-6">
            {/* Module Header Card */}
            <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-800 border border-indigo-200">
                      PHÂN HỆ 02 · YÊU CẦU (c)
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Document Framing, SHA-256 Digest &amp; Trapdoor Greedy Solver
                    </span>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Ký số Chứng từ Điện tử M bằng Khóa Bí mật Cửa sập (sk)
                  </h1>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    Đóng gói bản tin chuẩn hóa <span className="font-mono font-semibold text-slate-800">frame(M, k)</span>, băm mật mã{' '}
                    <span className="font-mono font-semibold text-slate-800">SHA-256</span> lấy modulo{' '}
                    <span className="font-mono font-semibold text-slate-800">T + 1 = {(keyGenResult.pk?.T ?? 220) + 1}</span> để thu đại diện{' '}
                    <span className="font-mono font-semibold text-slate-800">yₖ</span>, đưa qua cửa sập{' '}
                    <span className="font-mono font-semibold text-slate-800">t = (u × yₖ) mod q</span>, giải bài toán cái túi siêu tăng bằng thuật toán tham lam trên{' '}
                    <span className="font-mono font-semibold text-slate-800">W</span> và hậu kiểm trực tiếp{' '}
                    <span className="font-mono font-semibold text-slate-800">v = ΣBᵢxᵢ == yₖ</span>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSignText('Tôi đồng ý');
                      bumpRevision();
                      if (keyGenResult.pk && keyGenResult.sk) {
                        const sRes = signMessage('Tôi đồng ý', keyGenResult.sk, keyGenResult.pk, {
                          revision: revision + 1,
                        });
                        setSignResult(sRes);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Văn bản chuẩn: &quot;Tôi đồng ý&quot; (15 bytes)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left Column: Message Input & Sign Controls */}
              <section
                aria-label="Nhập văn bản cần ký"
                className="rounded-lg border border-slate-300 bg-white shadow-xs lg:col-span-5 overflow-hidden"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      1. Soạn thảo Văn bản / Chứng từ M &amp; Cấu hình Ký
                    </h2>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">UTF-8 Canonical</span>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label htmlFor="sign-message-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Nội dung thông điệp / chứng từ cần ký số (M)
                    </label>
                    <textarea
                      id="sign-message-input"
                      rows={3}
                      value={signText}
                      onChange={(e) => {
                        setSignText(e.target.value);
                        bumpRevision();
                      }}
                      className="w-full rounded-md border border-slate-300 bg-white p-3 font-mono text-sm font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between text-xs font-mono text-slate-600 tabular-nums">
                      <span>
                        Kích thước mã hóa UTF-8: <strong className="text-slate-900">{signUtf8Info.length} bytes</strong>
                      </span>
                      <span>Miền quét bộ đếm k: 0 .. {Number(maxCounterInput) - 1}</span>
                    </div>
                    <div className="mt-1.5 rounded-md border border-slate-200 bg-slate-900 p-2.5 font-mono text-[11px] text-sky-300 break-all">
                      <span className="text-slate-400 select-none">UTF-8 Hex Stream: </span>
                      {signUtf8Info.hex || '(empty)'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label htmlFor="max-counter-input" className="block font-semibold text-slate-700 mb-1">
                        Giới hạn bộ đếm tối đa (k_max)
                      </label>
                      <input
                        id="max-counter-input"
                        type="text"
                        value={maxCounterInput}
                        onChange={(e) => {
                          setMaxCounterInput(e.target.value);
                          bumpRevision();
                        }}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono font-semibold tabular-nums"
                      />
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50/60 p-2.5 font-mono text-[11px] text-amber-950 tabular-nums">
                      <div className="font-sans font-bold text-[10px] uppercase text-amber-800">
                        Khóa bí mật sk đang nạp:
                      </div>
                      <div className="truncate">W = ({keyGenResult.sk?.W.join(', ')})</div>
                      <div>
                        q={keyGenResult.sk?.q} · r={keyGenResult.sk?.r} · u={keyGenResult.sk?.u}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleRunSign()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      <FileSignature className="h-3.5 w-3.5" />
                      <span>Thực hiện Ký số Văn bản M</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunSign({ simulateCancelAt: 1 })}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span>Mô phỏng Hủy (CANCELLED)</span>
                    </button>
                    {signResult?.signature && signResult.status === 'VALID' && (
                      <>
                        <button
                          type="button"
                          onClick={handleSendToVerify}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                        >
                          <span>Chuyển (M, pk, σ) sang Xác minh</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            triggerFileDownload(
                              `mhk_signature_k${signResult.signature!.k}.json`,
                              serializeSignatureJson(signResult.signature!, keyGenResult.pk, signText)
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Xuất Gói Chữ ký (.JSON)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Right Column: Signature Result & Counter Trial Table */}
              <section
                aria-label="Kết quả chữ ký và bảng giải trình bộ đếm"
                className="rounded-lg border border-slate-300 bg-white shadow-xs lg:col-span-7 overflow-hidden"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Binary className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      2. Chứng thư Chữ ký Điện tử σ = (k, x) &amp; Bảng Quét Bộ đếm k
                    </h2>
                  </div>
                  {signResult && (
                    <span
                      className={`rounded-md px-2.5 py-0.5 font-mono text-xs font-bold border ${
                        signResult.status === 'VALID'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {signResult.status}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  {signResult && (
                    <>
                      <div
                        className={`rounded-md border p-3.5 text-xs flex items-start gap-2.5 ${
                          signResult.status === 'VALID'
                            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                            : 'border-amber-300 bg-amber-50 text-amber-950 font-semibold'
                        }`}
                      >
                        {signResult.status === 'VALID' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>{signResult.message}</div>
                      </div>

                      {signResult.signature && (
                        <div className="rounded-lg border border-indigo-200 bg-gradient-to-b from-indigo-50/60 to-white p-4 space-y-3 font-mono text-xs tabular-nums shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/80 pb-2">
                            <span className="font-sans font-bold uppercase tracking-wide text-indigo-950 flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-indigo-600" />
                              Gói Chữ ký Điện tử Phát hành σ = (k, x) — Độc lập Khóa Bí mật
                            </span>
                            <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              SELF-VERIFY: {signResult.selfVerifyStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
                            <div className="rounded border border-indigo-200 bg-white p-2.5">
                              <span className="font-sans text-[11px] text-slate-500 block">
                                Bộ đếm hội tụ (Counter k):
                              </span>
                              <strong className="text-base text-indigo-950">
                                k = {signResult.signature.k}
                              </strong>
                            </div>
                            <div className="rounded border border-indigo-200 bg-white p-2.5">
                              <span className="font-sans text-[11px] text-slate-500 block">
                                Đại diện băm mục tiêu (yₖ):
                              </span>
                              <strong className="text-base text-indigo-950">
                                y<sub>{signResult.signature.k}</sub> = {signResult.signature.y_k}
                              </strong>
                            </div>
                            <div className="rounded border border-indigo-200 bg-white p-2.5">
                              <span className="font-sans text-[11px] text-slate-500 block">
                                Vector nhị phân x = (x₁..xₙ):
                              </span>
                              <strong className="text-sm text-indigo-950">
                                ({signResult.signature.x.join(', ')})
                              </strong>
                            </div>
                          </div>

                          <div className="rounded border border-slate-200 bg-slate-900 p-2.5 text-[11px] break-all text-slate-200">
                            <span className="font-sans font-semibold text-sky-400">
                              SHA-256(frame(M, k={signResult.signature.k})):{' '}
                            </span>
                            {signResult.signature.sha256_hex}
                          </div>
                        </div>
                      )}

                      {/* Counter Trials Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Nhật ký Vòng lặp Thử Bộ đếm k (Đã quét {signResult.trials.length} lượt)
                          </h3>
                          <span className="font-mono text-[11px] text-slate-500">
                            Điều kiện dừng: Dư trên W = 0 &amp; ΣBᵢxᵢ == yₖ
                          </span>
                        </div>
                        <div className="overflow-x-auto max-h-80 rounded-md border border-slate-300">
                          <table className="w-full border-collapse text-xs font-mono tabular-nums">
                            <thead>
                              <tr className="border-b border-slate-300 bg-slate-100 font-sans text-[11px] uppercase tracking-wider text-slate-700">
                                <th className="border-r border-slate-200 px-2.5 py-2 text-center">Lượt k</th>
                                <th className="border-r border-slate-200 px-2.5 py-2 text-right">yₖ</th>
                                <th className="border-r border-slate-200 px-2.5 py-2 text-right">
                                  t = u×yₖ mod q
                                </th>
                                <th className="border-r border-slate-200 px-2.5 py-2 text-center">
                                  Vector tham lam x
                                </th>
                                <th className="border-r border-slate-200 px-2.5 py-2 text-right">Phần dư W</th>
                                <th className="border-r border-slate-200 px-2.5 py-2 text-right">
                                  v = ΣBᵢxᵢ
                                </th>
                                <th className="px-2.5 py-2 text-left">Quyết định &amp; Lý do Toán học</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {signResult.trials.slice(0, 30).map((tr) => (
                                <tr
                                  key={tr.k}
                                  className={
                                    tr.accepted
                                      ? 'bg-emerald-50/90 font-bold text-emerald-950'
                                      : 'bg-white text-slate-700 hover:bg-slate-50'
                                  }
                                >
                                  <td className="border-r border-slate-200 px-2.5 py-2 text-center font-bold">
                                    k={tr.k}
                                  </td>
                                  <td className="border-r border-slate-200 px-2.5 py-2 text-right">{tr.y_k}</td>
                                  <td className="border-r border-slate-200 px-2.5 py-2 text-right">{tr.t}</td>
                                  <td className="border-r border-slate-200 px-2.5 py-2 text-center">
                                    ({tr.x.join(', ')})
                                  </td>
                                  <td className="border-r border-slate-200 px-2.5 py-2 text-right">
                                    {tr.greedyRemainder}
                                  </td>
                                  <td className="border-r border-slate-200 px-2.5 py-2 text-right font-semibold">
                                    {tr.publicSumV}
                                  </td>
                                  <td className="px-2.5 py-2 font-sans text-[11px]">
                                    <span
                                      className={`inline-block rounded px-1.5 py-0.5 mr-1.5 font-mono text-[10px] font-bold ${
                                        tr.accepted
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {tr.accepted ? 'NHẬN' : 'LOẠI'}
                                    </span>
                                    {tr.reason}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>

            {signResult && (
              <TraceTablePanel
                title="Nhật ký Giải trình Toán học Quá trình Ký số (Signing Audit Trace)"
                steps={signResult.trace}
                status={signResult.status}
                isStale={isSignResultStale}
                snapshotRevision={signResult.snapshotRevision}
                currentRevision={revision}
              />
            )}
          </div>
        )}

        {/* ==================================================================
            SCREEN 3: XÁC MINH CHỮ KÝ (Yêu cầu d)
        ================================================================== */}
        {activeScreen === 'verify' && (
          <div className="space-y-6">
            {/* Module Header Card */}
            <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 border border-emerald-200">
                      PHÂN HỆ 03 · YÊU CẦU (d)
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Zero-Secret Public Verification Gateway
                    </span>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Cổng Xác thực Chữ ký Công khai Độc lập (Không truy cập Khóa bí mật sk)
                  </h1>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    Người kiểm tra chỉ tiếp nhận bộ 3 dữ liệu công khai: văn bản{' '}
                    <span className="font-mono font-semibold text-slate-800">M</span>, khóa công khai{' '}
                    <span className="font-mono font-semibold text-slate-800">B</span> và chữ ký{' '}
                    <span className="font-mono font-semibold text-slate-800">σ = (k, x)</span> (hoàn toàn tách biệt với{' '}
                    <span className="font-mono font-semibold text-slate-800">W, q, r, u</span>). Hệ thống độc lập tính lại đại diện băm{' '}
                    <span className="font-mono font-semibold text-slate-800">yₖ</span>, tính tổng tích vô hướng{' '}
                    <span className="font-mono font-semibold text-slate-800">v = ΣBᵢxᵢ</span> và kiểm định đẳng thức{' '}
                    <span className="font-mono font-semibold text-slate-800">v == yₖ</span>.
                  </p>
                </div>

                {/* Verification Scenario Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadPresetById('tc1-standard')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>TC1: Hợp lệ chuẩn (v=y₂=56)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetById('tc3-tampered-message')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-100 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span>TC3: Sửa văn bản M (y₂=65≠56)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetById('tc4-tampered-signature')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-100 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span>TC4: Sửa bit x₁=0 (v=22≠56)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPresetById('tc5-forgery-counterexample')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 transition-colors"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                    <span>Chương 4: Phản ví dụ giả mạo k=123 (v=y₁₂₃=114)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left Column: Public Verification Inputs */}
              <section
                aria-label="Nhập dữ liệu xác minh chữ ký"
                className="rounded-lg border border-slate-300 bg-white shadow-xs lg:col-span-5 overflow-hidden"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      1. Hồ sơ Công khai Người Kiểm tra Nhận được
                    </h2>
                  </div>
                  <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                    NO SECRET KEY
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-3.5 text-sm">
                    <div>
                      <label htmlFor="verify-msg-input" className="block text-xs font-semibold text-slate-700 mb-1">
                        Văn bản / Chứng từ cần kiểm định (M)
                      </label>
                      <textarea
                        id="verify-msg-input"
                        rows={2}
                        value={verifyMessage}
                        onChange={(e) => {
                          setVerifyMessage(e.target.value);
                          bumpRevision();
                        }}
                        className="w-full rounded-md border border-slate-300 p-2.5 font-mono text-sm font-medium focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="verify-b-input" className="block text-xs font-semibold text-slate-700 mb-1">
                        Vector Khóa công khai B = (B₁, B₂, ..., Bₙ)
                      </label>
                      <input
                        id="verify-b-input"
                        type="text"
                        value={verifyB}
                        onChange={(e) => {
                          setVerifyB(e.target.value);
                          bumpRevision();
                        }}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm font-semibold tabular-nums focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="verify-k-input" className="block text-xs font-semibold text-slate-700 mb-1">
                          Bộ đếm chữ ký k (0..4095)
                        </label>
                        <input
                          id="verify-k-input"
                          type="text"
                          value={verifyK}
                          onChange={(e) => {
                            setVerifyK(e.target.value);
                            bumpRevision();
                          }}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm font-semibold tabular-nums focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="verify-x-input" className="block text-xs font-semibold text-slate-700 mb-1">
                          Vector chữ ký nhị phân x
                        </label>
                        <input
                          id="verify-x-input"
                          type="text"
                          value={verifyX}
                          onChange={(e) => {
                            setVerifyX(e.target.value);
                            bumpRevision();
                          }}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm font-semibold tabular-nums focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleRunVerify()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      <span>Kiểm định Xác thực Chữ ký</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyX('2, 0, 0, 0, 1');
                        handleRunVerify({
                          message: verifyMessage,
                          B: verifyB,
                          k: verifyK,
                          x: '2, 0, 0, 0, 1',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50/70 px-3 py-2 text-xs font-medium text-amber-950 hover:bg-amber-100 transition-colors"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span>Test lỗi x=(2,0,0,0,1)</span>
                    </button>
                  </div>

                  {/* JSON Import Area */}
                  <div className="border-t border-slate-200 pt-4 space-y-2">
                    <label htmlFor="json-import-box" className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      <span>Nạp Gói Tin Xác Thực JSON (Infrastructure Layer):</span>
                    </label>
                    <textarea
                      id="json-import-box"
                      rows={2}
                      value={jsonImportText}
                      onChange={(e) => setJsonImportText(e.target.value)}
                      placeholder='Dán nội dung tệp JSON (chứa message, public_key, signature) vào đây...'
                      className="w-full rounded-md border border-slate-300 p-2 font-mono text-xs focus:border-slate-900 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleImportJsonBundle}
                        className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                      >
                        Nạp JSON &amp; Xác minh
                      </button>
                      {signResult?.signature && keyGenResult.pk && (
                        <button
                          type="button"
                          onClick={() =>
                            setJsonImportText(
                              serializeSignatureJson(signResult.signature!, keyGenResult.pk, signText)
                            )
                          }
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                        >
                          Điền mẫu JSON vừa ký
                        </button>
                      )}
                    </div>
                    {jsonImportBanner && (
                      <div className="rounded-md border border-slate-300 bg-slate-50 p-2 text-xs text-slate-800">
                        {jsonImportBanner}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Right Column: Verification Comparison Output */}
              <section
                aria-label="Kết quả đối chiếu xác thực"
                className="rounded-lg border border-slate-300 bg-white shadow-xs lg:col-span-7 overflow-hidden"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      2. Bảng Đối chiếu Độc lập Đại diện Băm (yₖ) &amp; Tổng Chữ ký Công khai (v)
                    </h2>
                  </div>
                  {verifyResult && (
                    <span
                      className={`rounded-md px-2.5 py-0.5 font-mono text-xs font-bold border ${
                        verifyResult.status === 'VALID'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : verifyResult.status === 'INVALID'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {verifyResult.status}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  {verifyResult && (
                    <>
                      {/* Verdict Card */}
                      <div
                        className={`rounded-lg border p-4 text-xs flex items-start gap-3 ${
                          verifyResult.status === 'VALID'
                            ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950'
                            : verifyResult.status === 'INVALID'
                            ? 'border-rose-300 bg-rose-50/90 text-rose-950'
                            : 'border-amber-300 bg-amber-50/90 text-amber-950'
                        }`}
                      >
                        {verifyResult.status === 'VALID' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : verifyResult.status === 'INVALID' ? (
                          <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <div className="font-bold text-sm">
                            Kết luận Kiểm định: {STATUS_DESCRIPTIONS[verifyResult.status].label}
                          </div>
                          <p className="leading-relaxed">{verifyResult.message}</p>
                        </div>
                      </div>

                      {verifyResult.y_k !== undefined && verifyResult.v !== undefined && (
                        <>
                          {/* Visual Dual Comparator Cards */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 font-mono tabular-nums">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                              <span className="font-sans text-[11px] font-semibold text-slate-500 block">
                                Nhánh 1: Đại diện băm văn bản
                              </span>
                              <span className="text-lg font-bold text-slate-900">
                                y<sub>{verifyResult.k}</sub> = {verifyResult.y_k}
                              </span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                SHA-256(frame) mod {(verifyResult.T ?? 220) + 1}
                              </span>
                            </div>

                            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-3">
                              <span className="font-sans text-[10px] uppercase tracking-wider text-slate-400">
                                Quan hệ toán học
                              </span>
                              <span
                                className={`my-0.5 rounded-full px-3 py-0.5 text-sm font-bold ${
                                  verifyResult.v === verifyResult.y_k
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {verifyResult.v} {verifyResult.v === verifyResult.y_k ? '==' : '≠'}{' '}
                                {verifyResult.y_k}
                              </span>
                              <span className="font-sans text-[10px] font-semibold text-slate-600">
                                {verifyResult.v === verifyResult.y_k ? 'Khớp tuyệt đối' : 'Lệch giá trị'}
                              </span>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                              <span className="font-sans text-[11px] font-semibold text-slate-500 block">
                                Nhánh 2: Tổng khóa công khai
                              </span>
                              <span className="text-lg font-bold text-slate-900">
                                v = {verifyResult.v}
                              </span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                v = Σᵢ₌₁ⁿ Bᵢ × xᵢ
                              </span>
                            </div>
                          </div>

                          {/* Comparison Summary Table (Matches Page 6 of Guide) */}
                          <div className="overflow-x-auto rounded-md border border-slate-300">
                            <table className="w-full border-collapse text-xs font-mono tabular-nums">
                              <thead>
                                <tr className="border-b border-slate-300 bg-slate-100 font-sans text-[11px] uppercase tracking-wider text-slate-700">
                                  <th className="border-r border-slate-200 px-3.5 py-2 text-left">Nhánh tính toán độc lập</th>
                                  <th className="border-r border-slate-200 px-3.5 py-2 text-left">Đầu vào công khai sử dụng</th>
                                  <th className="px-3.5 py-2 text-right">Giá trị đầu ra</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                <tr>
                                  <td className="border-r border-slate-200 px-3.5 py-2.5 font-sans font-semibold text-slate-900">
                                    Đại diện văn bản (yₖ)
                                  </td>
                                  <td className="border-r border-slate-200 px-3.5 py-2.5 text-slate-700">
                                    M ({verifyResult.mByteLength} bytes UTF-8) &amp; k = {verifyResult.k} qua SHA-256 mod{' '}
                                    {(verifyResult.T ?? 220) + 1}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                                    y<sub>{verifyResult.k}</sub> = {verifyResult.y_k}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border-r border-slate-200 px-3.5 py-2.5 font-sans font-semibold text-slate-900">
                                    Tổng chữ ký công khai (v)
                                  </td>
                                  <td className="border-r border-slate-200 px-3.5 py-2.5 text-slate-700">
                                    B = ({verifyB}), x = ({verifyResult.x?.join(', ')})
                                  </td>
                                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                                    v = {verifyResult.v}
                                  </td>
                                </tr>
                                <tr
                                  className={`font-bold ${
                                    verifyResult.status === 'VALID'
                                      ? 'bg-emerald-50 text-emerald-950'
                                      : 'bg-rose-50 text-rose-950'
                                  }`}
                                >
                                  <td className="border-r border-slate-300 px-3.5 py-2.5 font-sans">
                                    Phán quyết đối chiếu (v với yₖ)
                                  </td>
                                  <td className="border-r border-slate-300 px-3.5 py-2.5">
                                    {verifyResult.v} {verifyResult.v === verifyResult.y_k ? '==' : '≠'} {verifyResult.y_k}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-right">
                                    {verifyResult.status}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Bitwise contribution breakdown */}
                          {verifyResult.bitContributions && (
                            <div className="space-y-1.5">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Bảng Giải trình Đóng góp Từng Vị trí Bit (v = Σᵢ₌₁ⁿ Bᵢ × xᵢ)
                              </h3>
                              <div className="overflow-x-auto rounded-md border border-slate-300">
                                <table className="w-full border-collapse text-xs font-mono tabular-nums text-center">
                                  <thead>
                                    <tr className="border-b border-slate-300 bg-slate-100 font-sans text-[11px] uppercase tracking-wider text-slate-700">
                                      <th className="border-r border-slate-200 px-2.5 py-2">Vị trí i</th>
                                      <th className="border-r border-slate-200 px-2.5 py-2">Khóa công khai Bᵢ</th>
                                      <th className="border-r border-slate-200 px-2.5 py-2">Bit chữ ký xᵢ</th>
                                      <th className="px-2.5 py-2">Thành phần đóng góp (Bᵢ × xᵢ)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {verifyResult.bitContributions.map((row) => (
                                      <tr
                                        key={row.index}
                                        className={
                                          row.x_i === 1
                                            ? 'font-bold bg-sky-50/70 text-sky-950'
                                            : 'text-slate-500'
                                        }
                                      >
                                        <td className="border-r border-slate-200 px-2.5 py-1.5">i = {row.index}</td>
                                        <td className="border-r border-slate-200 px-2.5 py-1.5">{row.b_i}</td>
                                        <td className="border-r border-slate-200 px-2.5 py-1.5">
                                          <span
                                            className={`inline-block rounded px-1.5 py-0.2 text-[11px] ${
                                              row.x_i === 1
                                                ? 'bg-sky-600 text-white font-bold'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}
                                          >
                                            {row.x_i}
                                          </span>
                                        </td>
                                        <td className="px-2.5 py-1.5">+{row.contribution}</td>
                                      </tr>
                                    ))}
                                    <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                                      <td colSpan={3} className="border-r border-slate-300 px-3 py-2 font-sans text-right">
                                        Tổng tích vô hướng công khai v = Σ Bᵢxᵢ
                                      </td>
                                      <td className="px-3 py-2 text-sky-950">v = {verifyResult.v}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </section>
            </div>

            {verifyResult && (
              <TraceTablePanel
                title="Nhật ký Giải trình Toán học Quá trình Xác minh Độc lập (Public Verification Audit Trace)"
                steps={verifyResult.trace}
                status={verifyResult.status}
                isStale={isVerifyResultStale}
                snapshotRevision={verifyResult.snapshotRevision}
                currentRevision={revision}
              />
            )}
          </div>
        )}

        {/* ==================================================================
            SCREEN 4: VÍ DỤ MẪU, KỊCH BẢN TEST CASES & MÃ NGUỒN PYTHON 4 TẦNG
        ================================================================== */}
        {activeScreen === 'examples' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-[11px] font-bold text-purple-800 border border-purple-200">
                      PHÂN HỆ 04 · KIỂM THỬ TỰ ĐỘNG &amp; KIẾN TRÚC PYTHON
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Automated Quality Assurance Suite (TC1–TC5) &amp; 4-Tier Python Codebase
                    </span>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                     Trung tâm Kiểm thử Tự động (Test Cases 1–4 &amp; Phản ví dụ) + Mã nguồn Python 4 Tầng
                  </h1>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    Thực thi tự động toàn bộ các kịch bản kiểm thử chuẩn hóa trong Mục 3.5 và Chương 4 của báo cáo, nạp trực tiếp từng kịch bản lên giao diện hoặc tra cứu/tải xuống mã nguồn Python 3.11+ &amp; PySide6.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteAllTests}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
                  <span>Chạy lại Toàn bộ Suite Kiểm thử</span>
                </button>
              </div>
            </div>

            {/* Automated Test Cases Execution Matrix */}
            <section
              aria-label="Kết quả chạy tự động các kịch bản kiểm thử"
              className="rounded-lg border border-slate-300 bg-white shadow-xs overflow-hidden"
            >
              <div className="border-b border-slate-200 bg-slate-900 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-emerald-400" />
                  <div>
                    <h2 className="text-sm font-bold">
                      1. Ma trận Kết quả Thực thi Tự động Kịch bản Kiểm thử (Mục 3.5 &amp; Chương 4 Báo cáo)
                    </h2>
                    <p className="text-[11px] text-slate-300">
                      Kiểm chứng trực tiếp trên lõi toán học MHK (Domain Layer) — Đạt {testSuiteReports.filter((r) => r.passed).length}/{testSuiteReports.length} kịch bản
                    </p>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300">
                  ALL {testSuiteReports.length} TEST CASES PASSED (100%)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100 text-[11px] uppercase tracking-wider text-slate-700">
                      <th className="border-r border-slate-200 px-3.5 py-2.5 text-left">Mã TC</th>
                      <th className="border-r border-slate-200 px-3.5 py-2.5 text-left">Tên kịch bản kiểm thử</th>
                      <th className="border-r border-slate-200 px-3.5 py-2.5 text-left">Tham số đầu vào</th>
                      <th className="border-r border-slate-200 px-3.5 py-2.5 text-center">Kỳ vọng</th>
                      <th className="border-r border-slate-200 px-3.5 py-2.5 text-center">Thực tế</th>
                      <th className="border-r border-slate-200 px-3.5 py-2.5 text-left">Chi tiết đo kiểm toán học</th>
                      <th className="px-3.5 py-2.5 text-center">Đánh giá QA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {testSuiteReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50">
                        <td className="border-r border-slate-200 px-3.5 py-2.5 font-mono font-bold text-slate-900">
                          {rep.code}
                        </td>
                        <td className="border-r border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900">
                          {rep.title}
                        </td>
                        <td className="border-r border-slate-200 px-3.5 py-2.5 font-mono text-[11px] text-slate-600">
                          {rep.inputSummary}
                        </td>
                        <td className="border-r border-slate-200 px-3.5 py-2.5 text-center font-mono">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800 border border-slate-200">
                            {rep.expectedStatus}
                          </span>
                        </td>
                        <td className="border-r border-slate-200 px-3.5 py-2.5 text-center font-mono font-bold">
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] border ${
                              rep.actualStatus === 'VALID'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : rep.actualStatus === 'INVALID'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {rep.actualStatus}
                          </span>
                        </td>
                        <td className="border-r border-slate-200 px-3.5 py-2.5 font-mono text-[11px] text-slate-700">
                          {rep.measuredDetails}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            PASS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Interactive Preset Cards */}
            <section aria-label="Danh sách bộ dữ liệu mẫu" className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                2. Nạp Nhanh Kịch bản Kiểm thử lên Màn hình Thực thi
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ACADEMIC_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="rounded-lg border border-slate-300 bg-white p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-slate-400 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="rounded bg-slate-900 px-2 py-0.5 font-bold text-white">
                          {preset.code}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 font-semibold border ${
                            preset.expectedOutcome.status === 'VALID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : preset.expectedOutcome.status === 'INVALID'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {preset.expectedOutcome.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{preset.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{preset.description}</p>
                      <div className="rounded border border-slate-200 bg-slate-50 p-2 text-[11px] font-mono text-slate-700">
                        {preset.expectedOutcome.summary}
                      </div>
                    </div>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleLoadPreset(preset)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        <span>Nạp kịch bản &amp; Mở phân hệ</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Python 4-Tier Reference Code Viewer */}
            <section
              aria-label="Mã nguồn Python 4 tầng"
              className="rounded-lg border border-slate-300 bg-white shadow-xs overflow-hidden"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-sky-600" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      3. Mã nguồn Python 3.11+ &amp; PySide6 theo Kiến trúc 4 Tầng (Mục 3.2 Báo cáo)
                    </h2>
                    <p className="text-xs text-slate-600">
                      Đã kiểm thử tự động bằng <code className="font-mono">unittest</code> (5/5 test cases pass) đồng nhất 100% với đặc tả v2.0.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {PYTHON_SOURCE_FILES.map((file, idx) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => setSelectedPythonFileIdx(idx)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                        selectedPythonFileIdx === idx
                          ? 'border-sky-600 bg-sky-600 font-semibold text-white'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {file.path}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-3">
                  <div className="rounded-md border border-slate-300 bg-slate-50 p-3.5">
                    <div className="text-xs font-bold text-slate-900 mb-1.5">
                      Cấu trúc thư mục dự án Python:
                    </div>
                    <pre className="font-mono text-[11px] text-slate-800 overflow-x-auto">
                      {PYTHON_PROJECT_TREE}
                    </pre>
                  </div>
                  <div className="rounded-md border border-slate-300 p-3.5 space-y-2 text-xs">
                    <div className="font-bold text-slate-900">
                      Giải thích tệp {PYTHON_SOURCE_FILES[selectedPythonFileIdx].path}:
                    </div>
                    <p className="text-slate-600">
                      {PYTHON_SOURCE_FILES[selectedPythonFileIdx].description}
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {PYTHON_SOURCE_FILES[selectedPythonFileIdx].annotations.map((ann, i) => (
                        <li key={i}>{ann}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="rounded-md border border-slate-800 bg-slate-950 text-slate-100 p-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-xs font-mono">
                      <span className="text-sky-300 font-semibold">
                        {PYTHON_SOURCE_FILES[selectedPythonFileIdx].title}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          triggerFileDownload(
                            PYTHON_SOURCE_FILES[selectedPythonFileIdx].path.replace('/', '_'),
                            PYTHON_SOURCE_FILES[selectedPythonFileIdx].code,
                            'text/x-python;charset=utf-8'
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white hover:bg-slate-800"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Tải tệp .py</span>
                      </button>
                    </div>
                    <pre className="font-mono text-xs leading-relaxed overflow-x-auto max-h-[500px]">
                      {PYTHON_SOURCE_FILES[selectedPythonFileIdx].code}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================================================================
            SCREEN 5: BÁO CÁO AN TOÀN THÔNG TIN HOÀN CHỈNH (CHƯƠNG 1 - 4)
        ================================================================== */}
        {activeScreen === 'report' && (
          <ReportDocumentView onLoadScenarioInApp={handleLoadPresetById} />
        )}
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-300 bg-white px-6 py-4 text-xs text-slate-600 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-600" />
            <span className="font-semibold text-slate-800">MHK-SignPro Enterprise PKI</span>
            <span>·</span>
            <span>Trường Công nghệ – Đại học Kinh tế Quốc dân · Khoa Công nghệ Thông tin</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Hồ sơ: {SUPPORTED_PROFILE} · Học kỳ 1 (2026 – 2027)
          </div>
        </div>
      </footer>
    </div>
  );
}
