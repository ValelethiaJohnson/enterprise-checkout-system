import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 virtual users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must stay below 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    idempotencyKey: `k6-idem-${__VU}-${__ITER}-${Date.now()}`,
    customerId: `cust-k6-${__VU}`,
    merchantAccountId: 'acct_stripe_mock_connect',
    currency: 'USD',
    items: [
      { skuId: 'IPHONE-15-PRO-MAX', quantity: 1, unitPriceMinor: 100000n.toString() }
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': 'mock-hmac-signature',
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/checkout`, payload, params);

  check(res, {
    'is status 200 or 409 (handled concurrency)': (r) => r.status === 200 || r.status === 409,
    'response time acceptable': (r) => r.timings.duration < 400,
  });

  sleep(1);
}
