// Prueba de humo - Verificación básica del endpoint
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Cargar datos de credenciales desde CSV
const credentials = new SharedArray('credentials', function() {
    return papaparse.parse(open('../data/credentials.csv'), { header: true }).data;
});

// Configuración de prueba de humo
export const options = {
    vus: 1, // 1 usuario virtual
    duration: '10s', // Duración corta
    thresholds: {
        http_req_failed: ['rate<0.01'], // < 1% de errores
        http_req_duration: ['p(95)<1500'], // 95% < 1.5s
    },
};

export default function () {
    // URL del endpoint de login
    const url = 'https://fakestoreapi.com/auth/login';

    // Seleccionar credenciales aleatorias
    const randomCredential = credentials[Math.floor(Math.random() * credentials.length)];

    // Headers de la petición
    const headers = {
        'Content-Type': 'application/json',
    };

    // Body de la petición
    const payload = JSON.stringify({
        username: randomCredential.user,
        password: randomCredential.passwd,
    });

    // Enviar petición POST
    const response = http.post(url, payload, { headers: headers, timeout: '60s' });

    // Validaciones
    check(response, {
        'status is 201': (r) => r.status === 201,
        'response time < 1500ms': (r) => r.timings.duration < 1500,
        'has token in response': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.token && body.token.length > 0;
            } catch (e) {
                return false;
            }
        },
    });

    // Pequeña pausa entre iteraciones
    sleep(0.5);
}