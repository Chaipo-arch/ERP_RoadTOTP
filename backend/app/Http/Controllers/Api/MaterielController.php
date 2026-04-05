<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Materiel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterielController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Materiel::query();

        if ($request->has('type') && $request->type !== 'Tous') {
            $query->where('type', $request->type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('immatriculation', 'like', "%{$search}%");
            });
        }

        $materiels = $query->get()->map(function ($materiel) {
            $currentChantier = $materiel->currentChantier();
            $materiel->current_chantier_name = $currentChantier ? $currentChantier->name : null;
            return $materiel;
        });

        return response()->json($materiels);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:Engin,Véhicule,Outillage',
            'immatriculation' => 'required|string|unique:materiels',
            'hourly_rate' => 'required|numeric|min:0',
            'status' => 'required|in:Disponible,En service,Maintenance,Hors service',
            'purchase_date' => 'nullable|date',
            'last_maintenance' => 'nullable|date',
            'next_maintenance' => 'nullable|date',
            'notes' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'sensolus_device_id' => 'nullable|string|unique:materiels',
            'sensolus_tracker_name' => 'nullable|string|max:255',
        ]);

        $materiel = Materiel::create($validated);

        return response()->json($materiel, 201);
    }

    public function show(Materiel $materiel): JsonResponse
    {
        $materiel->load(['chantiers', 'maintenances']);
        $currentChantier = $materiel->currentChantier();
        $materiel->current_chantier_name = $currentChantier ? $currentChantier->name : null;

        return response()->json($materiel);
    }

    public function update(Request $request, Materiel $materiel): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:Engin,Véhicule,Outillage',
            'immatriculation' => 'sometimes|string|unique:materiels,immatriculation,' . $materiel->id,
            'hourly_rate' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:Disponible,En service,Maintenance,Hors service',
            'last_maintenance' => 'nullable|date',
            'next_maintenance' => 'nullable|date',
            'notes' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'sensolus_device_id' => 'nullable|string|unique:materiels,sensolus_device_id,' . $materiel->id,
            'sensolus_tracker_name' => 'nullable|string|max:255',
        ]);

        $materiel->update($validated);

        return response()->json($materiel);
    }

    public function destroy(Materiel $materiel): JsonResponse
    {
        $materiel->delete();
        return response()->json(null, 204);
    }

    public function updateStatus(Request $request, Materiel $materiel): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:Disponible,En service,Maintenance,Hors service',
        ]);

        $materiel->update($validated);

        return response()->json($materiel);
    }

    public function scheduleMaintenance(Request $request, Materiel $materiel): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date|after:today',
            'description' => 'nullable|string',
        ]);

        $materiel->update([
            'next_maintenance' => $validated['date'],
        ]);

        return response()->json($materiel);
    }

    /**
     * Update GPS position (e.g., from Sensolus webhook or manual update)
     */
    public function updatePosition(Request $request, Materiel $materiel): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $materiel->update([
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'last_position_at' => now(),
        ]);

        return response()->json($materiel);
    }

    /**
     * Returns all geolocated materiels and chantiers for the map
     */
    public function cartography(): JsonResponse
    {
        $materiels = Materiel::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->map(function ($materiel) {
                $currentChantier = $materiel->currentChantier();
                return [
                    'id' => $materiel->id,
                    'name' => $materiel->name,
                    'type' => $materiel->type,
                    'immatriculation' => $materiel->immatriculation,
                    'status' => $materiel->status,
                    'latitude' => (float) $materiel->latitude,
                    'longitude' => (float) $materiel->longitude,
                    'sensolus_device_id' => $materiel->sensolus_device_id,
                    'sensolus_tracker_name' => $materiel->sensolus_tracker_name,
                    'last_position_at' => $materiel->last_position_at,
                    'current_chantier' => $currentChantier ? $currentChantier->name : null,
                ];
            });

        $chantiers = \App\Models\Chantier::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->with('client')
            ->get()
            ->map(function ($chantier) {
                return [
                    'id' => $chantier->id,
                    'reference' => $chantier->reference,
                    'name' => $chantier->name,
                    'location' => $chantier->location,
                    'status' => $chantier->status,
                    'progress' => $chantier->progress,
                    'latitude' => (float) $chantier->latitude,
                    'longitude' => (float) $chantier->longitude,
                    'client_name' => $chantier->client ? $chantier->client->name : null,
                    'start_date' => $chantier->start_date,
                    'end_date' => $chantier->end_date,
                ];
            });

        return response()->json([
            'materiels' => $materiels,
            'chantiers' => $chantiers,
        ]);
    }
}
