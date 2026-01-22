import http from 'k6/http';
import { check } from 'k6';
import { loadCredentials } from '../scripts/common-config.js';

const credentials = loadCredentials();

export const options = {
    vus: 1,
    duration: '10s',
};

export default function () {
    const credential = credentials[0];

    const response = http.post(
        'https://fakestoreapi.com/auth/login',
        JSON.stringify({
            username: credential.username,
            password: credential.password,
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    check(response, {
        'status 201': r => r.status === 201,
        'token presente': r => !!r.json('token'),
    });
}
