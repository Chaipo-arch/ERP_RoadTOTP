<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'ERP RoadToTP API',
        'version' => '1.0.0',
        'documentation' => '/api/docs'
    ]);
});
