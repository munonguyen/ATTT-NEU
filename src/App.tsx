/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* ====================================================================
          TOP BAR CONTRACT (3 Zones separated by gap-8)
      ==================================================================== */}
      <header className="flex items-center justify-between gap-8 border-b border-slate-300 bg-white px-6 py-3.5 print:hidden">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveScreen('keys');
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Hệ thống Chữ ký Điện tử MHK
        </a>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav
          aria-label="Điều hướng màn hình chính"
          className="flex items-center gap-6 overflow-x-auto text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setActiveScreen('keys')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeScreen === 'keys'
                ? 'border-b-2 border-slate-900 font-semibold text-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            1. Tham số &amp; Khóa
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('sign')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeScreen === 'sign'
                ? 'border-b-2 border-slate-900 font-semibold text-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            2. Ký văn bản
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('verify')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeScreen === 'verify'
                ? 'border-b-2 border-slate-900 font-semibold text-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            3. Xác minh chữ ký
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('examples')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeScreen === 'examples'
                ? 'border-b-2 border-slate-900 font-semibold text-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            4. Ví dụ &amp; Kịch bản
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen('report')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
              activeScreen === 'report'
                ? 'border-b-2 border-slate-900 font-semibold text-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            5. Báo cáo ATTT (Chương 1–4)
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleExecuteAllTests}
            className="bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Chạy Kiểm thử TC1–TC5
          </button>
        </div>
      </header>

      {/* ====================================================================
          CONTEXTUAL ACADEMIC BAR (Unboxed metadata with separators)
      ==================================================================== */}
      <div className="border-b border-slate-200 bg-slate-100 px-6 py-2 text-xs text-slate-700 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">Hồ sơ thuật toán:</span>
            <span className="font-mono">mhk-demo-preimage-v1</span>
            <span aria-hidden="true">·</span>
            <span>Kiến trúc 4 tầng: Presentation / Application / Domain / Infrastructure</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Khóa hiện hành:{' '}
              {keyGenResult.pk
                ? `B = (${keyGenResult.pk.B.join(', ')}), T = ${keyGenResult.pk.T}, u = ${keyGenResult.sk?.u}`
                : 'Chưa có khóa hợp lệ'}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono tabular-nums">
            <span>Phiên bản dữ liệu: Rev #{revision}</span>
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
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-300 pb-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Màn hình 1: Kiểm tra Tham số đầu vào &amp; Tạo cặp khóa MHK (Yêu cầu a, b)
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Nhập số phần tử <span className="font-mono">n</span>, dãy siêu tăng bí mật{' '}
                  <span className="font-mono">W</span>, mô-đun <span className="font-mono">q</span> và số nhân{' '}
                  <span className="font-mono">r</span>. Hệ thống kiểm tra 4 điều kiện toán học trước khi tính khóa công khai{' '}
                  <span className="font-mono">Bᵢ = (r × Wᵢ) mod q</span> và nghịch đảo{' '}
                  <span className="font-mono">u = r⁻¹ mod q</span>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetStandardParams}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Nạp bộ tham số chuẩn (n=5, q=61, r=17)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetById('tc2-bad-superincreasing')}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Thử ca lỗi dãy W (TC2-W)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetById('tc2-bad-coprime')}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Thử ca lỗi gcd(r,q)≠1 (TC2-GCD)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left Column: Parameter Input Form */}
              <section
                aria-label="Biểu mẫu nhập tham số tạo khóa"
                className="border border-slate-300 bg-white p-5 lg:col-span-5 space-y-4"
              >
                <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  1. Nhập tham số đầu vào (Yêu cầu a)
                </h2>

                <div className="space-y-3 text-sm">
                  <div>
                    <label htmlFor="input-profile" className="block text-xs font-semibold text-slate-700 mb-1">
                      Hồ sơ thuật toán (Profile ID)
                    </label>
                    <select
                      id="input-profile"
                      value={profileInput}
                      onChange={(e) => {
                        setProfileInput(e.target.value);
                        bumpRevision();
                      }}
                      className="w-full border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    >
                      <option value="mhk-demo-preimage-v1">mhk-demo-preimage-v1 (Chuẩn đặc tả v2.0)</option>
                      <option value="mhk-unsupported-test">mhk-unsupported-test (Thử lỗi UNSUPPORTED_PROFILE)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="input-n" className="block text-xs font-semibold text-slate-700 mb-1">
                        Số phần tử n
                      </label>
                      <input
                        id="input-n"
                        type="text"
                        value={nInput}
                        onChange={(e) => {
                          setNInput(e.target.value);
                          bumpRevision();
                        }}
                        className="w-full border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
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
                        className="w-full border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="input-r" className="block text-xs font-semibold text-slate-700 mb-1">
                        Số nhân r
                      </label>
                      <input
                        id="input-r"
                        type="text"
                        value={rInput}
                        onChange={(e) => {
                          setRInput(e.target.value);
                          bumpRevision();
                        }}
                        className="w-full border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
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
                      className="w-full border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Ngăn cách các số nguyên dương bằng dấu phẩy hoặc khoảng trắng. Mỗi số phải lớn hơn tổng tất cả các số đứng trước nó.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRunKeyGen()}
                    className="bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    Kiểm tra &amp; Tạo khóa (pk, sk)
                  </button>
                  {keyGenResult.pk && keyGenResult.status === 'VALID' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveScreen('sign')}
                        className="border border-slate-900 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                      >
                        Sang Màn hình 2: Ký văn bản →
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          triggerFileDownload(
                            `mhk_public_key_${keyGenResult.pk!.key_id}.json`,
                            serializePublicKeyJson(keyGenResult.pk!)
                          )
                        }
                        className="border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                      >
                        Xuất pk JSON
                      </button>
                    </>
                  )}
                </div>

                {/* 4 Validation Conditions Checklist */}
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-900">
                    Kết quả kiểm tra 4 điều kiện toán học:
                  </div>
                  {keyGenResult.checks.length === 0 ? (
                    <div className="text-xs text-red-800 font-mono">{keyGenResult.message}</div>
                  ) : (
                    <div className="space-y-2">
                      {keyGenResult.checks.map((chk) => (
                        <div
                          key={chk.id}
                          className={`border border-black p-2.5 text-xs ${
                            chk.passed
                              ? 'bg-white text-black'
                              : 'bg-neutral-100 text-black font-bold'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{chk.label}</span>
                            <span className="font-mono">
                              {chk.passed ? '[ĐẠT / HỢP LỆ]' : '[VI PHẠM / LỖI]'}
                            </span>
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-slate-700">
                            Biểu thức: {chk.expression}
                          </div>
                          <div className="mt-0.5 text-[11px]">{chk.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Right Column: Generated Keypair & Step-by-Step B_i Table */}
              <section
                aria-label="Kết quả khóa công khai và khóa bí mật"
                className="border border-slate-300 bg-white p-5 lg:col-span-7 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    2. Kết quả Khóa công khai (pk), Khóa bí mật (sk) &amp; Bảng tính Bᵢ (Yêu cầu b)
                  </h2>
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    Trạng thái: {keyGenResult.status}
                  </span>
                </div>

                <div
                  className={`border border-black p-3 text-xs ${
                    keyGenResult.status === 'VALID'
                      ? 'bg-white text-black'
                      : 'bg-neutral-100 text-black font-bold'
                  }`}
                >
                  {keyGenResult.message}
                </div>

                {keyGenResult.pk && keyGenResult.sk && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Public Key Box */}
                      <div className="border border-slate-300 p-3.5 space-y-1.5">
                        <div className="text-xs font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                          Khóa công khai (Public Key — pk) [Có thể chia sẻ]
                        </div>
                        <div className="text-xs space-y-1 font-mono tabular-nums">
                          <div>
                            <span className="font-sans text-slate-600">Hồ sơ: </span>
                            {keyGenResult.pk.algorithm_id}
                          </div>
                          <div>
                            <span className="font-sans text-slate-600">Mã định danh (key_id): </span>
                            {keyGenResult.pk.key_id}
                          </div>
                          <div>
                            <span className="font-sans text-slate-600">Dãy công khai B: </span>
                            <strong>({keyGenResult.pk.B.join(', ')})</strong>
                          </div>
                          <div>
                            <span className="font-sans text-slate-600">Giá trị dẫn xuất T = ΣBᵢ: </span>
                            <strong>{keyGenResult.pk.T}</strong> (Miền băm T+1 = {keyGenResult.pk.T + 1})
                          </div>
                        </div>
                      </div>

                      {/* Secret Key Box */}
                      <div className="border border-slate-300 p-3.5 space-y-1.5">
                        <div className="text-xs font-bold uppercase text-slate-900 border-b border-slate-200 pb-1">
                          Khóa bí mật (Secret Key — sk) [Chỉ Người ký giữ]
                        </div>
                        <div className="text-xs space-y-1 font-mono tabular-nums">
                          <div>
                            <span className="font-sans text-slate-600">Dãy siêu tăng W: </span>
                            <strong>({keyGenResult.sk.W.join(', ')})</strong>
                          </div>
                          <div>
                            <span className="font-sans text-slate-600">Mô-đun q &amp; Số nhân r: </span>
                            q = <strong>{keyGenResult.sk.q}</strong>, r = <strong>{keyGenResult.sk.r}</strong>
                          </div>
                          <div>
                            <span className="font-sans text-slate-600">Nghịch đảo u = r⁻¹ mod q: </span>
                            <strong>u = {keyGenResult.sk.u}</strong>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Kiểm chứng: {keyGenResult.sk.r} × {keyGenResult.sk.u} ={' '}
                            {keyGenResult.sk.r * keyGenResult.sk.u} ≡ 1 (mod {keyGenResult.sk.q})
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Table of B_i calculations */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-slate-900">
                        Bảng tính chi tiết từng phần tử khóa công khai Bᵢ = (r × Wᵢ) mod q:
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-300 text-xs font-mono tabular-nums">
                          <thead>
                            <tr className="border-b border-slate-300 bg-slate-100 font-sans text-slate-800">
                              <th className="border-r border-slate-300 px-3 py-1.5 text-center">Vị trí i</th>
                              <th className="border-r border-slate-300 px-3 py-1.5 text-right">Wᵢ (Bí mật)</th>
                              <th className="border-r border-slate-300 px-3 py-1.5 text-right">
                                r × Wᵢ ({keyGenResult.sk.r} × Wᵢ)
                              </th>
                              <th className="border-r border-slate-300 px-3 py-1.5 text-left">
                                Phép chia lấy dư cho q = {keyGenResult.sk.q}
                              </th>
                              <th className="px-3 py-1.5 text-right">Bᵢ (Công khai)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {keyGenResult.bTable.map((row) => (
                              <tr key={row.index}>
                                <td className="border-r border-slate-200 px-3 py-1.5 text-center font-semibold">
                                  {row.index}
                                </td>
                                <td className="border-r border-slate-200 px-3 py-1.5 text-right">
                                  {row.w_i}
                                </td>
                                <td className="border-r border-slate-200 px-3 py-1.5 text-right">
                                  {row.product}
                                </td>
                                <td className="border-r border-slate-200 px-3 py-1.5 text-left">
                                  {row.product} = {Math.floor(row.product / row.q)} × {row.q} + {row.b_i}
                                </td>
                                <td className="px-3 py-1.5 text-right font-bold text-slate-900">
                                  {row.b_i}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t border-slate-300 bg-slate-50 font-bold">
                              <td colSpan={4} className="border-r border-slate-300 px-3 py-1.5 font-sans text-right">
                                Tổng khóa công khai T = ΣBᵢ
                              </td>
                              <td className="px-3 py-1.5 text-right">{keyGenResult.pk.T}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>

            <TraceTablePanel
              title="Bảng quá trình tính toán Tạo khóa (Key Generation Trace Table)"
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
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-300 pb-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Màn hình 2: Ký văn bản M bằng Khóa bí mật sk (Yêu cầu c)
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Đóng gói <span className="font-mono">frame(M, k)</span>, băm SHA-256 lấy modulo{' '}
                  <span className="font-mono">T + 1 = {(keyGenResult.pk?.T ?? 220) + 1}</span> để được{' '}
                  <span className="font-mono">yₖ</span>, tính mục tiêu cửa sập{' '}
                  <span className="font-mono">t = (u × yₖ) mod q</span>, giải tham lam trên{' '}
                  <span className="font-mono">W</span> và đối chiếu lại tổng công khai{' '}
                  <span className="font-mono">ΣBᵢxᵢ == yₖ</span>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSignText('Tôi đồng ý');
                    bumpRevision();
                  }}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Đặt M = &quot;Tôi đồng ý&quot; (15 bytes)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left Column: Message Input & Sign Controls */}
              <section
                aria-label="Nhập văn bản cần ký"
                className="border border-slate-300 bg-white p-5 lg:col-span-5 space-y-4"
              >
                <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  1. Dữ liệu văn bản M &amp; Khóa hiện hành
                </h2>

                <div>
                  <label htmlFor="sign-message-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nội dung văn bản cần ký (M)
                  </label>
                  <textarea
                    id="sign-message-input"
                    rows={3}
                    value={signText}
                    onChange={(e) => {
                      setSignText(e.target.value);
                      bumpRevision();
                    }}
                    className="w-full border border-slate-300 p-3 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                  <div className="mt-1.5 flex flex-wrap items-center justify-between text-xs font-mono text-slate-600 tabular-nums">
                    <span>Độ dài UTF-8: <strong>{signUtf8Info.length} bytes</strong></span>
                    <span>Giới hạn thử k: 0 .. {Number(maxCounterInput) - 1}</span>
                  </div>
                  <div className="mt-1 border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] text-slate-700 break-all">
                    UTF-8 Bytes (Hex): {signUtf8Info.hex || '(Chuỗi rỗng)'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label htmlFor="max-counter-input" className="block font-semibold text-slate-700 mb-1">
                      Giới hạn lượt thử bộ đếm (k_max)
                    </label>
                    <input
                      id="max-counter-input"
                      type="text"
                      value={maxCounterInput}
                      onChange={(e) => {
                        setMaxCounterInput(e.target.value);
                        bumpRevision();
                      }}
                      className="w-full border border-slate-300 px-3 py-1.5 font-mono tabular-nums"
                    />
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] tabular-nums">
                    <div>Khóa sk: W=({keyGenResult.sk?.W.join(',')})</div>
                    <div>q={keyGenResult.sk?.q}, r={keyGenResult.sk?.r}, u={keyGenResult.sk?.u}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRunSign()}
                    className="bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    Thực hiện Ký văn bản M
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunSign({ simulateCancelAt: 1 })}
                    className="border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    Mô phỏng Hủy (CANCELLED)
                  </button>
                  {signResult?.signature && signResult.status === 'VALID' && (
                    <>
                      <button
                        type="button"
                        onClick={handleSendToVerify}
                        className="border border-slate-900 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                      >
                        Chuyển (M, pk, σ) sang Xác minh →
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          triggerFileDownload(
                            `mhk_signature_k${signResult.signature!.k}.json`,
                            serializeSignatureJson(signResult.signature!, keyGenResult.pk, signText)
                          )
                        }
                        className="border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                      >
                        Xuất chữ ký JSON
                      </button>
                    </>
                  )}
                </div>
              </section>

              {/* Right Column: Signature Result & Counter Trial Table */}
              <section
                aria-label="Kết quả chữ ký và bảng giải trình bộ đếm"
                className="border border-slate-300 bg-white p-5 lg:col-span-7 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    2. Kết quả Chữ ký σ &amp; Bảng thử bộ đếm k
                  </h2>
                  {signResult && (
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      Trạng thái: {signResult.status}
                    </span>
                  )}
                </div>

                {signResult && (
                  <>
                    <div
                      className={`border border-black p-3 text-xs ${
                        signResult.status === 'VALID'
                          ? 'bg-white text-black'
                          : 'bg-neutral-100 text-black font-bold'
                      }`}
                    >
                      {signResult.message}
                    </div>

                    {signResult.signature && (
                      <div className="border border-black p-3.5 space-y-1.5 font-mono text-xs tabular-nums">
                        <div className="font-sans font-bold uppercase text-black border-b border-black pb-1">
                          Gói chữ ký điện tử σ (Không chứa W, q, r, u)
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
                          <div>
                            <span className="font-sans text-slate-700">Bộ đếm thành công: </span>
                            <strong>k = {signResult.signature.k}</strong>
                          </div>
                          <div>
                            <span className="font-sans text-slate-700">Vector nhị phân x: </span>
                            <strong>x = ({signResult.signature.x.join(', ')})</strong>
                          </div>
                          <div>
                            <span className="font-sans text-slate-700">Mục tiêu đại diện: </span>
                            <strong>
                              y<sub>{signResult.signature.k}</sub> = {signResult.signature.y_k}
                            </strong>
                          </div>
                          <div>
                            <span className="font-sans text-slate-700">Tự xác minh (Self-Verify): </span>
                            <strong>{signResult.selfVerifyStatus}</strong>
                          </div>
                        </div>
                        <div className="pt-1 text-[11px] break-all text-slate-800">
                          <span className="font-sans font-semibold">SHA-256(frame): </span>
                          {signResult.signature.sha256_hex}
                        </div>
                      </div>
                    )}

                    {/* Counter Trials Table */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-slate-900">
                        Bảng giải trình các lượt thử bộ đếm k (Đã thử {signResult.trials.length} lượt):
                      </h3>
                      <div className="overflow-x-auto max-h-80">
                        <table className="w-full border-collapse border border-slate-300 text-xs font-mono tabular-nums">
                          <thead>
                            <tr className="border-b border-slate-300 bg-slate-100 font-sans text-slate-800">
                              <th className="border-r border-slate-300 px-2.5 py-1.5 text-center">k</th>
                              <th className="border-r border-slate-300 px-2.5 py-1.5 text-right">yₖ</th>
                              <th className="border-r border-slate-300 px-2.5 py-1.5 text-right">
                                t = u×yₖ mod q
                              </th>
                              <th className="border-r border-slate-300 px-2.5 py-1.5 text-center">
                                Nghiệm tham lam x
                              </th>
                              <th className="border-r border-slate-300 px-2.5 py-1.5 text-right">Dư trên W</th>
                              <th className="border-r border-slate-300 px-2.5 py-1.5 text-right">
                                ΣBᵢxᵢ (Công khai)
                              </th>
                              <th className="px-2.5 py-1.5 text-left">Quyết định &amp; Lý do</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {signResult.trials.slice(0, 30).map((tr) => (
                              <tr
                                key={tr.k}
                                className={
                                  tr.accepted ? 'bg-neutral-100 font-bold text-black' : 'bg-white text-black'
                                }
                              >
                                <td className="border-r border-slate-200 px-2.5 py-1.5 text-center">{tr.k}</td>
                                <td className="border-r border-slate-200 px-2.5 py-1.5 text-right">{tr.y_k}</td>
                                <td className="border-r border-slate-200 px-2.5 py-1.5 text-right">{tr.t}</td>
                                <td className="border-r border-slate-200 px-2.5 py-1.5 text-center">
                                  ({tr.x.join(', ')})
                                </td>
                                <td className="border-r border-slate-200 px-2.5 py-1.5 text-right">
                                  {tr.greedyRemainder}
                                </td>
                                <td className="border-r border-slate-200 px-2.5 py-1.5 text-right">
                                  {tr.publicSumV}
                                </td>
                                <td className="px-2.5 py-1.5 font-sans text-[11px]">{tr.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>

            {signResult && (
              <TraceTablePanel
                title="Bảng quá trình tính toán Ký văn bản (Signing Trace Table)"
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
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-300 pb-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Màn hình 3: Xác minh chữ ký công khai độc lập (Yêu cầu d)
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Người kiểm tra chỉ sử dụng văn bản <span className="font-mono">M</span>, khóa công khai{' '}
                  <span className="font-mono">B</span> và chữ ký <span className="font-mono">σ = (k, x)</span> (hoàn toàn không cần biết{' '}
                  <span className="font-mono">W, q, r, u</span>). Hệ thống tính lại đại diện{' '}
                  <span className="font-mono">yₖ</span>, cộng tổng <span className="font-mono">v = ΣBᵢxᵢ</span> và so sánh{' '}
                  <span className="font-mono">v == yₖ</span>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadPresetById('tc1-standard')}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Ca hợp lệ chuẩn (v=y₂=56)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetById('tc3-tampered-message')}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Thử sửa văn bản M (TC3: y₂=65≠56)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetById('tc4-tampered-signature')}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Thử sửa bit x₁=0 (TC4: v=22≠56)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPresetById('tc5-forgery-counterexample')}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Phản ví dụ giả mạo k=123 (v=y₁₂₃=114)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left Column: Public Verification Inputs */}
              <section
                aria-label="Nhập dữ liệu xác minh chữ ký"
                className="border border-slate-300 bg-white p-5 lg:col-span-5 space-y-4"
              >
                <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  1. Dữ liệu công khai người kiểm tra nhận được
                </h2>

                <div className="space-y-3 text-sm">
                  <div>
                    <label htmlFor="verify-msg-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Văn bản cần kiểm tra (M)
                    </label>
                    <textarea
                      id="verify-msg-input"
                      rows={2}
                      value={verifyMessage}
                      onChange={(e) => {
                        setVerifyMessage(e.target.value);
                        bumpRevision();
                      }}
                      className="w-full border border-slate-300 p-2.5 font-mono text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="verify-b-input" className="block text-xs font-semibold text-slate-700 mb-1">
                      Khóa công khai B = (B₁, B₂, ..., Bₙ)
                    </label>
                    <input
                      id="verify-b-input"
                      type="text"
                      value={verifyB}
                      onChange={(e) => {
                        setVerifyB(e.target.value);
                        bumpRevision();
                      }}
                      className="w-full border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
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
                        className="w-full border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
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
                        className="w-full border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRunVerify()}
                    className="bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    Kiểm tra Xác thực Chữ ký
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
                    className="border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    Thử lỗi định dạng x=(2,0,0,0,1)
                  </button>
                </div>

                {/* JSON Import Area */}
                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <label htmlFor="json-import-box" className="block text-xs font-semibold text-slate-700">
                    Nhập gói dữ liệu xác thực từ JSON (Infrastructure Layer):
                  </label>
                  <textarea
                    id="json-import-box"
                    rows={3}
                    value={jsonImportText}
                    onChange={(e) => setJsonImportText(e.target.value)}
                    placeholder='Dán nội dung tệp JSON (chứa message, public_key, signature) vào đây...'
                    className="w-full border border-slate-300 p-2 font-mono text-xs focus:border-slate-900 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleImportJsonBundle}
                      className="border border-slate-900 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 whitespace-nowrap shrink-0"
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
                        className="border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
                      >
                        Điền mẫu JSON vừa ký
                      </button>
                    )}
                  </div>
                  {jsonImportBanner && (
                    <div className="border border-slate-300 bg-slate-50 p-2 text-xs text-slate-800">
                      {jsonImportBanner}
                    </div>
                  )}
                </div>
              </section>

              {/* Right Column: Verification Comparison Output */}
              <section
                aria-label="Kết quả đối chiếu xác thực"
                className="border border-slate-300 bg-white p-5 lg:col-span-7 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    2. Kết quả Đối chiếu Đại diện yₖ và Tổng chữ ký v
                  </h2>
                  {verifyResult && (
                    <span className="font-mono text-xs font-bold text-slate-900">
                      Trạng thái: {verifyResult.status}
                    </span>
                  )}
                </div>

                {verifyResult && (
                  <>
                    <div
                      className={`border border-black p-3.5 text-xs ${
                        verifyResult.status === 'VALID'
                          ? 'bg-white text-black'
                          : 'bg-neutral-100 text-black font-bold'
                      }`}
                    >
                      <div className="font-bold text-sm">
                        Kết luận xác thực: [{STATUS_DESCRIPTIONS[verifyResult.status].label}]
                      </div>
                      <p className="mt-1">{verifyResult.message}</p>
                    </div>

                    {verifyResult.y_k !== undefined && verifyResult.v !== undefined && (
                      <>
                        {/* Comparison Summary Table (Matches Page 6 of Guide) */}
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-black text-xs font-mono tabular-nums">
                            <thead>
                              <tr className="border-b border-black bg-neutral-100 font-sans text-black">
                                <th className="border-r border-black px-3 py-2 text-left">Phía tính toán</th>
                                <th className="border-r border-black px-3 py-2 text-left">Đầu vào sử dụng</th>
                                <th className="px-3 py-2 text-right">Kết quả</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black">
                              <tr>
                                <td className="border-r border-black px-3 py-2 font-sans font-semibold">
                                  Đại diện văn bản (yₖ)
                                </td>
                                <td className="border-r border-black px-3 py-2">
                                  M ({verifyResult.mByteLength} bytes UTF-8) và k = {verifyResult.k} theo SHA-256 mod{' '}
                                  {(verifyResult.T ?? 220) + 1}
                                </td>
                                <td className="px-3 py-2 text-right font-bold">
                                  y<sub>{verifyResult.k}</sub> = {verifyResult.y_k}
                                </td>
                              </tr>
                              <tr>
                                <td className="border-r border-slate-200 px-3 py-2 font-sans font-semibold">
                                  Tổng chữ ký công khai (v)
                                </td>
                                <td className="border-r border-slate-200 px-3 py-2">
                                  B = ({verifyB}), x = ({verifyResult.x?.join(', ')})
                                </td>
                                <td className="px-3 py-2 text-right font-bold">
                                  v = {verifyResult.v}
                                </td>
                              </tr>
                              <tr className="bg-slate-50 font-bold">
                                <td className="border-r border-slate-300 px-3 py-2 font-sans">
                                  So sánh đối chiếu (v với yₖ)
                                </td>
                                <td className="border-r border-slate-300 px-3 py-2">
                                  {verifyResult.v} {verifyResult.v === verifyResult.y_k ? '==' : '≠'} {verifyResult.y_k}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {verifyResult.status}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Bitwise contribution breakdown */}
                        {verifyResult.bitContributions && (
                          <div className="space-y-1.5">
                            <h3 className="text-xs font-semibold text-slate-900">
                              Bảng chi tiết đóng góp từng vị trí bit (v = Σ Bᵢ × xᵢ):
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-slate-300 text-xs font-mono tabular-nums text-center">
                                <thead>
                                  <tr className="border-b border-slate-300 bg-slate-100 font-sans">
                                    <th className="border-r border-slate-300 px-2.5 py-1.5">Vị trí i</th>
                                    <th className="border-r border-slate-300 px-2.5 py-1.5">Phần tử công khai Bᵢ</th>
                                    <th className="border-r border-slate-300 px-2.5 py-1.5">Bit chữ ký xᵢ</th>
                                    <th className="px-2.5 py-1.5">Đóng góp (Bᵢ × xᵢ)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {verifyResult.bitContributions.map((row) => (
                                    <tr key={row.index} className={row.x_i === 1 ? 'font-semibold bg-slate-50/70' : ''}>
                                      <td className="border-r border-slate-200 px-2.5 py-1">{row.index}</td>
                                      <td className="border-r border-slate-200 px-2.5 py-1">{row.b_i}</td>
                                      <td className="border-r border-slate-200 px-2.5 py-1">{row.x_i}</td>
                                      <td className="px-2.5 py-1">{row.contribution}</td>
                                    </tr>
                                  ))}
                                  <tr className="border-t border-slate-300 bg-slate-100 font-bold">
                                    <td colSpan={3} className="border-r border-slate-300 px-2.5 py-1.5 font-sans text-right">
                                      Tổng v = Σ Bᵢxᵢ
                                    </td>
                                    <td className="px-2.5 py-1.5">{verifyResult.v}</td>
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
              </section>
            </div>

            {verifyResult && (
              <TraceTablePanel
                title="Bảng quá trình tính toán Xác minh (Public Verification Trace Table)"
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
          <div className="space-y-8">
            <div className="border-b border-slate-300 pb-3">
              <h1 className="text-xl font-bold text-slate-900">
                Màn hình 4: Bộ kịch bản Kiểm thử (Test Cases 1–4), Phản ví dụ Bảo mật &amp; Mã nguồn Python 4 tầng
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Chọn bất kỳ kịch bản nào dưới đây để nạp trực tiếp vào các màn hình tính toán, hoặc xem kết quả chạy tự động toàn bộ Test Cases và mã nguồn Python 4 tầng dùng cho Chương 3 của báo cáo.
              </p>
            </div>

            {/* Automated Test Cases Execution Matrix */}
            <section
              aria-label="Kết quả chạy tự động các kịch bản kiểm thử"
              className="border border-slate-300 bg-white p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    1. Bảng kết quả thực thi tự động Kịch bản chạy thử nghiệm (Mục 3.5 Báo cáo)
                  </h2>
                  <p className="text-xs text-slate-600">
                    Tất cả phép tính đều được kiểm chứng trực tiếp bằng lõi toán học MHK (Domain Layer).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteAllTests}
                  className="bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  Chạy lại toàn bộ Test Cases
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100 text-slate-800">
                      <th className="border-r border-slate-300 px-3 py-2 text-left">Mã TC</th>
                      <th className="border-r border-slate-300 px-3 py-2 text-left">Tên kịch bản</th>
                      <th className="border-r border-slate-300 px-3 py-2 text-left">Đầu vào kiểm thử</th>
                      <th className="border-r border-slate-300 px-3 py-2 text-center">Trạng thái kỳ vọng</th>
                      <th className="border-r border-slate-300 px-3 py-2 text-center">Trạng thái thực tế</th>
                      <th className="border-r border-slate-300 px-3 py-2 text-left">Chi tiết đo kiểm</th>
                      <th className="px-3 py-2 text-center">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {testSuiteReports.map((rep) => (
                      <tr key={rep.id}>
                        <td className="border-r border-slate-200 px-3 py-2 font-mono font-bold">{rep.code}</td>
                        <td className="border-r border-slate-200 px-3 py-2 font-semibold">{rep.title}</td>
                        <td className="border-r border-slate-200 px-3 py-2 font-mono text-[11px]">
                          {rep.inputSummary}
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2 text-center font-mono">
                          {rep.expectedStatus}
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2 text-center font-mono font-bold">
                          {rep.actualStatus}
                        </td>
                        <td className="border-r border-slate-200 px-3 py-2 text-[11px]">
                          {rep.measuredDetails}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-black">
                          {rep.passed ? '[PASS / ĐẠT]' : '[FAIL]'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Interactive Preset Cards */}
            <section aria-label="Danh sách bộ dữ liệu mẫu" className="space-y-3">
              <h2 className="text-base font-bold text-slate-900">
                2. Nạp nhanh các Bộ dữ liệu mẫu lên Giao diện
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {ACADEMIC_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="border border-slate-300 bg-white p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                        <span className="font-bold text-slate-900">{preset.code}</span>
                        <span>Trạng thái mẫu: {preset.expectedOutcome.status}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{preset.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{preset.description}</p>
                      <div className="border-t border-slate-200 pt-2 text-[11px] font-mono text-slate-700">
                        Kết quả: {preset.expectedOutcome.summary}
                      </div>
                    </div>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleLoadPreset(preset)}
                        className="border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                      >
                        Nạp kịch bản &amp; Mở màn hình tương ứng →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Python 4-Tier Reference Code Viewer */}
            <section
              aria-label="Mã nguồn Python 4 tầng"
              className="border border-slate-300 bg-white p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    3. Mã nguồn Python &amp; PySide6 theo Kiến trúc 4 tầng (Dùng cho Mục 3.2 Báo cáo)
                  </h2>
                  <p className="text-xs text-slate-600">
                    Đã kiểm thử độc lập bằng <code className="font-mono">unittest</code> khớp 100% với đặc tả v2.0.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {PYTHON_SOURCE_FILES.map((file, idx) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => setSelectedPythonFileIdx(idx)}
                      className={`border px-3 py-1.5 text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                        selectedPythonFileIdx === idx
                          ? 'border-slate-900 bg-slate-900 font-semibold text-white'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {file.path}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-3">
                  <div className="border border-slate-300 bg-slate-50 p-3">
                    <div className="text-xs font-bold text-slate-900 mb-1">
                      Cấu trúc thư mục dự án Python:
                    </div>
                    <pre className="font-mono text-[11px] text-slate-800 overflow-x-auto">
                      {PYTHON_PROJECT_TREE}
                    </pre>
                  </div>
                  <div className="border border-slate-300 p-3 space-y-2 text-xs">
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
                  <div className="border border-slate-300 bg-slate-900 text-slate-100 p-4">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3 text-xs font-mono">
                      <span>{PYTHON_SOURCE_FILES[selectedPythonFileIdx].title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          triggerFileDownload(
                            PYTHON_SOURCE_FILES[selectedPythonFileIdx].path.replace('/', '_'),
                            PYTHON_SOURCE_FILES[selectedPythonFileIdx].code,
                            'text/x-python;charset=utf-8'
                          )
                        }
                        className="border border-slate-500 px-2.5 py-1 text-xs text-white hover:bg-slate-800"
                      >
                        Tải tệp .py
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

      {/* Quiet Academic Footer */}
      <footer className="border-t border-slate-300 bg-white px-6 py-4 text-xs text-slate-600 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            Trường Công nghệ – Đại học Kinh tế Quốc dân · Khoa Công nghệ Thông tin · Học phần An toàn và Bảo mật thông tin
          </div>
          <div>
            Hồ sơ minh họa học thuật: <span className="font-mono">mhk-demo-preimage-v1</span> (01/10/2026 – 30/11/2026)
          </div>
        </div>
      </footer>
    </div>
  );
}
