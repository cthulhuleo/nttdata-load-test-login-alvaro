import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Cargar datos de credenciales
const credentials = new SharedArray('credentials', function() {
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

// Configuración de prueba de estrés
export const options = {
    stages: [
        { duration: '30s', target: 20 },   // Ramp-up a 20 VUs
        { duration: '1m', target: 50 },    // Aumentar a 50 VUs
        { duration: '2m', target: 100 },   // Aumentar a 100 VUs (estrés)
        { duration: '30s', target: 0 },    // Ramp-down
    ],

    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% de requests < 2s
        http_req_failed: ['rate<0.05'],    // Máx 5% de fallos
    },
};

export default function () {
    const credential = credentials[Math.floor(Math.random() * credentials.length)];

    const response = http.post(
        'https://fakestoreapi.com/auth/login',
        JSON.stringify({
            username: credential.user,
            password: credential.passwd,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: '60s',
        }
    );

    // Corrección: un solo check con todas las validaciones
    check(response, {
        'Status correcto': (r) => r.status === 201,
        'response time acceptable': (r) => r.timings.duration < 3000,
        'Tiene token': (r) => r.json('token') !== undefined,
    });

    sleep(0.3); // Pausa más corta para mayor carga
}
