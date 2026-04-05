<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="API ERP RoadToTP",
 *     version="1.0.0",
 *     description="Documentation de l'API pour la gestion des clients, chantiers et utilisateurs.",
 *     @OA\Contact(
 *         email="[EMAIL_ADDRESS]"
 *     )
 * )
 * 
 * @OA\Server(
 *     url="http://localhost/api",
 *     description="Serveur de développement"
 * )
 * 
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
abstract class Controller
{
    //
}
