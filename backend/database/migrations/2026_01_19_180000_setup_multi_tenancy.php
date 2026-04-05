<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create Companies table
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('siret')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->timestamps();
        });
        
        // Insert a default company
        $defaultCompanyId = DB::table('companies')->insertGetId([
            'name' => 'Mon Entreprise',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Add company_id to Users and other tables
        $tables = ['users', 'clients', 'chantiers', 'employes', 'materiels', 'planning_events', 'documents'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($defaultCompanyId) {
                    if (!Schema::hasColumn($table->getTable(), 'company_id')) {
                        $table->foreignId('company_id')->nullable()->default($defaultCompanyId)->constrained()->onDelete('cascade');
                    }
                });
            }
        }

        // 3. Create Roles and Permissions
        Schema::create('roles', function (Blueprint $table) use ($defaultCompanyId) {
            $table->id();
            $table->string('name');
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique(); // e.g., 'view_clients'
            $table->string('module'); // e.g., 'Clients'
            $table->timestamps();
        });

        Schema::create('role_has_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->foreignId('permission_id')->constrained()->onDelete('cascade');
            $table->unique(['role_id', 'permission_id']);
        });

        // 4. Update Users to have role_id
        Schema::table('users', function (Blueprint $table) {
             $table->foreignId('role_id')->nullable()->constrained('roles')->onDelete('set null');
        });

        // Seed default permissions
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
                // normalize slug
                $slug = strtolower($action . '_' . str_replace('é', 'e', $module));
                $slug = str_replace(' ', '_', $slug);
                
                DB::table('permissions')->insertOrIgnore([
                    'name' => ucfirst($action) . ' ' . $module,
                    'slug' => $slug,
                    'module' => $module,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // Create a default Admin role for the default company and assign all permissions
        $adminRoleId = DB::table('roles')->insertGetId([
            'name' => 'Admin',
            'company_id' => $defaultCompanyId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        $permissions = DB::table('permissions')->pluck('id');
        foreach ($permissions as $permissionId) {
            DB::table('role_has_permissions')->insert([
                'role_id' => $adminRoleId,
                'permission_id' => $permissionId
            ]);
        }
        
        // Update existing users to be Admin if they have role='admin'
        DB::table('users')->where('role', 'admin')->update(['role_id' => $adminRoleId]);
    }

    public function down(): void
    {
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('permissions');
        
        if (Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function(Blueprint $table) {
                $table->dropForeign(['role_id']);
                $table->dropColumn('role_id');
            });
        }
        
        Schema::dropIfExists('roles');

        $tables = ['users', 'clients', 'chantiers', 'employes', 'materiels', 'planning_events', 'documents'];
        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                if (Schema::hasColumn($tableName, 'company_id')) {
                    Schema::table($tableName, function (Blueprint $table) {
                        $table->dropForeign(['company_id']);
                        $table->dropColumn('company_id');
                    });
                }
            }
        }
        
        Schema::dropIfExists('companies');
    }
};
