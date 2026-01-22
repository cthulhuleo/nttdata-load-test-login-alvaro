import http from 'k6/http';
import { sleep } from 'k6';
import { loadCredentials, defaultHeaders } from '../scripts/common-config.js';
import { getRandomCredential, validateLogin } from '../scripts/helpers.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const credentials = loadCredentials();

export const options = {
    scenarios: {
        login_20_tps: {
            executor: 'constant-arrival-rate',
            rate: 20,           // 20 TPS REALES
            timeUnit: '1s',
            duration: '2m',
            preAllocatedVUs: 30,
            maxVUs: 50,
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<1500'],
        http_req_failed: ['rate<0.03'],
        checks: ['rate>0.97'],
    },
};

export default function () {
    const credential = getRandomCredential(credentials);

    const payload = JSON.stringify({
        username: credential.username,
        password: credential.password,
    });

    const response = http.post(
        'https://fakestoreapi.com/auth/login',
        payload,
        { headers: defaultHeaders, timeout: '60s' }
    );

    validateLogin(response);
    sleep(0.01);
}

export function handleSummary(data) {
    return {
        'reports/latest.html': htmlReport(data),
        'reports/summary.json': JSON.stringify(data, null, 2),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}
