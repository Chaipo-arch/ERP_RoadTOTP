<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;

class PermissionController extends Controller
{
    public function index()
    {
        // Return permissions grouped by module
        $permissions = Permission::all()->groupBy('module');
        return response()->json($permissions);
    }
}
