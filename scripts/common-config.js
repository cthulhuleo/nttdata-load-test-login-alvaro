import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

/**
 * Carga credenciales desde un archivo CSV o JSON.
 */
export function loadCredentials(filePath = __ENV.DATA_FILE || '../data/credentials.csv') {
    return new SharedArray('credentials', () => {
        const content = open(filePath);

        // CSV
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

        // JSON
        if (filePath.endsWith('.json')) {
            return JSON.parse(content);
        }

        throw new Error(`Formato de archivo no soportado: ${filePath}`);
    });
}

/* Headers por defecto para requests HTTP */
export const defaultHeaders = {
    'Content-Type': 'application/json',
};
