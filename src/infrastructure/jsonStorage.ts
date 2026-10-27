/**
 * INFRASTRUCTURE LAYER: JSON Serialization, Schema Validation & File Export/Import
 * Ensures exported signatures never leak secret key material (W, q, r, u).
 */

import {
  PublicKey,
  SecretKey,
  SignaturePacket,
  SUPPORTED_PROFILE,
  MAX_COUNTER_LIMIT,
  ResultStatus,
} from '../domain/mhkCrypto';

export interface ExportedPublicBundle {
  schema: 'mhk-public-verification-bundle-v1';
  exported_at: string;
  algorithm_id: string;
  message: string;
  public_key: PublicKey;
  signature: SignaturePacket;
}

export interface ImportParseResult {
  status: ResultStatus;
  errorMessage?: string;
  message?: string;
  pk?: PublicKey;
  sk?: SecretKey;
  signature?: SignaturePacket;
}

export function serializeSignatureJson(sig: SignaturePacket, pk?: PublicKey, message?: string): string {
  // Strictly strip any secret fields if present; only output public signature schema
  const cleanSignature: SignaturePacket = {
    algorithm_id: sig.algorithm_id,
    format_version: sig.format_version || '1.0',
    mode: sig.mode || 'demo-preimage',
    key_id: sig.key_id,
    k: sig.k,
    x: [...sig.x],
    ...(sig.message_utf8_len !== undefined ? { message_utf8_len: sig.message_utf8_len } : {}),
    ...(sig.y_k !== undefined ? { y_k: sig.y_k } : {}),
    ...(sig.sha256_hex ? { sha256_hex: sig.sha256_hex } : {}),
  };

  if (pk && message !== undefined) {
    const bundle: ExportedPublicBundle = {
      schema: 'mhk-public-verification-bundle-v1',
      exported_at: new Date().toISOString(),
      algorithm_id: cleanSignature.algorithm_id,
      message,
      public_key: {
        algorithm_id: pk.algorithm_id,
        key_id: pk.key_id,
        n: pk.n,
        B: [...pk.B],
        T: pk.T,
      },
      signature: cleanSignature,
    };
    return JSON.stringify(bundle, null, 2);
  }

  return JSON.stringify(cleanSignature, null, 2);
}

export function serializePublicKeyJson(pk: PublicKey): string {
  return JSON.stringify(
    {
      schema: 'mhk-public-key-v1',
      algorithm_id: pk.algorithm_id,
      key_id: pk.key_id,
      n: pk.n,
      B: [...pk.B],
      T: pk.T,
    },
    null,
    2
  );
}

export function parseImportedJson(rawJson: string): ImportParseResult {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      status: 'FORMAT_ERROR',
      errorMessage: 'Tệp JSON không đúng cú pháp (JSON.parse thất bại → FORMAT_ERROR).',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      status: 'FORMAT_ERROR',
      errorMessage: 'Nội dung JSON phải là một đối tượng (Object).',
    };
  }

  const alg = (parsed.algorithm_id as string) ||
    ((parsed.signature as Record<string, unknown>)?.algorithm_id as string) ||
    ((parsed.public_key as Record<string, unknown>)?.algorithm_id as string);

  if (alg && alg !== SUPPORTED_PROFILE) {
    return {
      status: 'UNSUPPORTED_PROFILE',
      errorMessage: `Hồ sơ thuật toán "${alg}" trong tệp JSON không được hỗ trợ (yêu cầu "${SUPPORTED_PROFILE}").`,
    };
  }

  // Case 1: Full verification bundle
  if (parsed.public_key && parsed.signature) {
    const pkObj = parsed.public_key as Record<string, unknown>;
    const sigObj = parsed.signature as Record<string, unknown>;

    if (!Array.isArray(pkObj.B) || !Array.isArray(sigObj.x) || typeof sigObj.k !== 'number') {
      return {
        status: 'FORMAT_ERROR',
        errorMessage: 'Gói JSON thiếu trường B, k hoặc x hợp lệ (FORMAT_ERROR).',
      };
    }

    const B = pkObj.B.map(Number);
    const x = sigObj.x.map(Number);
    const k = Number(sigObj.k);

    if (
      B.some((v) => !Number.isInteger(v) || v <= 0) ||
      x.some((bit) => bit !== 0 && bit !== 1) ||
      B.length !== x.length ||
      !Number.isInteger(k) ||
      k < 0 ||
      k >= MAX_COUNTER_LIMIT
    ) {
      return {
        status: 'FORMAT_ERROR',
        errorMessage: 'Dữ liệu B, k hoặc x trong JSON vượt miền hoặc sai cấu trúc (FORMAT_ERROR).',
      };
    }

    const pk: PublicKey = {
      algorithm_id: SUPPORTED_PROFILE,
      key_id: String(pkObj.key_id || 'imported-key'),
      n: B.length,
      B,
      T: B.reduce((a, b) => a + b, 0),
    };

    const signature: SignaturePacket = {
      algorithm_id: SUPPORTED_PROFILE,
      format_version: String(sigObj.format_version || '1.0'),
      mode: String(sigObj.mode || 'demo-preimage'),
      key_id: String(sigObj.key_id || pk.key_id),
      k,
      x,
    };

    return {
      status: 'VALID',
      message: typeof parsed.message === 'string' ? parsed.message : undefined,
      pk,
      signature,
    };
  }

  // Case 2: Standalone Signature JSON
  if (Array.isArray(parsed.x) && typeof parsed.k === 'number') {
    const x = parsed.x.map(Number);
    const k = Number(parsed.k);
    if (
      x.some((bit) => bit !== 0 && bit !== 1) ||
      !Number.isInteger(k) ||
      k < 0 ||
      k >= MAX_COUNTER_LIMIT
    ) {
      return {
        status: 'FORMAT_ERROR',
        errorMessage: 'Chữ ký JSON chứa bit x ngoài {0,1} hoặc bộ đếm k ngoài [0, 4095].',
      };
    }
    return {
      status: 'VALID',
      signature: {
        algorithm_id: SUPPORTED_PROFILE,
        format_version: String(parsed.format_version || '1.0'),
        mode: String(parsed.mode || 'demo-preimage'),
        key_id: String(parsed.key_id || ''),
        k,
        x,
      },
    };
  }

  // Case 3: Standalone Public Key JSON
  if (Array.isArray(parsed.B)) {
    const B = parsed.B.map(Number);
    if (B.length < 2 || B.some((v) => !Number.isInteger(v) || v <= 0)) {
      return {
        status: 'FORMAT_ERROR',
        errorMessage: 'Khóa công khai B trong JSON không hợp lệ.',
      };
    }
    return {
      status: 'VALID',
      pk: {
        algorithm_id: SUPPORTED_PROFILE,
        key_id: String(parsed.key_id || 'imported-key'),
        n: B.length,
        B,
        T: B.reduce((a, b) => a + b, 0),
      },
    };
  }

  return {
    status: 'FORMAT_ERROR',
    errorMessage: 'Cấu trúc JSON không khớp định dạng khóa công khai hoặc chữ ký MHK.',
  };
}

export function triggerFileDownload(filename: string, content: string, mimeType: string = 'application/json;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
