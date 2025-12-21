import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Cargar credenciales desde CSV
    const credentials = new SharedArray('credentials', function () {
    const csvData = open('../data/credentials.csv');
    const parsedData = [];
    const lines = csvData.split('\n');

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const [user, passwd] = line.split(',');
            parsedData.push({ user, passwd });
        }
    }
    return parsedData;
});

// Configuración con ramp-up y ramp-down
export const options = {
    scenarios: {
        ramp_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },   // subir a 10 VUs
                { duration: '30s', target: 20 },  // subir a 20 VUs
                { duration: '1m', target: 20 },   // mantener 20 VUs (≈20 TPS)
                { duration: '30s', target: 5 },   // bajar a 5 VUs
                { duration: '30s', target: 0 },   // ramp-down a 0
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<1500'], // 95% < 1.5s
        http_req_failed: ['rate<0.03'],    // <3% errores
        checks: ['rate>0.95'],             // al menos 95% de checks pasan
        http_reqs: ['rate>=20'],           // mínimo 20 TPS en etapa estable
    },
};

export default function () {
    group('Login API Test', function () {
        const credential = credentials[Math.floor(Math.random() * credentials.length)];

        const res = http.post(
            'https://fakestoreapi.com/auth/login',
            JSON.stringify({
                username: credential.user,
                password: credential.passwd,
            }),
            { headers: { 'Content-Type': 'application/json' }, timeout: '60s' }
        );

        check(res, {
            'Status correcto (200/201)': (r) => r.status === 200 || r.status === 201,
            'Response time < 1500ms': (r) => r.timings.duration < 1500,
            'Has token in response': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return typeof body.token === 'string' && body.token.length > 10;
                } catch {
                    return false;
                }
            },
            'Response has JSON content-type': (r) =>
                r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
            'Request completed successfully': (r) => r.status >= 200 && r.status < 300,
        });

        sleep(0.15) // cada VU ≈6.6 req/s → 10 VUs ≈66 TPS
    });
}

// Reportes
export function handleSummary(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return {
        'reports/html-report.html': htmlReport(data),
        'reports/summary.json': JSON.stringify(data),
        [`reports/results-${timestamp}.html`]: htmlReport(data),
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}
