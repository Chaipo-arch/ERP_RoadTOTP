<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Employe;
use App\Models\LeaveType;
use App\Models\LeaveBalance;

class InitLeaveBalances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leaves:init-balances';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initialise les soldes de congés à 0 pour tous les employés et tous les types de congés';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Début de l'initialisation des soldes de congés...");

        // On prend tous les employés (actifs ou non) ou seulement les actifs selon ton choix
        // Ici on prend tout le monde pour être sûr d'avoir la donnée de base.
        $employes = Employe::all();
        $leaveTypes = LeaveType::all();

        $count = 0;

        foreach ($employes as $employe) {
            foreach ($leaveTypes as $leaveType) {
                // firstOrCreate va soit récupérer si ça existe déjà (donc ne rien écraser si l'employé a déjà cumulé), soit créer à 0
                $balance = LeaveBalance::firstOrCreate(
                    [
                        'employe_id' => $employe->id,
                        'leave_type_id' => $leaveType->id,
                    ],
                    [
                        'balance' => 0
                    ]
                );

                if ($balance->wasRecentlyCreated) {
                    $count++;
                }
            }
        }

        $this->info("Terminé ! $count nouveaux soldes de congés ont été créés et initialisés à 0.");
    }
}
