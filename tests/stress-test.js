import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// OPCIÓN 1: Cargar datos de credenciales desde CSV
const credentials = new SharedArray('credentials', function() {
    // Parse CSV con encabezados
    const csvData = open('../data/credentials.csv');
    const parsed = papaparse.parse(csvData, {
        header: true,
        skipEmptyLines: true
    }).data;

    return parsed.map(row => ({
        username: row.username || row.user,
        password: row.password || row.passwd
    }));
});

// OPCIÓN 2: Cargar desde JSON
// const credentials = new SharedArray('credentials', function() {
//     return JSON.parse(open('../data/credentials.json'));
// });

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
// Selecciona credencial aleatoria
    const credential = credentials[Math.floor(Math.random() * credentials.length)];

     const payload = JSON.stringify({
         username: credential.username,
         password: credential.password
     });

     const headers = {
         'Content-Type': 'application/json',
     };

     const response = http.post(
         'https://fakestoreapi.com/auth/login',
         payload,
         { headers: headers, timeout: '60s' }
     );

    // Corrección: un solo check con todas las validaciones
check(response, {
        'Status correcto': (r) => r.status === 201,
        'Response time < 3s': (r) => r.timings.duration < 3000,
        'Tiene token válido': (r) => {
            try {
                const token = r.json('token');
                return token && typeof token === 'string' && token.length > 0;
            } catch {
                return false;
            }
        },
        'Es JSON válido': (r) => {
            try {
                JSON.parse(r.body);
                return true;
            } catch {
                return false;
            }
        }
    });

    sleep(0.3); // Pausa más corta para mayor carga
}
