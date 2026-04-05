<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class AccrueLeaves extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leaves:accrue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monthly leave accrual';

    /**
     * Execute the console command.
     */
    public function handle(\App\Http\Services\LeaveAccrualService $service)
    {
        $service->accrue();
        $this->info('Leaves accrued');
    }
}
    