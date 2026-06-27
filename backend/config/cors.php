<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // ⚠️ Mettez ici l'URL exacte de votre front (ex: http://localhost:3000)
    // Si vous testez via Postman, 'Allowed Origins' n'est pas bloquant, mais pour un navigateur si.
    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'ws://localhost:8081',
        'http://localhost:8081',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8081',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // C'est la ligne CRITIQUE pour que le login fonctionne
    'supports_credentials' => true,
];