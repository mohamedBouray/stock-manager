<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin\Categories;

class CategorieSeeder extends Seeder
{
    public function run()
    {
        $categories = [
            // Bureautique (famille_id = 1)
            ['nom_categorie' => 'Stylos', 'famille_id' => 1],
            ['nom_categorie' => 'Cahiers', 'famille_id' => 1],
            ['nom_categorie' => 'Correcteurs', 'famille_id' => 1],
            ['nom_categorie' => 'Classeurs', 'famille_id' => 1],
            ['nom_categorie' => 'Trombones', 'famille_id' => 1],
            ['nom_categorie' => 'Agrafes', 'famille_id' => 1],
            
            // Papeterie (famille_id = 2)
            ['nom_categorie' => 'Enveloppes', 'famille_id' => 2],
            ['nom_categorie' => 'Etiquettes', 'famille_id' => 2],
            ['nom_categorie' => 'Papier A4', 'famille_id' => 2],
            ['nom_categorie' => 'Papier A3', 'famille_id' => 2],
            ['nom_categorie' => 'Papier Calque', 'famille_id' => 2],
            
            // Informatique (famille_id = 3)
            ['nom_categorie' => 'Souris', 'famille_id' => 3],
            ['nom_categorie' => 'Claviers', 'famille_id' => 3],
            ['nom_categorie' => 'Clés USB', 'famille_id' => 3],
            ['nom_categorie' => 'Câbles HDMI', 'famille_id' => 3],
            ['nom_categorie' => 'Disques durs', 'famille_id' => 3],
            ['nom_categorie' => 'Webcams', 'famille_id' => 3],
            
            // Épicerie (famille_id = 4)
            ['nom_categorie' => 'Conserves', 'famille_id' => 4],
            ['nom_categorie' => 'Pâtes', 'famille_id' => 4],
            ['nom_categorie' => 'Riz', 'famille_id' => 4],
            ['nom_categorie' => 'Huile', 'famille_id' => 4],
            ['nom_categorie' => 'Sucre', 'famille_id' => 4],
            ['nom_categorie' => 'Café', 'famille_id' => 4],
            ['nom_categorie' => 'Thé', 'famille_id' => 4],
            
            // Produits Frais (famille_id = 5)
            ['nom_categorie' => 'Légumes', 'famille_id' => 5],
            ['nom_categorie' => 'Fruits', 'famille_id' => 5],
            ['nom_categorie' => 'Produits laitiers', 'famille_id' => 5],
            ['nom_categorie' => 'Viandes', 'famille_id' => 5],
            
            // Entretien (famille_id = 6)
            ['nom_categorie' => 'Détergents', 'famille_id' => 6],
            ['nom_categorie' => 'Balais', 'famille_id' => 6],
            ['nom_categorie' => 'Serpillères', 'famille_id' => 6],
            ['nom_categorie' => 'Liquide vaisselle', 'famille_id' => 6],
            ['nom_categorie' => 'Lessive', 'famille_id' => 6],
            
            // Hygiène (famille_id = 7)
            ['nom_categorie' => 'Gel hydroalcoolique', 'famille_id' => 7],
            ['nom_categorie' => 'Mouchoirs', 'famille_id' => 7],
            ['nom_categorie' => 'Savon', 'famille_id' => 7],
            ['nom_categorie' => 'Papier toilette', 'famille_id' => 7],
            
            // Fourniture scolaire (famille_id = 9)
            ['nom_categorie' => 'Cartables', 'famille_id' => 9],
            ['nom_categorie' => 'Trousses', 'famille_id' => 9],
            ['nom_categorie' => 'Ardoises', 'famille_id' => 9],
            ['nom_categorie' => 'Règles', 'famille_id' => 9],
            ['nom_categorie' => 'Compas', 'famille_id' => 9],
            ['nom_categorie' => 'Equerres', 'famille_id' => 9],
            
            // Électronique (famille_id = 10)
            ['nom_categorie' => 'Écrans', 'famille_id' => 10],
            ['nom_categorie' => 'Imprimantes', 'famille_id' => 10],
            ['nom_categorie' => 'Scanners', 'famille_id' => 10],
            ['nom_categorie' => 'Chargeurs', 'famille_id' => 10],
        ];

        foreach ($categories as $categorie) {
            Categories::create($categorie);
        }
    }
}