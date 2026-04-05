<?php

return [
    'default' => 'default',
    'documentations' => [
        'default' => [
            'api' => ['title' => 'ERP API Documentation'],
            'routes' => ['api' => 'api/documentation'],
            'paths' => [
                'use_absolute_path' => env('L5_SWAGGER_USE_ABSOLUTE_PATH', true),
                'docs_json' => 'api-docs.json',
                'docs_yaml' => 'api-docs.yaml',
                'format_to_use_for_docs' => 'json',
                'annotations' => [
                    base_path('./app/Http/Controllers/Api'),
                ],
                'excludes' => [], // Correctif pour l'erreur précédente
                'base' => env('L5_SWAGGER_BASE_PATH', null),
                'docs' => storage_path('api-docs'),
            ],
        ],
    ],
    'defaults' => [
        'routes' => ['docs' => 'docs'],
        'paths' => [
            'docs' => storage_path('api-docs'),
            'views' => base_path('resources/views/vendor/l5-swagger'),
            'base' => env('L5_SWAGGER_BASE_PATH', null),
        ],
        'scanOptions' => [
            'analyser' => null,
            'analysis' => null,
            'processors' => [], // CORRECTIF : On initialise le tableau vide ici
            'exclude' => [base_path('app/Services')],
        ],
        'securityDefinitions' => [
            'securitySchemes' => [],
            'security' => [],
        ],
        'generate_always' => env('L5_SWAGGER_GENERATE_ALWAYS', false),
        'swagger_version' => '3.0',
        'proxy' => false,
    ],
];