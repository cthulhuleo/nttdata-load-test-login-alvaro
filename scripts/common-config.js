import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

export function loadCredentials(filePath = '../data/credentials.csv') {
    return new SharedArray('credentials', () => {
        const content = open(filePath);

        if (filePath.endsWith('.csv')) {
            const parsed = papaparse.parse(content, {
                header: true,
                skipEmptyLines: true,
            }).data;

            return parsed.map(row => ({
                username: row.user || row.username,
                password: row.passwd || row.password,
            }));
        }

        if (filePath.endsWith('.json')) {
            return JSON.parse(content);
        }

        throw new Error('Formato de archivo no soportado');
    });
}

export const defaultHeaders = {
    'Content-Type': 'application/json',
};
