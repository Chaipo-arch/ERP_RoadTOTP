<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\User;
use App\Mail\InvitationMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;
use Carbon\Carbon;

class UserController extends Controller
{
    /**
     * Admin sends an invitation email to a new user.
     */
    public function invite(Request $request): JsonResponse
    {
        // Only admin can invite users
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        // Check if an active invitation already exists for this email
        $existingInvitation = Invitation::where('email', $request->email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'message' => 'Une invitation active existe déjà pour cet email.'
            ], 422);
        }

        // Create the invitation
        $invitation = Invitation::create([
            'email' => $request->email,
            'token' => Invitation::generateToken(),
            'role_id' => $request->role_id,
            'company_id' => $request->user()->company_id,
            'invited_by' => $request->user()->id,
            'expires_at' => Carbon::now()->addHours(48),
        ]);

        // Send the invitation email
        Mail::to($request->email)->send(new InvitationMail($invitation));

        return response()->json([
            'message' => 'Invitation envoyée avec succès à ' . $request->email,
            'invitation' => $invitation,
        ], 201);
    }

    /**
     * Validate an invitation token (called by the frontend setup-password page).
     */
    public function validateToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
        ]);

        $invitation = Invitation::where('token', $request->token)
            ->where('email', $request->email)
            ->first();

        if (!$invitation) {
            return response()->json(['message' => 'Invitation introuvable.'], 404);
        }

        if ($invitation->used_at) {
            return response()->json(['message' => 'Cette invitation a déjà été utilisée.'], 410);
        }

        if ($invitation->expires_at->isPast()) {
            return response()->json(['message' => 'Cette invitation a expiré.'], 410);
        }

        return response()->json([
            'valid' => true,
            'email' => $invitation->email,
            'company' => $invitation->company->name ?? null,
        ]);
    }

    /**
     * Setup password and create the user account from invitation.
     */
    public function setupPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $invitation = Invitation::where('token', $request->token)
            ->where('email', $request->email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$invitation) {
            return response()->json([
                'message' => 'Invitation invalide, expirée ou déjà utilisée.'
            ], 422);
        }

        // Check email not already taken (race condition guard)
        if (User::where('email', $request->email)->exists()) {
            return response()->json([
                'message' => 'Un compte existe déjà avec cet email.'
            ], 422);
        }

        // Create the user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'company_id' => $invitation->company_id,
            'role_id' => $invitation->role_id,
        ]);

        // Mark invitation as used
        $invitation->update(['used_at' => now()]);

        return response()->json([
            'message' => 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.',
            'user' => $user,
        ], 201);
    }

    /**
     * List all pending invitations (admin only).
     */
    public function invitations(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $invitations = Invitation::where('company_id', $request->user()->company_id)
            ->with(['role', 'inviter'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($inv) {
                return [
                    'id' => $inv->id,
                    'email' => $inv->email,
                    'role' => $inv->role->name ?? 'N/A',
                    'invited_by' => $inv->inviter->name ?? 'N/A',
                    'created_at' => $inv->created_at->format('d/m/Y H:i'),
                    'expires_at' => $inv->expires_at->format('d/m/Y H:i'),
                    'status' => $inv->used_at ? 'Utilisée' : ($inv->expires_at->isPast() ? 'Expirée' : 'En attente'),
                ];
            });

        return response()->json($invitations);
    }

    /**
     * Legacy store method - kept for backward compatibility but
     * redirects to the invitation flow.
     */
    public function store(Request $request): JsonResponse
    {
        // Redirect to invite flow
        return $this->invite($request);
    }
}
