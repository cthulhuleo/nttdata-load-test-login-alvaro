import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Cargar credenciales dinámicamente desde CSV o JSON
function loadCredentials() {
    try {
        // Intenta cargar CSV primero
        const csvData = open('../data/credentials.csv');
        const parsed = papaparse.parse(csvData, {
            header: true,
            skipEmptyLines: true
        }).data;

        return parsed.map(row => ({
            username: row.username || row.user,
            password: row.password || row.passwd
        }));
    } catch (error) {
        console.log('CSV no encontrado, intentando JSON...');
        // Fallback a JSON
        return JSON.parse(open('../data/credentials.json'));
    }
}

const credentials = new SharedArray('credentials', loadCredentials);

// Configuración con ramp-up y ramp-down
export const options = {
    scenarios: {
        ramp_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },   // subir a 10 VUs
                { duration: '30s', target: 20 },   // subir a 20 VUs
                { duration: '1m', target: 20 },    // mantener 20 VUs (≈20 TPS)
                { duration: '30s', target: 5 },    // bajar a 5 VUs
                { duration: '30s', target: 0 },    // ramp-down a 0
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
    // Log para debug
    if (__VU === 1 && __ITER === 0) {
        console.log(`Total credenciales cargadas: ${credentials.length}`);
    }

    const credential = credentials[Math.floor(Math.random() * credentials.length)];

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'k6-load-test/1.0'
        },
        timeout: '60s',
        tags: {
            test_type: 'load_test',
            endpoint: 'login'
        }
    };

    const response = http.post(
        'https://fakestoreapi.com/auth/login',
        JSON.stringify({
            username: credential.username,
            password: credential.password
        }),
        params
    );

    // Validaciones exhaustivas
    const checkResult = check(response, {
        'Status correcto (200/201)': (r) => r.status === 200 || r.status === 201,
        'Response time < 1500ms': (r) => r.timings.duration < 1500,
        'Token presente': (r) => {
            try {
                const token = r.json('token');
                return token && token.length > 10;
            } catch {
                return false;
            }
        },
        'Content-Type JSON': (r) => {
            const contentType = r.headers['Content-Type'];
            return contentType && contentType.includes('application/json');
        },
        'Request exitoso': (r) => r.status >= 200 && r.status < 300
    });

    // Log de errores
    if (!checkResult) {
        console.error(`Request fallido - Status: ${response.status}, Time: ${response.timings.duration}ms`);
    }

    sleep(0.15); // cada VU ≈6.6 req/s → 10 VUs ≈66 TPS
}

// Reportes
export function handleSummary(data) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

    return {
        'reports/latest.html': htmlReport(data),
        [`reports/report-${timestamp}.html`]: htmlReport(data),
        'reports/summary.json': JSON.stringify(data, null, 2),
        'stdout': textSummary(data, {
            indent: ' ',
            enableColors: true
        }),
    };
}