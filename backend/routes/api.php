<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ChantierController;
use App\Http\Controllers\Api\EmployeController;
use App\Http\Controllers\Api\MaterielController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\PlanningController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\LeaveRequestController;
use App\Http\Controllers\Api\ContractTemplateController;
use App\Http\Controllers\Api\EmployeDocumentController;

// Authentication routes
Route::prefix('auth')->group(function () {
    // On force l'usage du middleware 'web' pour avoir accès aux sessions PHP
    Route::middleware(['web'])->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/register', [AuthController::class, 'register']);
    });

    // Ces routes ont besoin du token Sanctum ET de la session
    Route::middleware(['auth:sanctum', 'web'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });
});

// Protected API routes
Route::middleware('auth:sanctum')->group(function () {
    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/revenue', [DashboardController::class, 'revenue']);
    Route::get('/dashboard/recent-chantiers', [DashboardController::class, 'recentChantiers']);
    Route::get('/dashboard/upcoming-tasks', [DashboardController::class, 'upcomingTasks']);

    // Chantiers
    Route::apiResource('chantiers', ChantierController::class);
    Route::patch('/chantiers/{chantier}/progress', [ChantierController::class, 'updateProgress']);
    Route::get('/chantiers/{chantier}/team', [ChantierController::class, 'getTeam']);
    Route::post('/chantiers/{chantier}/team', [ChantierController::class, 'assignTeam']);



    // Materiels
    Route::apiResource('materiels', MaterielController::class);
    Route::patch('/materiels/{materiel}/status', [MaterielController::class, 'updateStatus']);
    Route::post('/materiels/{materiel}/maintenance', [MaterielController::class, 'scheduleMaintenance']);
    Route::patch('/materiels/{materiel}/position', [MaterielController::class, 'updatePosition']);

    // Cartographie (matériels géolocalisés + chantiers)
    Route::get('/cartography', [MaterielController::class, 'cartography']);

    // Clients
    Route::apiResource('clients', ClientController::class);
    Route::get('/clients/{client}/contracts', [ClientController::class, 'contracts']);
    Route::get('/clients/{client}/chantiers', [ClientController::class, 'chantiers']);

    // Planning
    Route::get('/planning/events', [PlanningController::class, 'events']);
    Route::get('/planning/my-events', [PlanningController::class, 'myEvents']);
    Route::get('/planning/chantiers', [PlanningController::class, 'chantiers']);
    Route::post('/planning/events', [PlanningController::class, 'createEvent']);
    Route::put('/planning/events/{event}', [PlanningController::class, 'updateEvent']);
    Route::delete('/planning/events/{event}', [PlanningController::class, 'deleteEvent']);
    Route::get('/planning/teams', [PlanningController::class, 'teams']);

    // Documents (GED)
    Route::get('/documents', [App\Http\Controllers\Api\DocumentController::class, 'index']);
    Route::post('/documents', [App\Http\Controllers\Api\DocumentController::class, 'store']);
    Route::get('/documents/{document}/download', [App\Http\Controllers\Api\DocumentController::class, 'download']);
    Route::delete('/documents/{document}', [App\Http\Controllers\Api\DocumentController::class, 'destroy']);

    // Users (Admin only)
    Route::post('/users', [App\Http\Controllers\Api\UserController::class, 'store']);
    Route::post('/users/invite', [App\Http\Controllers\Api\UserController::class, 'invite']);
    Route::get('/users/invitations', [App\Http\Controllers\Api\UserController::class, 'invitations']);
    
    // Chat
    Route::get('/conversations', [\App\Http\Controllers\Api\ChatController::class, 'index']);
    Route::get('/conversations/{id}', [\App\Http\Controllers\Api\ChatController::class, 'show']);
    Route::delete('/conversations/{id}', [\App\Http\Controllers\Api\ChatController::class, 'destroy']);
    Route::post('/chat', [\App\Http\Controllers\Api\ChatController::class, 'chat']);

    // Roles & Permissions
    Route::get('/permissions', [\App\Http\Controllers\Api\PermissionController::class, 'index']);
    
    
    // Nouvelles routes pour la gestion utilisateur/rôle
    Route::get('/roles-users', [RoleController::class, 'users']);
    Route::put('/roles-users/{user}', [RoleController::class, 'updateUserRole']);
    Route::apiResource('roles', RoleController::class);
    
    // ===== MODULE RH =====
    // Employees — routes sans paramètre AVANT apiResource pour éviter le conflit avec {employe}
    Route::get('/employes/user', [EmployeController::class, 'getEmployeByUserId']);
    Route::get('/employes/available-users', [EmployeController::class, 'availableUsers']);
    Route::post('/employes/create-with-user', [EmployeController::class, 'storeWithUser']);

    Route::apiResource('employes', EmployeController::class);
    Route::get('/employes/{employe}/assignments', [EmployeController::class, 'assignments']);
    Route::patch('/employes/{employe}/status', [EmployeController::class, 'updateStatus']);
    Route::get('/employes/{employe}/subordinates', [\App\Http\Controllers\Api\HierarchyController::class, 'subordinates']);
    Route::get('/employes/{employe}/all-subordinates', [\App\Http\Controllers\Api\HierarchyController::class, 'allSubordinates']);
    Route::get('/employes/{employe}/hierarchy-path', [\App\Http\Controllers\Api\HierarchyController::class, 'path']);
    
    // Leave Requests (Demandes de congés)
    Route::apiResource('leave-requests', \App\Http\Controllers\Api\LeaveRequestController::class);
    Route::patch('/leave-requests/{leaveRequest}/approve', [\App\Http\Controllers\Api\LeaveRequestController::class, 'approve']);
    Route::patch('/leave-requests/{leaveRequest}/reject', [\App\Http\Controllers\Api\LeaveRequestController::class, 'reject']);
    Route::patch('/leave-requests/{leaveRequest}/cancel', [\App\Http\Controllers\Api\LeaveRequestController::class, 'cancel']);
    Route::get('/employes/{employe}/leave-balance', [\App\Http\Controllers\Api\LeaveRequestController::class, 'balance']);
    
    // Types de congés (requis pour le formulaire)
    Route::get('/leave-types', function () {
        return response()->json(\App\Models\LeaveType::all());
    });

    // Teams (Équipes)
    Route::apiResource('teams', \App\Http\Controllers\Api\TeamController::class);
    Route::get('/teams/{team}/members', [\App\Http\Controllers\Api\TeamController::class, 'members']);
    Route::post('/teams/{team}/members', [\App\Http\Controllers\Api\TeamController::class, 'addMember']);
    Route::delete('/teams/{team}/members/{employe}', [\App\Http\Controllers\Api\TeamController::class, 'removeMember']);

    // Hierarchy (Hiérarchie / Organigramme)
    Route::get('/hierarchy/tree', [\App\Http\Controllers\Api\HierarchyController::class, 'tree']);
    Route::get('/hierarchy/stats', [\App\Http\Controllers\Api\HierarchyController::class, 'stats']);
    Route::get('/hierarchy/subtree/{employe}', [\App\Http\Controllers\Api\HierarchyController::class, 'subtree']);

    // ===== MODÈLES DE CONTRAT (TipTap) =====
    Route::apiResource('contract-templates', ContractTemplateController::class);
    Route::post('/contract-templates/{contractTemplate}/duplicate', [ContractTemplateController::class, 'duplicate']);

    // ===== DOCUMENTS EMPLOYÉ (éditeur TipTap) =====
    Route::get('/employes/{employe}/rich-documents', [EmployeDocumentController::class, 'index']);
    Route::post('/employes/{employe}/rich-documents', [EmployeDocumentController::class, 'store']);
    Route::get('/employes/{employe}/rich-documents/{document}', [EmployeDocumentController::class, 'show']);
    Route::put('/employes/{employe}/rich-documents/{document}', [EmployeDocumentController::class, 'update']);
    Route::delete('/employes/{employe}/rich-documents/{document}', [EmployeDocumentController::class, 'destroy']);
    
    // ===== Contract Template =====
});
Route::post('/onlyoffice/callback', [App\Http\Controllers\Api\ContractTemplateController::class, 'onlyOfficeCallback']);
// Public health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// Public invitation routes (no auth required)
Route::post('/invitation/validate', [App\Http\Controllers\Api\UserController::class, 'validateToken']);
Route::post('/invitation/setup-password', [App\Http\Controllers\Api\UserController::class, 'setupPassword']);
Route::get('/debug-auth', function (\Illuminate\Http\Request $request) {
    return response()->json([
        'user' => $request->user(),
        'cookies' => $request->cookies->all(),
        'session_id' => session()->getId(),
        'sanctum_stateful' => app(\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class)::fromFrontend($request),
    ]);
})->middleware('auth:sanctum');

Route::get('/ping', function() { return "pong"; });

// ===== ROUTES INTERNES POUR L'AGENT IA =====
// Ces routes sont accessibles uniquement depuis le réseau Docker interne (pas d'auth requise).
// Elles permettent à l'agent IA de lire les données de l'ERP.
Route::prefix('internal')->group(function () {
    Route::get('/openapi', function () {
        return response()->json(
            json_decode(file_get_contents(storage_path('api-docs/api-docs.json')))
        );
    });
    Route::get('/clients', function (Request $request) {
        $query = \App\Models\Client::withCount(['chantiers', 'chantiers as active_chantiers_count' => function ($q) {
            $q->whereIn('status', ['En cours', 'Planifié']);
        }]);
        if ($request->has('type')) $query->where('type', $request->type);
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('contact_name', 'like', "%{$search}%");
            });
        }
        return response()->json($query->get());
    });

    Route::get('/clients/{id}', function ($id) {
        $client = \App\Models\Client::with('chantiers')->findOrFail($id);
        return response()->json($client);
    });

    Route::get('/chantiers', function (Request $request) {
        $query = \App\Models\Chantier::with('client');
        if ($request->has('status')) $query->where('status', $request->status);
        if ($request->has('search')) $query->where('name', 'like', "%{$request->search}%");
        return response()->json($query->get());
    });

    Route::get('/chantiers/{id}', function ($id) {
        $chantier = \App\Models\Chantier::with(['client', 'employes'])->findOrFail($id);
        return response()->json($chantier);
    });

    Route::get('/employes', function (Request $request) {
        $query = \App\Models\Employe::query();
        if ($request->has('search')) $query->where('name', 'like', "%{$request->search}%");
        return response()->json($query->get());
    });

    Route::get('/employes/{id}', function ($id) {
        return response()->json(\App\Models\Employe::findOrFail($id));
    });

    Route::get('/materiels', function (Request $request) {
        $query = \App\Models\Materiel::query();
        if ($request->has('search')) $query->where('name', 'like', "%{$request->search}%");
        return response()->json($query->get());
    });

    Route::get('/dashboard/stats', function () {
        return response()->json([
            'total_clients' => \App\Models\Client::count(),
            'total_chantiers' => \App\Models\Chantier::count(),
            'chantiers_en_cours' => \App\Models\Chantier::where('status', 'En cours')->count(),
            'total_employes' => \App\Models\Employe::count(),
            'total_materiels' => \App\Models\Materiel::count(),
            'budget_total' => \App\Models\Chantier::sum('budget'),
        ]);
    });

    Route::get('/planning/events', function () {
        return response()->json(\App\Models\PlanningEvent::with(['chantier', 'employe'])->get());
    });





// ===== MODULE CONTRATS =====
// Types de contrats (liste globale)
Route::get('/contrats/types', [\App\Http\Controllers\Api\ContratController::class, 'types']);

// Contrats d'un employé
Route::get('/employes/{employe}/contrats', [\App\Http\Controllers\Api\ContratController::class, 'index']);
Route::post('/employes/{employe}/contrats', [\App\Http\Controllers\Api\ContratController::class, 'store']);
Route::get('/employes/{employe}/contrats/{contrat}', [\App\Http\Controllers\Api\ContratController::class, 'show']);
Route::put('/employes/{employe}/contrats/{contrat}', [\App\Http\Controllers\Api\ContratController::class, 'update']);
Route::delete('/employes/{employe}/contrats/{contrat}', [\App\Http\Controllers\Api\ContratController::class, 'destroy']);

// Documents liés à un contrat
Route::post('/employes/{employe}/contrats/{contrat}/documents', [\App\Http\Controllers\Api\ContratController::class, 'uploadDocument']);
Route::delete('/employes/{employe}/contrats/{contrat}/documents/{documentId}', [\App\Http\Controllers\Api\ContratController::class, 'deleteDocument']);


});