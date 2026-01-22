import { check } from 'k6';

export function getRandomCredential(credentials) {
    return credentials[Math.floor(Math.random() * credentials.length)];
}

export function validateLogin(response) {
    return check(response, {
        'status 201': r => r.status === 201,
        'response < 1500ms': r => r.timings.duration < 1500,
        'token presente': r => !!r.json('token'),
    });
}
