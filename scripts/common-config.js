// common-config.js
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

export function loadCredentials(filePath = '../data/credentials.csv') {
    return new SharedArray('credentials', function() {
        const fileContent = open(filePath);

        if (filePath.endsWith('.csv')) {
            const parsed = papaparse.parse(fileContent, {
                header: true,
                skipEmptyLines: true
            }).data;

            return parsed.map(row => ({
                username: row.username || row.user,
                password: row.password || row.passwd
            }));
        } else if (filePath.endsWith('.json')) {
            return JSON.parse(fileContent);
        }

        throw new Error(`Formato no soportado: ${filePath}`);
    });
}

export const defaultHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-performance-test/1.0'
};

export function validateLoginResponse(response) {
    return {
        'Status OK': response.status === 200 || response.status === 201,
        'Fast response': response.timings.duration < 2000,
        'Has token': () => {
            try {
                const token = response.json('token');
                return token && typeof token === 'string';
            } catch {
                return false;
            }
        }
    };
}