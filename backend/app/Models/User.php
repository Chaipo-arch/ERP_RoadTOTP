<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'company_id',
        'role_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function userRole()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function isAdmin(): bool
    {
        // Legacy check or new Role check
        return $this->role === 'admin' || ($this->userRole && $this->userRole->name === 'Admin');
    }

    public function hasPermission($permissionSlug): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if (!$this->userRole) {
            return false;
        }

        // Check if role has the permission
        // Use loaded relationship to avoid N+1 if eager loaded
        return $this->userRole->permissions->contains('slug', $permissionSlug);
    }
    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
    public function employe()
    {
        return $this->hasOne(Employe::class);
    }
    public function user()
    {
        // Laravel cherchera user_id même s'il n'y a pas de FK en base
        return $this->belongsTo(User::class, 'user_id');
    }
}
