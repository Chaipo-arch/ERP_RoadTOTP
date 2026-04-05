<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Client;
use App\Models\Chantier;
use App\Models\Employe;
use App\Models\Materiel;
use App\Models\PlanningEvent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Company;
use App\Models\Contrats;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Default Company
        $company = \App\Models\Company::create([
            'name' => 'TP Construction',
            'email' => 'contact@tp-construction.fr',
        ]);

        // 2. Create Admin Role
        $adminRole = \App\Models\Role::create([
            'name' => 'Admin',
            'company_id' => $company->id,
        ]);
        
        // Assign all permissions to Admin Role
        $permissions = \App\Models\Permission::all();
        if ($permissions->isEmpty()) {
             // In case permissions were not seeded by migration (should be, but safety check)
             $modules = [
                'Clients' => ['view', 'create', 'edit', 'delete'],
                'Chantiers' => ['view', 'create', 'edit', 'delete'],
                'Employés' => ['view', 'create', 'edit', 'delete'],
                'Matériels' => ['view', 'create', 'edit', 'delete'],
                'Planning' => ['view', 'edit'],
                'Documents' => ['view', 'create', 'delete'],
                'Administration' => ['view', 'manage_users', 'manage_roles']
            ];

            foreach ($modules as $module => $actions) {
                foreach ($actions as $action) {
                    $slug = strtolower($action . '_' . str_replace('é', 'e', $module));
                    $slug = str_replace(' ', '_', $slug);
                    \App\Models\Permission::create([
                        'name' => ucfirst($action) . ' ' . $module,
                        'slug' => $slug,
                        'module' => $module,
                    ]);
                }
            }
            $permissions = \App\Models\Permission::all();
        }
        $adminRole->permissions()->attach($permissions);

        // 3. Create Admin User linked to Company and Role
        User::create([
            'name' => 'Administrateur',
            'email' => 'admin@roadtotp.fr',
            'password' => 'password',
            'role' => 'admin',
            'company_id' => $company->id,
            'role_id' => $adminRole->id,
        ]);

        // Create clients
        $clients = [
            [
                'name' => 'Mairie de Lyon',
                'type' => 'Public',
                'contact_name' => 'Pierre Duval',
                'email' => 'contact@lyon.fr',
                'phone' => '04 72 10 30 30',
                'address' => '1 Place de la Comédie, 69001 Lyon',
                'siret' => '21690123400019'
            ],
            [
                'name' => 'SCI Batinord',
                'type' => 'Privé',
                'contact_name' => 'Marc Lefebvre',
                'email' => 'contact@batinord.fr',
                'phone' => '04 78 95 12 34',
                'address' => '45 Rue de la République, 69100 Villeurbanne',
                'siret' => '45678912300045'
            ],
            [
                'name' => 'Bouygues Immobilier',
                'type' => 'Privé',
                'contact_name' => 'Sophie Martin',
                'email' => 's.martin@bouygues.com',
                'phone' => '01 55 38 25 00',
                'address' => '3 Boulevard Gallieni, 92130 Issy-les-Moulineaux',
                'siret' => '57209547600012'
            ],
            [
                'name' => 'Métropole de Lyon',
                'type' => 'Public',
                'contact_name' => 'Jean Roux',
                'email' => 'contact@grandlyon.com',
                'phone' => '04 78 63 40 40',
                'address' => '20 Rue du Lac, 69003 Lyon',
                'siret' => '24690001800099'
            ],
            [
                'name' => 'Carrefour Property',
                'type' => 'Privé',
                'contact_name' => 'Anne Dubois',
                'email' => 'a.dubois@carrefour.com',
                'phone' => '01 41 04 26 00',
                'address' => '93 Avenue de Paris, 91300 Massy',
                'siret' => '42148254200088'
            ],
        ];

        foreach ($clients as $client) {
            Client::create(array_merge($client, ['company_id' => $company->id]));
        }

        // Create chantiers
        $chantiers = [
            [
                'reference' => 'CH-2024-001',
                'name' => 'Rénovation Route D47',
                'client_id' => 1,
                'location' => 'Lyon (69)',
                'address' => '123 Route Départementale 47, 69000 Lyon',
                'start_date' => '2024-01-15',
                'end_date' => '2024-06-30',
                'status' => 'En cours',
                'progress' => 75,
                'budget' => 450000,
                'description' => 'Réfection complète du revêtement et des bordures sur 2.5km'
            ],
            [
                'reference' => 'CH-2024-002',
                'name' => 'Terrassement Zone Industrielle',
                'client_id' => 2,
                'location' => 'Villeurbanne (69)',
                'address' => '45 Zone Industrielle Nord, 69100 Villeurbanne',
                'start_date' => '2024-02-01',
                'end_date' => '2024-08-15',
                'status' => 'En cours',
                'progress' => 45,
                'budget' => 280000,
                'description' => 'Terrassement et nivellement pour nouvelle zone commerciale'
            ],
            [
                'reference' => 'CH-2024-003',
                'name' => 'Voirie Lotissement Les Pins',
                'client_id' => 3,
                'location' => 'Caluire (69)',
                'address' => 'Lotissement Les Pins, 69300 Caluire-et-Cuire',
                'start_date' => '2024-04-01',
                'end_date' => '2024-09-30',
                'status' => 'Planifié',
                'progress' => 0,
                'budget' => 520000,
                'description' => 'Création des voiries et réseaux pour nouveau lotissement 85 lots'
            ],
            [
                'reference' => 'CH-2024-004',
                'name' => 'Assainissement Quartier Sud',
                'client_id' => 4,
                'location' => 'Vénissieux (69)',
                'address' => 'Quartier Sud, 69200 Vénissieux',
                'start_date' => '2023-10-01',
                'end_date' => '2024-03-15',
                'status' => 'En cours',
                'progress' => 90,
                'budget' => 380000,
                'description' => 'Rénovation du réseau d\'assainissement et création bassin de rétention'
            ],
            [
                'reference' => 'CH-2024-005',
                'name' => 'Parking Centre Commercial',
                'client_id' => 5,
                'location' => 'Bron (69)',
                'address' => 'Centre Commercial Porte des Alpes, 69500 Bron',
                'start_date' => '2023-08-15',
                'end_date' => '2024-01-31',
                'status' => 'Terminé',
                'progress' => 100,
                'budget' => 320000,
                'description' => 'Extension parking 200 places avec éclairage LED'
            ]
        ];

        foreach ($chantiers as $chantier) {
            Chantier::create(array_merge($chantier, ['company_id' => $company->id]));
        }

        // Create employes
        $employes = [
             [
                'first_name' => 'Jean',
                'last_name' => 'Dupont',
                'email' => 'jean.dupont@roadtotp.fr',
                'phone' => '06 12 34 56 78',
                'job_title' => 'Chef de chantier',
                'department' => 'Direction',
                'status' => 'Actif',
                'company_id' => '1',
                'user_id' => null,
             ],
             [
                'first_name' => 'Marie',
                'last_name' => 'Martin',
                'email' => 'marie.martin@roadtotp.fr',
                'phone' => '06 23 45 67 89',
                'job_title' => 'Conducteur engins',
                'department' => 'Terrassement',
                'status' => 'Actif',
                'company_id' => '1',
                'user_id' => null,
             ],
             [
                'first_name' => 'Pierre',
                'last_name' => 'Bernard',
                'email' => 'pierre.bernard@roadtotp.fr',
                'phone' => '06 34 56 78 90',
                'job_title' => 'Ouvrier VRD',
                'department' => 'Voirie',
                'status' => 'Actif',
                'company_id' => '1',
                'user_id' => null,
             ],
             [
                'first_name' => 'Sophie',
                'last_name' => 'Durand',
                'email' => 'sophie.durand@roadtotp.fr',
                'phone' => '06 45 67 89 01',
                'job_title' => 'Chef équipe',
                'department' => 'Terrassement',
                'status' => 'Actif',
                'company_id' => '1',
                'user_id' => null,
             ],
             [
                'first_name' => 'Michel',
                'last_name' => 'Petit',
                'email' => 'michel.petit@roadtotp.fr',
                'phone' => '06 56 78 90 12',
                'job_title' => 'Conducteur PL',
                'department' => 'Transport',
                'status' => 'Congé',
                'company_id' => '1',
                'user_id' => null,
             ]
        ];

        foreach ($employes as $employe) {
            Employe::create(array_merge($employe, ['company_id' => $company->id]));
        }

        // Create materiels
        $materiels = [
            [
                'name' => 'Pelleteuse CAT 320',
                'type' => 'Engin',
                'immatriculation' => 'TP-001',
                'status' => 'En service',
                'hourly_rate' => 85,
                'last_maintenance' => '2024-01-10',
                'next_maintenance' => '2024-04-10'
            ],
            [
                'name' => 'Compacteur BOMAG',
                'type' => 'Engin',
                'immatriculation' => 'TP-002',
                'status' => 'En service',
                'hourly_rate' => 65,
                'last_maintenance' => '2024-01-05',
                'next_maintenance' => '2024-04-05'
            ],
            [
                'name' => 'Camion Benne MAN',
                'type' => 'Véhicule',
                'immatriculation' => 'AB-123-CD',
                'status' => 'En service',
                'hourly_rate' => 45,
                'last_maintenance' => '2024-02-01',
                'next_maintenance' => '2024-05-01'
            ],
            [
                'name' => 'Mini-Pelle Kubota',
                'type' => 'Engin',
                'immatriculation' => 'TP-003',
                'status' => 'Maintenance',
                'hourly_rate' => 55,
                'last_maintenance' => '2024-02-15',
                'next_maintenance' => '2024-02-20'
            ],
            [
                'name' => 'Bulldozer CAT D6',
                'type' => 'Engin',
                'immatriculation' => 'TP-004',
                'status' => 'Disponible',
                'hourly_rate' => 95,
                'last_maintenance' => '2024-01-20',
                'next_maintenance' => '2024-04-20'
            ],
            [
                'name' => 'Finisseur Vogele',
                'type' => 'Engin',
                'immatriculation' => 'TP-005',
                'status' => 'En service',
                'hourly_rate' => 120,
                'last_maintenance' => '2024-01-25',
                'next_maintenance' => '2024-04-25'
            ]
        ];

        foreach ($materiels as $materiel) {
            Materiel::create(array_merge($materiel, ['company_id' => $company->id]));
        }

        // Create planning events
        $events = [
            ['title' => 'Rénovation Route D47', 'type' => 'chantier', 'date' => '2024-02-15', 'time' => '08:00', 'location' => 'Lyon', 'team' => 'Équipe A', 'chantier_id' => 1],
            ['title' => 'Terrassement Zone Ind.', 'type' => 'chantier', 'date' => '2024-02-16', 'time' => '08:00', 'location' => 'Villeurbanne', 'team' => 'Équipe B', 'chantier_id' => 2],
            ['title' => 'Livraison béton', 'type' => 'livraison', 'date' => '2024-02-17', 'time' => '09:00', 'location' => 'Lyon', 'team' => 'Transport', 'chantier_id' => 1],
            ['title' => 'Maintenance grue GT-45', 'type' => 'maintenance', 'date' => '2024-02-18', 'time' => '14:00', 'location' => 'Atelier', 'team' => 'Maintenance'],
            ['title' => 'Réunion équipe', 'type' => 'reunion', 'date' => '2024-02-19', 'time' => '10:00', 'location' => 'Bureau', 'team' => 'Direction'],
            ['title' => 'Formation sécurité', 'type' => 'formation', 'date' => '2024-02-20', 'time' => '13:30', 'location' => 'Salle A', 'team' => 'Tous'],
            ['title' => 'Inspection chantier', 'type' => 'inspection', 'date' => '2024-02-21', 'time' => '09:00', 'location' => 'Vénissieux', 'team' => 'QSE', 'chantier_id' => 4],
        ];

        foreach ($events as $event) {
            PlanningEvent::create(array_merge($event, ['company_id' => $company->id]));
        }
        //TODO: Add more contrats
        $contrats = [
            [
                'name' => 'CDI',
                'type' => 'CDI',
                
            ],
            [
                'name' => 'CDD',
                'type' => 'CDD',
               
            ],
            [
                'name' => 'Intérim',
                'type' => 'Intérim',
            ],
            [
                'name' => 'Alternance',
                'type' => 'Alternance',
            ],
            [
                'name' => 'Stage',
                'type' => 'Stage',
            ],
        ];

        foreach ($contrats as $contrat) {
            Contrats::create($contrat);
        }

        $this->call([
            LeaveTypeSeeder::class,
        ]);
    }
}
