<?php
namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Magasins;
use Illuminate\Http\Request;

class MagasinController extends Controller
{
    public function index()
    {
        $magasins = Magasins::all();
        return response()->json([
            'success' => true,
            'data' => $magasins
        ]);
    }
}