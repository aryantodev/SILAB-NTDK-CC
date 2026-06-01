<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
    'allowed_methods' => ['*'],

    // Kode ini akan membaca domain silabntdk.com dari dashboard Coolify
    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'https://silabntdk.com')),

    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
