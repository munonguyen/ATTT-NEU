import React from 'react';
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
  { label: string; meaning: string; action: string }
> = {
  VALID: {
    label: 'VALID (Hợp lệ theo profile demo)',
    meaning: 'Quan hệ toán học của hồ sơ mhk-demo-preimage-v1 khớp hoàn toàn.',
    action: 'Đọc thêm nhãn demo và kiểm tra độc lập độ tin cậy của khóa công khai.',
  },
  INVALID: {
    label: 'INVALID (Không khớp toán học)',
    meaning: 'Dữ liệu đọc được đúng cấu trúc nhưng tổng công khai v ≠ đại diện băm y_k.',
    action: 'Kiểm tra lại nội dung văn bản M, vector chữ ký x, bộ đếm k và khóa công khai B.',
  },
  FORMAT_ERROR: {
    label: 'FORMAT_ERROR (Lỗi định dạng / điều kiện)',
    meaning: 'Dữ liệu không đúng cấu trúc, sai kiểu số nguyên hoặc vi phạm điều kiện miền MHK.',
    action: 'Sửa trường dữ liệu bị báo lỗi định dạng rồi thực hiện tính lại.',
  },
  NOT_FOUND: {
    label: 'NOT_FOUND (Chưa tìm được nghiệm)',
    meaning: 'Đã thử hết giới hạn bộ đếm k (4096 lượt) mà chưa tìm được nghiệm thỏa mãn.',
    action: 'Không coi là văn bản giả mạo; thử bộ khóa khác hoặc điều chỉnh văn bản.',
  },
  TIME_LIMIT: {
    label: 'TIME_LIMIT (Quá thời gian xử lý)',
    meaning: 'Tác vụ ký vượt quá giới hạn thời gian cho phép trước khi tìm thấy nghiệm.',
    action: 'Chưa có chữ ký hoàn tất để xuất; thử lại hoặc giảm phạm vi.',
  },
  CANCELLED: {
    label: 'CANCELLED (Đã hủy tác vụ)',
    meaning: 'Người dùng đã chủ động bấm hủy trong khi vòng lặp bộ đếm đang chạy.',
    action: 'Chưa có chữ ký hoàn tất để xuất; bấm Ký lại khi sẵn sàng.',
  },
  UNSUPPORTED_PROFILE: {
    label: 'UNSUPPORTED_PROFILE (Hồ sơ không hỗ trợ)',
    meaning: 'Nhãn algorithm_id không khớp với hồ sơ mhk-demo-preimage-v1 của hệ thống.',
    action: 'Chọn đúng hồ sơ mhk-demo-preimage-v1 và định dạng tệp tương ứng.',
  },
};

export const TraceTablePanel: React.FC<TraceTablePanelProps> = ({
  title = 'Bảng quá trình tính toán (Trace Table)',
  steps,
  status,
  isStale = false,
  snapshotRevision,
  currentRevision,
}) => {
  return (
    <section
      aria-label={title}
      className="border border-slate-300 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300 bg-slate-50 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-600">
            Hiển thị tường minh từng bước, biểu thức, đầu vào, kết quả và nguyên nhân quyết định.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          {snapshotRevision !== undefined && (
            <span className="text-slate-600">
              Snapshot Rev #{snapshotRevision}
              {currentRevision !== undefined && currentRevision !== snapshotRevision
                ? ` / Hiện tại Rev #${currentRevision}`
                : ''}
            </span>
          )}
          {isStale ? (
            <span className="border border-black bg-white px-2 py-0.5 font-sans font-bold text-black underline">
              [Dữ liệu đã sửa — Kết quả cũ cần tính lại]
            </span>
          ) : (
            steps.length > 0 && (
              <span className="border border-black bg-white px-2 py-0.5 font-sans text-black">
                [Bản chụp hiện hành]
              </span>
            )
          )}
        </div>
      </div>

      {status && (
        <div className="border-b border-black bg-white px-4 py-2.5 text-xs text-black">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-bold text-black">Trạng thái kết quả:</span>
            <span className="font-mono font-bold text-black">
              [{STATUS_DESCRIPTIONS[status].label}]
            </span>
            <span aria-hidden="true">·</span>
            <span>{STATUS_DESCRIPTIONS[status].meaning}</span>
            <span aria-hidden="true">·</span>
            <span>Hướng xử lý: {STATUS_DESCRIPTIONS[status].action}</span>
          </div>
        </div>
      )}

      {steps.length === 0 ? (
        <div className="p-6 text-center text-sm text-black">
          Chưa có dữ liệu quá trình tính toán. Hãy bấm nút thực thi trên màn hình để xem giải trình từng bước.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-black">
            <thead>
              <tr className="border-b border-black bg-neutral-100 text-black">
                <th className="w-12 border-r border-black px-3 py-2 font-bold tabular-nums">
                  Bước
                </th>
                <th className="w-40 border-r border-black px-3 py-2 font-bold">
                  Giai đoạn
                </th>
                <th className="w-56 border-r border-black px-3 py-2 font-bold">
                  Biểu thức toán học
                </th>
                <th className="w-48 border-r border-black px-3 py-2 font-bold">
                  Đầu vào
                </th>
                <th className="w-44 border-r border-black px-3 py-2 font-bold">
                  Kết quả
                </th>
                <th className="px-3 py-2 font-bold">
                  Nguyên nhân quyết định
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black font-mono tabular-nums">
              {steps.map((step) => {
                const rowStyle =
                  step.status === 'error'
                    ? 'bg-white text-black font-bold'
                    : step.status === 'highlight'
                    ? 'bg-neutral-100 text-black font-bold'
                    : 'bg-white text-black';

                return (
                  <tr key={step.stepNumber} className={rowStyle}>
                    <td className="border-r border-black px-3 py-2 text-center font-bold">
                      {step.stepNumber}
                    </td>
                    <td className="border-r border-black px-3 py-2 font-sans font-medium">
                      {step.stage}
                    </td>
                    <td className="border-r border-black px-3 py-2">
                      {step.expression}
                    </td>
                    <td className="border-r border-black px-3 py-2 break-all">
                      {step.inputSummary}
                    </td>
                    <td className="border-r border-black px-3 py-2 font-bold">
                      {step.outputSummary}
                    </td>
                    <td className="px-3 py-2 font-sans leading-relaxed">
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
