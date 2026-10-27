import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Ban,
  ShieldAlert,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { TraceStep, ResultStatus } from '../domain/mhkCrypto';

interface TraceTablePanelProps {
  title?: string;
  steps: TraceStep[];
  status?: ResultStatus;
  isStale?: boolean;
  snapshotRevision?: number;
  currentRevision?: number;
}

export const STATUS_DESCRIPTIONS: Record<
  ResultStatus,
  {
    label: string;
    shortBadge: string;
    meaning: string;
    action: string;
    tone: 'emerald' | 'rose' | 'amber' | 'slate';
  }
> = {
  VALID: {
    label: 'VALID — Xác thực Toán học Hợp lệ (mhk-demo-preimage-v1)',
    shortBadge: 'VALID · ĐẠT CHUẨN',
    meaning: 'Quan hệ toán học của hồ sơ mhk-demo-preimage-v1 khớp tuyệt đối (Σ Bᵢxᵢ == yₖ).',
    action: 'Chứng thư/chữ ký đủ điều kiện lưu trữ JSON hoặc chuyển sang cổng kiểm định độc lập.',
    tone: 'emerald',
  },
  INVALID: {
    label: 'INVALID — Không Khớp Toán học (Từ chối Xác thực)',
    shortBadge: 'INVALID · TỪ CHỐI',
    meaning: 'Cấu trúc gói tin hợp lệ nhưng tổng công khai v = Σ Bᵢxᵢ khác đại diện băm yₖ.',
    action: 'Cảnh báo: Nội dung chứng từ M hoặc vector chữ ký x đã bị sửa đổi sau khi ký.',
    tone: 'rose',
  },
  FORMAT_ERROR: {
    label: 'FORMAT_ERROR — Vi phạm Điều kiện Tham số / Định dạng',
    shortBadge: 'FORMAT_ERROR · LỖI MIỀN',
    meaning: 'Dữ liệu đầu vào sai kiểu nguyên, sai độ dài n, hoặc vi phạm điều kiện siêu tăng / nguyên tố cùng nhau.',
    action: 'Kiểm tra lại trường bị đánh dấu đỏ trong biểu mẫu và thực thi lại.',
    tone: 'amber',
  },
  NOT_FOUND: {
    label: 'NOT_FOUND — Chưa Tìm Được Nghiệm Trong Giới Hạn Bộ Đếm',
    shortBadge: 'NOT_FOUND · HẾT LƯỢT',
    meaning: 'Đã quét hết giới hạn bộ đếm k (4096 lượt) mà chưa tìm được nghiệm tham lam khớp tổng công khai.',
    action: 'Thử lại với bộ tham số khóa (W, q, r) khác hoặc tăng giới hạn k_max.',
    tone: 'slate',
  },
  TIME_LIMIT: {
    label: 'TIME_LIMIT — Vượt Ngưỡng Thời Gian Xử Lý',
    shortBadge: 'TIME_LIMIT · QUÁ GIỜ',
    meaning: 'Tác vụ ký vượt quá thời gian cho phép trước khi tìm thấy bộ đếm k thỏa mãn.',
    action: 'Thực thi lại tác vụ hoặc kiểm tra cấu hình giới hạn.',
    tone: 'amber',
  },
  CANCELLED: {
    label: 'CANCELLED — Người Dùng Chủ Động Hủy Tác Vụ',
    shortBadge: 'CANCELLED · ĐÃ HỦY',
    meaning: 'Tác vụ tìm kiếm bộ đếm k đã bị dừng theo lệnh hủy của người vận hành.',
    action: 'Chưa sinh chữ ký hoàn tất; bấm Thực hiện Ký số lại khi sẵn sàng.',
    tone: 'slate',
  },
  UNSUPPORTED_PROFILE: {
    label: 'UNSUPPORTED_PROFILE — Hồ Sơ Thuật Toán Không Hỗ Trợ',
    shortBadge: 'UNSUPPORTED_PROFILE',
    meaning: 'Nhãn định danh algorithm_id không thuộc chuẩn mhk-demo-preimage-v1 của hệ thống.',
    action: 'Chuyển hồ sơ về mhk-demo-preimage-v1 trước khi tạo khóa hoặc xác minh.',
    tone: 'amber',
  },
};

export const TraceTablePanel: React.FC<TraceTablePanelProps> = ({
  title = 'Nhật ký Giải trình Toán học Từng bước (Cryptographic Audit Trace)',
  steps,
  status,
  isStale = false,
  snapshotRevision,
  currentRevision,
}) => {
  const getStatusBannerStyle = (st: ResultStatus) => {
    const tone = STATUS_DESCRIPTIONS[st].tone;
    if (tone === 'emerald') {
      return 'border-emerald-200 bg-emerald-50/90 text-emerald-950';
    }
    if (tone === 'rose') {
      return 'border-rose-200 bg-rose-50/90 text-rose-950';
    }
    if (tone === 'amber') {
      return 'border-amber-200 bg-amber-50/90 text-amber-950';
    }
    return 'border-slate-300 bg-slate-100 text-slate-900';
  };

  const getStatusIcon = (st: ResultStatus) => {
    const tone = STATUS_DESCRIPTIONS[st].tone;
    if (tone === 'emerald') return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
    if (tone === 'rose') return <XCircle className="h-4 w-4 text-rose-600 shrink-0" />;
    if (st === 'TIME_LIMIT') return <Clock className="h-4 w-4 text-amber-600 shrink-0" />;
    if (st === 'CANCELLED') return <Ban className="h-4 w-4 text-slate-600 shrink-0" />;
    if (st === 'UNSUPPORTED_PROFILE') return <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />;
    return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
  };

  return (
    <section
      aria-label={title}
      className="rounded-lg border border-slate-300 bg-white shadow-xs overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-900 px-5 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-4 w-4 text-sky-400 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
            <p className="text-[11px] text-slate-300">
              Audit Log 6 cột chuẩn hóa: Bước · Giai đoạn · Biểu thức toán học · Đầu vào · Kết quả · Nguyên nhân quyết định
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          {snapshotRevision !== undefined && (
            <span className="rounded bg-slate-800 px-2.5 py-1 text-slate-200 border border-slate-700">
              Snapshot Rev #{snapshotRevision}
              {currentRevision !== undefined && currentRevision !== snapshotRevision
                ? ` → Hiện tại Rev #${currentRevision}`
                : ''}
            </span>
          )}
          {isStale ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-amber-500/20 border border-amber-400/50 px-2.5 py-1 font-sans text-xs font-semibold text-amber-200">
              <RefreshCw className="h-3.5 w-3.5" />
              Dữ liệu đầu vào đã thay đổi — Cần bấm tính lại
            </span>
          ) : (
            steps.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 font-sans text-xs font-medium text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Đồng bộ bản chụp hiện hành
              </span>
            )
          )}
        </div>
      </div>

      {/* Status Summary Bar */}
      {status && (
        <div className={`border-b px-5 py-3 text-xs ${getStatusBannerStyle(status)}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {getStatusIcon(status)}
            <span className="font-bold uppercase tracking-wide">
              {STATUS_DESCRIPTIONS[status].shortBadge}
            </span>
            <span aria-hidden="true" className="opacity-50">|</span>
            <span className="font-medium">{STATUS_DESCRIPTIONS[status].meaning}</span>
            <span aria-hidden="true" className="opacity-50">·</span>
            <span className="opacity-90">
              <strong>Khuyến nghị vận hành:</strong> {STATUS_DESCRIPTIONS[status].action}
            </span>
          </div>
        </div>
      )}

      {/* 6-Column Trace Table */}
      {steps.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Chưa có nhật ký quá trình tính toán. Hãy bấm nút thực thi trên màn hình để ghi nhận giải trình từng bước.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-900">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100/90 text-[11px] uppercase tracking-wider text-slate-700">
                <th className="w-14 border-r border-slate-200 px-3 py-2.5 text-center font-bold tabular-nums">
                  Bước
                </th>
                <th className="w-44 border-r border-slate-200 px-3.5 py-2.5 font-bold">
                  Giai đoạn xử lý
                </th>
                <th className="w-56 border-r border-slate-200 px-3.5 py-2.5 font-bold">
                  Biểu thức toán học
                </th>
                <th className="w-52 border-r border-slate-200 px-3.5 py-2.5 font-bold">
                  Tham số đầu vào
                </th>
                <th className="w-44 border-r border-slate-200 px-3.5 py-2.5 font-bold">
                  Kết quả trung gian
                </th>
                <th className="px-3.5 py-2.5 font-bold">
                  Nguyên nhân quyết định &amp; Kiểm chứng
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
              {steps.map((step) => {
                const rowStyle =
                  step.status === 'error'
                    ? 'bg-rose-50/75 text-rose-950 font-semibold'
                    : step.status === 'highlight'
                    ? 'bg-emerald-50/70 text-slate-950 font-semibold'
                    : 'bg-white text-slate-800 hover:bg-slate-50/80';

                const stepBadgeStyle =
                  step.status === 'error'
                    ? 'bg-rose-600 text-white'
                    : step.status === 'highlight'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-800';

                return (
                  <tr key={step.stepNumber} className={`transition-colors ${rowStyle}`}>
                    <td className="border-r border-slate-200 px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[11px] font-bold ${stepBadgeStyle}`}
                      >
                        {step.stepNumber}
                      </span>
                    </td>
                    <td className="border-r border-slate-200 px-3.5 py-2.5 font-sans font-semibold text-slate-900">
                      {step.stage}
                    </td>
                    <td className="border-r border-slate-200 px-3.5 py-2.5 text-slate-700">
                      {step.expression}
                    </td>
                    <td className="border-r border-slate-200 px-3.5 py-2.5 break-all text-slate-700">
                      {step.inputSummary}
                    </td>
                    <td className="border-r border-slate-200 px-3.5 py-2.5 font-bold text-slate-950">
                      {step.outputSummary}
                    </td>
                    <td className="px-3.5 py-2.5 font-sans leading-relaxed">
                      {step.decisionReason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
