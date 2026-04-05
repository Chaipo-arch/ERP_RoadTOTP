<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $leaveTypes = [
            // --- CONGÉS STANDARDS ---
            [
                'name' => 'Congés Payés',
                'accrual_rate' => 2.083, // (25 jours / 12 mois)
                'yearly_cap' => 25,
                'is_paid' => true,
            ],
            [
                'name' => 'RTT',
                'accrual_rate' => 0.916, // Environ 11 jours par an
                'yearly_cap' => 12,
                'is_paid' => true,
            ],
            [
                'name' => 'Congé Sans Solde',
                'accrual_rate' => 0,
                'yearly_cap' => null,
                'is_paid' => false,
            ],

            // --- SANTÉ ---
            [
                'name' => 'Arrêt Maladie',
                'accrual_rate' => 0,
                'yearly_cap' => null,
                'is_paid' => false, // Généralement payé par la sécu/prévoyance, pas l'employeur direct
            ],
            [
                'name' => 'Enfant Malade',
                'accrual_rate' => 0,
                'yearly_cap' => 3,
                'is_paid' => false,
            ],

            // --- ÉVÉNEMENTS FAMILIAUX (Légaux minimum) ---
            [
                'name' => 'Mariage ou PACS (Salarié)',
                'accrual_rate' => 0,
                'yearly_cap' => 4,
                'is_paid' => true,
            ],
            [
                'name' => 'Mariage d\'un enfant',
                'accrual_rate' => 0,
                'yearly_cap' => 1,
                'is_paid' => true,
            ],
            [
                'name' => 'Naissance ou Adoption',
                'accrual_rate' => 0,
                'yearly_cap' => 3,
                'is_paid' => true,
            ],
            [
                'name' => 'Décès d\'un proche (conjoint/parent)',
                'accrual_rate' => 0,
                'yearly_cap' => 3,
                'is_paid' => true,
            ],
            [
                'name' => 'Décès d\'un enfant',
                'accrual_rate' => 0,
                'yearly_cap' => 12, // Loi encadrant le deuil prolongé
                'is_paid' => true,
            ],
        ];

        foreach ($leaveTypes as $type) {
            DB::table('leave_types')->insert(array_merge($type, [
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }
}