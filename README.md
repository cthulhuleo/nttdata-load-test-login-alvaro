# NTTData Load Test - Login API con k6

Este proyecto contiene pruebas de carga para la API de login utilizando [k6](https://k6.io/).  
El objetivo es validar rendimiento y estabilidad bajo escenarios de ramp-up y ramp-down, asegurando un throughput mínimo de 20 TPS, tiempos de respuesta aceptables y baja tasa de errores.

---

## Requisitos

- [k6](https://k6.io/docs/getting-started/installation/) instalado en tu máquina.
- Node.js (opcional, si deseas extender librerías).
- Credenciales de prueba en formato CSV.

---

## Estructura del proyecto

│   nttdata-load-test-login-alvaro.iml
│   README.txt
│   
├───.idea
│       .gitignore
│       misc.xml
│       modules.xml
│       vcs.xml
│       workspace.xml
│       
├───data
│       credentials.csv
│       test-data.json
│       
├───reports
│       html-report.html
│       results-2025-12-21T03-37-21-585Z.html
│       results-2025-12-21T04-01-01-027Z.html
│       results-2025-12-21T04-46-21-438Z.html
│       results-2025-12-21T05-02-28-973Z.html
│       results-2025-12-21T05-09-12-157Z.html
│       results-2025-12-21T05-20-28-647Z.html
│       results-2025-12-21T05-30-08-902Z.html
│       results-2025-12-21T05-43-20-235Z.html
│       results-2025-12-21T05-47-38-692Z.html
│       results-2025-12-21T05-56-08-767Z.html
│       results-2025-12-21T06-02-53-685Z.html
│       results-2025-12-21T06-10-06-389Z.html
│       results-2025-12-21T06-18-52-168Z.html
│       summary.json
│       
├───scripts
│       common-config.js
│       helpers.js
│       
└───tests
        login-load-test.js
        login-smoke-test.js
        stress-test.js

- `data/credentials.csv`: archivo con usuarios y contraseñas de prueba.
- `data/credentials-data.json`: credenciales de usuario válidas para el API FakeStore.
- `common-config.js`: funciones reutilizables.
- `helpers.js`: funciones auxiliares para validación y métricas.
- `login-smoke-test.js`: prueba de humo básica del endpoint.
- `login-load-test.js`: escenario con ramp-up y ramp-down para alcanzar 20 TPS.
- `stress-test.js`: prueba de estrés.
- `reports/`: reportes HTML y JSON generados automáticamente.

---

## Escenario de prueba

- **Ramp-up**: incremento progresivo de VUs.
- **Estable**: mantener 20 VUs para alcanzar ≥20 TPS.
- **Ramp-down**: reducción progresiva de carga.

### Validaciones
- Tiempo de respuesta p95 < 1.5 segundos.
- Tasa de error < 3%.
- Checks > 95%.
- Throughput ≥ 20 TPS.

---

## Ejecución

1. Posicionarse en la carpeta del proyecto:
   cd nttdata-load-test-login-alvaro

2. Ejecutar prueba.
   - Prueba de humo:
     k6 run tests/login-smoke-test.js
   - Prueba de carga (20TPS)/CSV (default)
     k6 run tests/login-load-test.js
   - Prueba de carga (20TPS)/CSV explícito
     k6 run -e DATA_FILE=../data/credentials.csv tests/login-load-test.js
   - Prueba de carga (20TPS)/JSON
     k6 run -e DATA_FILE=../data/credentials-data.json tests/login-load-test.js
   - Prueba de estrés
     k6 run tests/stress-test.js

3.  Ubicación de los reportes (E2E)
   Al finalizar cualquier ejecución de k6, los reportes se generan automáticamente en la carpeta:
    `reports/`
   
   Archivos principales:
   - `reports/latest.html` → Reporte HTML de la última ejecución
   - `reports/summary.json` → Resumen completo en formato JSON
   - `reports/*.html` → Historial de ejecuciones (load, smoke y stress)

Estos reportes pueden ser utilizados como evidencia E2E del comportamiento del sistema bajo carga.

---

## Reportes

Los reportes incluyen:
   - Métricas de throughput (TPS).
   - Latencias (avg, p90, p95).
   - Tasa de errores.
   - Checks de validación.
   
Ejemplo de ejecución exitosa:
   ✓ Status correcto (200/201)
   ✓ Response time < 1500ms
   ✓ Has token in response
   ✓ Request completed successfully
   ✓ Throughput ≥ 20 TPS
