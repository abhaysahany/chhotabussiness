<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EntityAuthController;

// Default welcome route
Route::get('/', function () {
    return view('welcome');
});

// Entity Auth Routes
Route::get('/entity/login', [EntityAuthController::class, 'showLogin'])->name('entity.login');
Route::post('/entity/login', [EntityAuthController::class, 'login']);
Route::post('/entity/logout', [EntityAuthController::class, 'logout'])->name('entity.logout');
Route::get('/entity/me', [EntityAuthController::class, 'me']);
Route::get('/entity/info', [EntityAuthController::class, 'info']);

