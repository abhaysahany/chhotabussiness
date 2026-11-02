<?php

namespace App\Models;

/**
 * Class SalesRecord
 * 
 * @deprecated Use \App\Models\Order instead. Kept for complete backward compatibility.
 * @package App\Models
 */
class SalesRecord extends Order
{
    /**
     * Canonical database table for orders.
     */
    protected $table = 'orders';
}
