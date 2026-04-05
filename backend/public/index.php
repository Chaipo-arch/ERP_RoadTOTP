<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Détermine si l'application est en mode maintenance...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Enregistre l'autoloader de Composer...
require __DIR__.'/../vendor/autoload.php';

// Démarre Laravel et gère la requête...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());