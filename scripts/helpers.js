import { check } from 'k6';

// Selecciona una credencial aleatoria de la lista
export function getRandomCredential(credentials) {
    return credentials[Math.floor(Math.random() * credentials.length)];
}

// Valida la respuesta HTTP y registra los checks en el reporte de k6
export function validateResponse(response) {
    return check(response, {
        'Status correcto': (r) => r.status === 201,
        'JSON válido': (r) => {
            try {
                JSON.parse(r.body);
                return true;
            } catch {
                return false;
            }
        },
        'Tiene token': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body && typeof body.token === 'string';
            } catch {
                return false;
            }
        },
        'Tiempo aceptable (<1500ms)': (r) => r.timings.duration < 1500,
    });
}

// Calcula métricas personalizadas a partir de un array de respuestas
export function calculateMetrics(requests) {
    const durations = requests.map(r => r.timings.duration);
    const successful = requests.filter(r => r.status === 201).length;

    // Ordenar para percentiles
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95) - 1;

    return {
        totalRequests: requests.length,
        successfulRequests: successful,
        successRate: (successful / requests.length) * 100,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        p95: sortedDurations[p95Index >= 0 ? p95Index : 0],
    };
}
