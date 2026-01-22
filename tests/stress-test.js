import http from 'k6/http';
import { sleep } from 'k6';
import { loadCredentials } from '../scripts/common-config.js';

const credentials = loadCredentials();

export const options = {
    stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<3000'],
        http_req_failed: ['rate<0.05'],
    },
};

export default function () {
    const credential = credentials[Math.floor(Math.random() * credentials.length)];

    const response = http.post(
        'https://fakestoreapi.com/auth/login',
        JSON.stringify({
            username: credential.username,
            password: credential.password,
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    sleep(0.2);
}
