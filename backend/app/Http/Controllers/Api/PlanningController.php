<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlanningEvent;
use App\Models\Chantier;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanningController extends Controller
{
    public function events(Request $request): JsonResponse
    {
        $query = PlanningEvent::with(['chantier', 'employe'])
            ->where('company_id', auth()->user()->company_id);

        if ($request->has('month') && $request->has('year')) {
            $month = $request->month;
            $year = $request->year;
            $query->where(function ($q) use ($month, $year) {
                // Events that START in this month
                $q->where(function ($sub) use ($month, $year) {
                    $sub->whereMonth('date', $month)->whereYear('date', $year);
                })
                // OR events that SPAN into this month (started before, ending in/after)
                ->orWhere(function ($sub) use ($month, $year) {
                    $startOfMonth = "{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-01";
                    $sub->where('date', '<', $startOfMonth)
                        ->where('end_date', '>=', $startOfMonth);
                });
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('employe_id')) {
            $query->where('employe_id', $request->employe_id);
        }

        if ($request->has('chantier_id')) {
            $query->where('chantier_id', $request->chantier_id);
        }

        return response()->json($query->orderBy('date')->orderBy('time')->get());
    }

    /**
     * Get events for the current user's personal weekly planning.
     */
    public function myEvents(Request $request): JsonResponse
    {
        $user = auth()->user();
        $employe = $user->employe;

        if (!$employe) {
            return response()->json([]);
        }

        $query = PlanningEvent::with(['chantier'])
            ->where('company_id', $user->company_id)
            ->where(function ($q) use ($employe) {
                // Events directly assigned to me
                $q->where('employe_id', $employe->id);
                // OR events on chantiers I'm assigned to
                $chantierIds = $employe->chantiers()->pluck('chantiers.id');
                if ($chantierIds->isNotEmpty()) {
                    $q->orWhereIn('chantier_id', $chantierIds);
                }
            });

        if ($request->has('start_date') && $request->has('end_date')) {
            $start = $request->start_date;
            $end = $request->end_date;
            $query->where(function ($q) use ($start, $end) {
                $q->whereBetween('date', [$start, $end])
                  ->orWhere(function ($sub) use ($start, $end) {
                      $sub->where('date', '<=', $end)
                          ->where(function ($s) use ($start) {
                              $s->where('end_date', '>=', $start)
                                ->orWhereNull('end_date');
                          });
                  });
            });
        }

        return response()->json($query->orderBy('date')->orderBy('time')->get());
    }

    /**
     * Get chantiers for planning context (active/planned).
     */
    public function chantiers(Request $request): JsonResponse
    {
        $chantiers = Chantier::where('company_id', auth()->user()->company_id)
            ->whereIn('status', ['Planifié', 'En cours'])
            ->select('id', 'name', 'reference', 'location', 'start_date', 'end_date', 'status', 'progress')
            ->orderBy('start_date')
            ->get();

        return response()->json($chantiers);
    }

    public function createEvent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:chantier,livraison,maintenance,reunion,formation,inspection',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:date',
            'time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'location' => 'nullable|string',
            'chantier_id' => 'nullable|exists:chantiers,id',
            'employe_id' => 'nullable|exists:employes,id',
            'team' => 'nullable|string',
        ]);

        $validated['company_id'] = auth()->user()->company_id;
        $event = PlanningEvent::create($validated);

        return response()->json($event->load(['chantier', 'employe']), 201);
    }

    public function updateEvent(Request $request, PlanningEvent $event): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:chantier,livraison,maintenance,reunion,formation,inspection',
            'description' => 'nullable|string',
            'date' => 'sometimes|date',
            'end_date' => 'nullable|date|after_or_equal:date',
            'time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'location' => 'nullable|string',
            'chantier_id' => 'nullable|exists:chantiers,id',
            'employe_id' => 'nullable|exists:employes,id',
            'team' => 'nullable|string',
        ]);

        $event->update($validated);

        return response()->json($event->load(['chantier', 'employe']));
    }

    public function deleteEvent(PlanningEvent $event): JsonResponse
    {
        $event->delete();
        return response()->json(null, 204);
    }

    public function teams(): JsonResponse
    {
        $teams = Team::where('company_id', auth()->user()->company_id)
            ->withCount('members')
            ->get()
            ->map(function ($team) {
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'members_count' => $team->members_count,
                    'color' => $team->color ?? '#f59e0b',
                ];
            });

        // Fallback if no teams exist
        if ($teams->isEmpty()) {
            return response()->json([
                ['id' => 1, 'name' => 'Équipe A', 'color' => '#f59e0b', 'members_count' => 0],
                ['id' => 2, 'name' => 'Équipe B', 'color' => '#22c55e', 'members_count' => 0],
                ['id' => 3, 'name' => 'Équipe C', 'color' => '#3b82f6', 'members_count' => 0],
            ]);
        }

        return response()->json($teams);
    }
}
