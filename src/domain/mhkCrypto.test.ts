import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateKeys,
  signMessage,
  verifySignature,
  verifyFromRawInputs,
  computeFrameAndTarget,
  solveSuperincreasingGreedy,
  SUPPORTED_PROFILE,
} from './mhkCrypto';

test('TC1: Standard parameter validation and key generation (n=5, W=(2,3,7,14,30), q=61, r=17)', () => {
  const res = generateKeys({
    profile: SUPPORTED_PROFILE,
    nInput: 5,
    wInput: '2, 3, 7, 14, 30',
    qInput: 61,
    rInput: 17,
  });

  assert.equal(res.status, 'VALID');
  assert.ok(res.pk);
  assert.ok(res.sk);
  assert.deepEqual(res.pk.B, [34, 51, 58, 55, 22]);
  assert.equal(res.pk.T, 220);
  assert.equal(res.sk.u, 18);
  assert.equal(res.checks.every((c) => c.passed), true);
});

test('Knapsack example on page 3: W=(2,3,7,14,30) with target 39 gives x=(1,0,1,0,1) and remainder 0', () => {
  const res = solveSuperincreasingGreedy([2, 3, 7, 14, 30], 39);
  assert.deepEqual(res.x, [1, 0, 1, 0, 1]);
  assert.equal(res.remainder, 0);
});

test('TC1 Signing: M="Tôi đồng ý" (15 bytes UTF-8) rejects k=0 (165!=104), rejects k=1 (rem=1), accepts k=2 with x=(1,0,0,0,1)', () => {
  const keyRes = generateKeys({
    profile: SUPPORTED_PROFILE,
    nInput: 5,
    wInput: [2, 3, 7, 14, 30],
    qInput: 61,
    rInput: 17,
  });
  assert.ok(keyRes.pk && keyRes.sk);

  const signRes = signMessage('Tôi đồng ý', keyRes.sk, keyRes.pk);
  assert.equal(signRes.status, 'VALID');
  assert.equal(signRes.mByteLength, 15);
  assert.equal(signRes.trials.length, 3);

  // k = 0
  assert.equal(signRes.trials[0].k, 0);
  assert.equal(signRes.trials[0].y_k, 104);
  assert.equal(signRes.trials[0].t, 42);
  assert.deepEqual(signRes.trials[0].x, [1, 1, 1, 0, 1]);
  assert.equal(signRes.trials[0].greedyRemainder, 0);
  assert.equal(signRes.trials[0].publicSumV, 165);
  assert.equal(signRes.trials[0].accepted, false);

  // k = 1
  assert.equal(signRes.trials[1].k, 1);
  assert.equal(signRes.trials[1].y_k, 163);
  assert.equal(signRes.trials[1].t, 6);
  assert.equal(signRes.trials[1].greedyRemainder, 1);
  assert.equal(signRes.trials[1].accepted, false);

  // k = 2
  assert.equal(signRes.trials[2].k, 2);
  assert.equal(signRes.trials[2].y_k, 56);
  assert.equal(signRes.trials[2].t, 32);
  assert.deepEqual(signRes.trials[2].x, [1, 0, 0, 0, 1]);
  assert.equal(signRes.trials[2].greedyRemainder, 0);
  assert.equal(signRes.trials[2].publicSumV, 56);
  assert.equal(signRes.trials[2].accepted, true);
  assert.equal(
    signRes.trials[2].sha256_hex,
    'e40b8fe9197f26188ac39dee57029c93a2c472be45bbbde89febb4731732bffc'
  );

  assert.ok(signRes.signature);
  assert.equal(signRes.signature.k, 2);
  assert.deepEqual(signRes.signature.x, [1, 0, 0, 0, 1]);
});

test('TC2: Invalid parameters (non-superincreasing W or gcd(r, q) != 1) return FORMAT_ERROR', () => {
  // Non-superincreasing: 12 <= 2+3+7 = 12
  const badW = generateKeys({
    profile: SUPPORTED_PROFILE,
    nInput: 5,
    wInput: '2, 3, 7, 12, 30',
    qInput: 61,
    rInput: 17,
  });
  assert.equal(badW.status, 'FORMAT_ERROR');
  assert.equal(badW.checks.find((c) => c.id === 'superincreasing')?.passed, false);

  // Not coprime: q=60, r=15 -> gcd(15, 60) = 15 != 1
  const badCoprime = generateKeys({
    profile: SUPPORTED_PROFILE,
    nInput: 5,
    wInput: '2, 3, 7, 14, 30',
    qInput: 60,
    rInput: 15,
  });
  assert.equal(badCoprime.status, 'FORMAT_ERROR');
  assert.equal(badCoprime.checks.find((c) => c.id === 'coprime_r')?.passed, false);
});

test('TC3: Tampered message "Tôi không đồng ý" with k=2, x=(1,0,0,0,1) yields y_2=65 != v=56 -> INVALID', () => {
  const verifyRes = verifyFromRawInputs({
    message: 'Tôi không đồng ý',
    bInput: '34, 51, 58, 55, 22',
    kInput: 2,
    xInput: '1, 0, 0, 0, 1',
  });
  assert.equal(verifyRes.status, 'INVALID');
  assert.equal(verifyRes.y_k, 65);
  assert.equal(verifyRes.v, 56);
});

test('TC4: Tampered signature vector x=(0,0,0,0,1) yields v=22 != y_2=56 -> INVALID; malformed x=(2,0,0,0,1) -> FORMAT_ERROR', () => {
  const flippedBit = verifyFromRawInputs({
    message: 'Tôi đồng ý',
    bInput: '34, 51, 58, 55, 22',
    kInput: 2,
    xInput: '0, 0, 0, 0, 1',
  });
  assert.equal(flippedBit.status, 'INVALID');
  assert.equal(flippedBit.y_k, 56);
  assert.equal(flippedBit.v, 22);

  const malformedBit = verifyFromRawInputs({
    message: 'Tôi đồng ý',
    bInput: '34, 51, 58, 55, 22',
    kInput: 2,
    xInput: '2, 0, 0, 0, 1',
  });
  assert.equal(malformedBit.status, 'FORMAT_ERROR');
});

test('Security Limit Counterexample (Page 9): Forgery without secret key at k=123, x=(1,0,1,0,1) gives v=114 == y_123=114', () => {
  const forgery1 = verifyFromRawInputs({
    message: 'Thông điệp giả mạo MHK',
    bInput: [34, 51, 58, 55, 22],
    kInput: 123,
    xInput: [1, 0, 1, 0, 1],
  });
  assert.equal(forgery1.status, 'VALID');
  assert.equal(forgery1.y_k, 114);
  assert.equal(forgery1.v, 114);

  const forgery2 = verifyFromRawInputs({
    message: 'Văn bản thay thế 7',
    bInput: [34, 51, 58, 55, 22],
    kInput: 123,
    xInput: [1, 0, 1, 0, 1],
  });
  assert.equal(forgery2.status, 'VALID');
  assert.equal(forgery2.y_k, 114);
  assert.equal(forgery2.v, 114);
});
