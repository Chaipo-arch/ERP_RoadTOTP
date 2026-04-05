<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class Message extends Model
{
    use BelongsToCompany;
    protected $fillable = ['conversation_id', 'role', 'content', 'tool_calls', 'company_id'];

    protected $casts = [
        'tool_calls' => 'array',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
}
