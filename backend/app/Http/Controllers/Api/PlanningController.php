<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlanningEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanningController extends Controller
{
    public function events(Request $request): JsonResponse
    {
        $query = PlanningEvent::with('chantier');

        if ($request->has('month') && $request->has('year')) {
            $query->whereMonth('date', $request->month)
                ->whereYear('date', $request->year);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->orderBy('date')->orderBy('time')->get());
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
            'location' => 'nullable|string',
            'chantier_id' => 'nullable|exists:chantiers,id',
            'team' => 'nullable|string',
        ]);

        $event = PlanningEvent::create($validated);

        return response()->json($event, 201);
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
            'location' => 'nullable|string',
            'chantier_id' => 'nullable|exists:chantiers,id',
            'team' => 'nullable|string',
        ]);

        $event->update($validated);

        return response()->json($event);
    }

    public function deleteEvent(PlanningEvent $event): JsonResponse
    {
        $event->delete();
        return response()->json(null, 204);
    }

    public function teams(): JsonResponse
    {
        return response()->json([
            ['id' => 1, 'name' => 'Équipe A', 'color' => '#f59e0b'],
            ['id' => 2, 'name' => 'Équipe B', 'color' => '#22c55e'],
            ['id' => 3, 'name' => 'Équipe C', 'color' => '#3b82f6'],
        ]);
    }
}
