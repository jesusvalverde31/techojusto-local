# TechoJusto Local

Comparador local y orientativo de viviendas que revela el coste mensual completo, el esfuerzo sobre ingresos declarados y los compromisos entre espacio, movilidad, accesibilidad y estabilidad. Funciona sin nube, sin dependencias y con datos JSON recuperables.

## Abrir

Ejecuta `node iniciar.cjs` desde esta carpeta y abre `http://127.0.0.1:4328`.

Requiere Node.js 24 o superior. No requiere `npm install`.

## Verificación

```text
node --check server.cjs
node --check storage.cjs
node --check engine.js
node --check iniciar.cjs
node --check public/app.js
node --check public/engine.js
node --test --test-isolation=none test/server.test.cjs
```

## Arquitectura

- Servidor HTTP y API REST nativos de Node.
- JSON local con reemplazo atómico, backup previo y recuperación conservadora.
- Motor compartido de costes, esfuerzo, score, alertas y estadísticas.
- CSP estricta, host validado y servicio exclusivo en `127.0.0.1`.
- Interfaz vanilla con canvas, tabla equivalente y accesibilidad por teclado.

## Limitaciones reales

No es asesoramiento financiero o jurídico, no comprueba la disponibilidad o legalidad de anuncios y no determina si un hogar puede pagar una vivienda. No integra mapas ni portales. Solo trabaja con datos introducidos manualmente y una instancia local.

## GitHub About (EN, ≤350 chars)

Privacy-first local housing comparison app. It reveals the full monthly cost beyond rent, calculates declared-income effort, weighted fit, explainable alerts, visits and shortlist history. Built with Node 24 and vanilla HTML/CSS/JS, atomic JSON backups, strict CSP, zero dependencies and an accessible canvas dashboard.

## Vídeo demo de 60 segundos

0–10 s: alquiler frente a coste total. 10–24 s: filtros y KPIs. 24–38 s: comparar Centro y Periferia en canvas y tabla. 38–49 s: editar transporte y ver el recálculo/historial. 49–56 s: vista móvil a 360 px. 56–60 s: privacidad local, cero dependencias y límites reales.
