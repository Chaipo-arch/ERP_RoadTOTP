<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chantier;
use App\Models\Employe;
use App\Models\Materiel;
use App\Models\PlanningEvent;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'chantiers_actifs' => Chantier::where('status', 'En cours')->count(),
            'employes_actifs' => Employe::where('status', 'Actif')->count(),
            'materiels_service' => Materiel::where('status', 'En service')->count(),
            'ca_mois' => Chantier::where('status', 'En cours')->sum('budget'),
        ]);
    }

    public function revenue(): JsonResponse
    {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months[] = [
                'month' => $date->translatedFormat('M'),
                'revenue' => Chantier::whereMonth('start_date', $date->month)
                    ->whereYear('start_date', $date->year)
                    ->sum('budget'),
                'expenses' => Chantier::whereMonth('start_date', $date->month)
                    ->whereYear('start_date', $date->year)
                    ->sum('actual_cost'),
            ];
        }
        return response()->json($months);
    }

    public function recentChantiers(): JsonResponse
    {
        $chantiers = Chantier::with('client')
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json($chantiers);
    }

    public function upcomingTasks(): JsonResponse
    {
        $events = PlanningEvent::where('date', '>=', now()->startOfDay())
            ->where('date', '<=', now()->endOfDay())
            ->orderBy('time')
            ->get();

        return response()->json($events);
    }
}
