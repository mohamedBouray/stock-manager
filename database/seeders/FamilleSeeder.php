<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin\Famille;

class FamilleSeeder extends Seeder
{
    public function run()
    {
        $familles = [
            ['nom_famille' => 'Bureautique'],
            ['nom_famille' => 'Papeterie'],
            ['nom_famille' => 'Informatique'],
            ['nom_famille' => 'Épicerie'],
            ['nom_famille' => 'Produits Frais'],
            ['nom_famille' => 'Entretien'],
            ['nom_famille' => 'Hygiène'],
            ['nom_famille' => 'Matériel de bureau'],
            ['nom_famille' => 'Fourniture scolaire'],
            ['nom_famille' => 'Électronique'],
        ];

        foreach ($familles as $famille) {
            Famille::create($famille);
        }
    }
}