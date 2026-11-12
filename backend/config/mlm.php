<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Diamond Reward Conversion Rate (INR per 1 Diamond)
    |--------------------------------------------------------------------------
    | Fixed initial conversion rate: ₹100 = 1 Diamond.
    | Diamond Quantity = Allocated Reward Amount (INR) / conversion_rate.
    */
    'diamond_conversion_rate' => (float) env('MLM_DIAMOND_CONVERSION_RATE', 100.00),
];
