<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ==================== 1. VIDER LES TABLES ====================
        $this->command->info('🗑️ Vidage des tables...');
        
        DB::statement('PRAGMA foreign_keys=OFF');
        
        $tables = [
            'transferts_articles', 'retours_magasin', 'inventaire_lignes', 'inventaires',
            'lignes_bon_reception', 'bons_receptions', 'lignes_commande', 'commandes_fournisseurs',
            'mouvements', 'stocks', 'article_magasin', 'reservations', 'demandes',
            'notifications', 'messages', 'conversations', 'user_activities',
            'articles', 'categories', 'familles', 'magasins', 'users', 'settings'
        ];
        
        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }
        
        DB::statement('PRAGMA foreign_keys=ON');
        
        // ==================== 2. CRÉATION DES MAGASINS ====================
        $this->command->info('🏪 Création des magasins...');
        
        $magasins = [
            ['nom_magasin' => 'Magasin Principal - Bâtiment A', 'localisation' => 'Bâtiment A - Rez-de-chaussée - ISTAHT Tanger'],
            ['nom_magasin' => 'Magasin Satellite - Bâtiment B', 'localisation' => 'Bâtiment B - Étage 1 - ISTAHT Tanger'],
            ['nom_magasin' => 'Magasin Matières Premières', 'localisation' => 'Dépôt central - Zone Franche Tanger'],
            ['nom_magasin' => 'Magasin Produits Finis', 'localisation' => 'Zone industrielle - Tanger Automotive City'],
            ['nom_magasin' => 'Magasin Consommables', 'localisation' => 'Bureau administratif - Rue de Fès, Tanger'],
            ['nom_magasin' => 'Magasin Pédagogique', 'localisation' => 'Département Hôtellerie - ISTAHT Tanger'],
        ];
        
        $magasinIds = [];
        foreach ($magasins as $magasin) {
            $id = DB::table('magasins')->insertGetId([
                'nom_magasin' => $magasin['nom_magasin'],
                'localisation' => $magasin['localisation'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $magasinIds[] = $id;
        }
        
        // ==================== 3. CRÉATION DES FAMILLES ====================
        $this->command->info('📁 Création des familles...');
        
        $familles = [
            'Produits alimentaires',
            'Produits d\'entretien',
            'Matériel de bureau',
            'Équipement de cuisine',
            'Produits de papeterie',
            'Boissons',
            'Viandes et poissons',
            'Légumes et fruits',
            'Produits laitiers',
            'Pâtisserie et boulangerie',
            'Hygiène et beauté',
            'Matériel hôtelier'
        ];
        
        $familleIds = [];
        foreach ($familles as $famille) {
            $id = DB::table('familles')->insertGetId([
                'nom_famille' => $famille,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $familleIds[$famille] = $id;
        }
        
        // ==================== 4. CRÉATION DES CATÉGORIES ====================
        $this->command->info('📂 Création des catégories...');

        $categories = [
            // Produits alimentaires
            ['nom_categorie' => 'Produits secs', 'famille_id' => $familleIds['Produits alimentaires']],
            ['nom_categorie' => 'Conserves', 'famille_id' => $familleIds['Produits alimentaires']],
            ['nom_categorie' => 'Pâtes et riz', 'famille_id' => $familleIds['Produits alimentaires']],
            ['nom_categorie' => 'Épices', 'famille_id' => $familleIds['Produits alimentaires']],
            
            // Produits d'entretien
            ['nom_categorie' => 'Détergents', 'famille_id' => $familleIds['Produits d\'entretien']],
            ['nom_categorie' => 'Désinfectants', 'famille_id' => $familleIds['Produits d\'entretien']],
            
            // Papeterie
            ['nom_categorie' => 'Papeterie', 'famille_id' => $familleIds['Produits de papeterie']],
            
            // Équipement cuisine
            ['nom_categorie' => 'Ustensiles', 'famille_id' => $familleIds['Équipement de cuisine']],
            ['nom_categorie' => 'Petit électroménager', 'famille_id' => $familleIds['Équipement de cuisine']],
            ['nom_categorie' => 'Batterie de cuisine', 'famille_id' => $familleIds['Équipement de cuisine']],
            
            // Boissons
            ['nom_categorie' => 'Boissons chaudes', 'famille_id' => $familleIds['Boissons']],
            ['nom_categorie' => 'Boissons froides', 'famille_id' => $familleIds['Boissons']],
            
            // Viandes et poissons
            ['nom_categorie' => 'Viandes rouges', 'famille_id' => $familleIds['Viandes et poissons']],
            ['nom_categorie' => 'Poissons', 'famille_id' => $familleIds['Viandes et poissons']],
            ['nom_categorie' => 'Volailles', 'famille_id' => $familleIds['Viandes et poissons']],
            
            // Légumes et fruits
            ['nom_categorie' => 'Légumes frais', 'famille_id' => $familleIds['Légumes et fruits']],
            ['nom_categorie' => 'Fruits', 'famille_id' => $familleIds['Légumes et fruits']],
            
            // Produits laitiers
            ['nom_categorie' => 'Produits laitiers', 'famille_id' => $familleIds['Produits laitiers']],
            ['nom_categorie' => 'Fromages', 'famille_id' => $familleIds['Produits laitiers']],
            ['nom_categorie' => 'Yaourts', 'famille_id' => $familleIds['Produits laitiers']],
            
            // Pâtisserie et boulangerie
            ['nom_categorie' => 'Pains', 'famille_id' => $familleIds['Pâtisserie et boulangerie']],
            ['nom_categorie' => 'Viennoiseries', 'famille_id' => $familleIds['Pâtisserie et boulangerie']],
            ['nom_categorie' => 'Pâtisseries', 'famille_id' => $familleIds['Pâtisserie et boulangerie']],
            
            // Hygiène
            ['nom_categorie' => 'Hygiène', 'famille_id' => $familleIds['Hygiène et beauté']],
            ['nom_categorie' => 'Cosmétiques', 'famille_id' => $familleIds['Hygiène et beauté']],
            
            // Matériel hôtelier
            ['nom_categorie' => 'Literie', 'famille_id' => $familleIds['Matériel hôtelier']],
            ['nom_categorie' => 'Vaisselle', 'famille_id' => $familleIds['Matériel hôtelier']],
        ];

        $categorieIds = [];
        foreach ($categories as $categorie) {
            $id = DB::table('categories')->insertGetId([
                'nom_categorie' => $categorie['nom_categorie'],
                'famille_id' => $categorie['famille_id'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $categorieIds[$categorie['nom_categorie']] = $id;
        }
        
        // ==================== 5. CRÉATION DES ARTICLES ====================
        $this->command->info('📦 Création des articles...');
        
        $articles = [
            // Produits alimentaires
            ['code_barre' => '611000000001', 'designation' => 'Riz basmati 1kg', 'description' => 'Riz long grain importé d\'Inde', 'unite_mesure' => 'Kg', 'seuil_alerte' => 10, 'prix_unitaire' => 25.00, 'categorie_id' => $categorieIds['Produits secs']],
            ['code_barre' => '611000000002', 'designation' => 'Farine T55 1kg', 'description' => 'Farine de blé pour pâtisserie', 'unite_mesure' => 'Kg', 'seuil_alerte' => 15, 'prix_unitaire' => 8.50, 'categorie_id' => $categorieIds['Produits secs']],
            ['code_barre' => '611000000003', 'designation' => 'Sucre en poudre 1kg', 'description' => 'Sucre blanc cristallisé', 'unite_mesure' => 'Kg', 'seuil_alerte' => 10, 'prix_unitaire' => 12.00, 'categorie_id' => $categorieIds['Produits secs']],
            ['code_barre' => '611000000004', 'designation' => 'Huile d\'olive 1L', 'description' => 'Huile d\'olive vierge extra - région de Taza', 'unite_mesure' => 'Litre', 'seuil_alerte' => 8, 'prix_unitaire' => 65.00, 'categorie_id' => $categorieIds['Produits secs']],
            ['code_barre' => '611000000005', 'designation' => 'Concentré tomate 500g', 'description' => 'Double concentré - Centrale Danone', 'unite_mesure' => 'Boite', 'seuil_alerte' => 20, 'prix_unitaire' => 15.00, 'categorie_id' => $categorieIds['Conserves']],
            ['code_barre' => '611000000006', 'designation' => 'Couscous moyen 1kg', 'description' => 'Couscous de blé dur', 'unite_mesure' => 'Kg', 'seuil_alerte' => 12, 'prix_unitaire' => 18.00, 'categorie_id' => $categorieIds['Pâtes et riz']],
            
            // Épices
            ['code_barre' => '611000000007', 'designation' => 'Ras El Hanout 100g', 'description' => 'Mélange d\'épices marocain', 'unite_mesure' => 'Sachet', 'seuil_alerte' => 10, 'prix_unitaire' => 22.00, 'categorie_id' => $categorieIds['Épices']],
            ['code_barre' => '611000000008', 'designation' => 'Safran 5g', 'description' => 'Safran pur de Taliouine', 'unite_mesure' => 'Sachet', 'seuil_alerte' => 5, 'prix_unitaire' => 85.00, 'categorie_id' => $categorieIds['Épices']],
            
            // Produits d'entretien
            ['code_barre' => '611000000009', 'designation' => 'Liquide vaisselle 1L', 'description' => 'Liquide vaisselle citron - Paic', 'unite_mesure' => 'Litre', 'seuil_alerte' => 5, 'prix_unitaire' => 18.00, 'categorie_id' => $categorieIds['Détergents']],
            ['code_barre' => '611000000010', 'designation' => 'Désinfectant sol 2L', 'description' => 'Désinfectant multi-surfaces', 'unite_mesure' => 'Litre', 'seuil_alerte' => 8, 'prix_unitaire' => 32.00, 'categorie_id' => $categorieIds['Désinfectants']],
            ['code_barre' => '611000000011', 'designation' => 'Éponge grattoir', 'description' => 'Éponge double face Scotch-Brite', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 15, 'prix_unitaire' => 6.00, 'categorie_id' => $categorieIds['Détergents']],
            
            // Papeterie
            ['code_barre' => '611000000012', 'designation' => 'Papier A4 80g', 'description' => 'Ramette 500 feuilles - Clairefontaine', 'unite_mesure' => 'Ramette', 'seuil_alerte' => 10, 'prix_unitaire' => 45.00, 'categorie_id' => $categorieIds['Papeterie']],
            ['code_barre' => '611000000013', 'designation' => 'Stylo bille bleu', 'description' => 'Stylo Bic pointe fine', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 50, 'prix_unitaire' => 2.50, 'categorie_id' => $categorieIds['Papeterie']],
            ['code_barre' => '611000000014', 'designation' => 'Marqueur permanent noir', 'description' => 'Pointe ronde 1.5mm', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 20, 'prix_unitaire' => 5.00, 'categorie_id' => $categorieIds['Papeterie']],
            
            // Boissons
            ['code_barre' => '611000000015', 'designation' => 'Café moulu 250g', 'description' => 'Café arabica 100% - Lavazza', 'unite_mesure' => 'Paquet', 'seuil_alerte' => 6, 'prix_unitaire' => 38.00, 'categorie_id' => $categorieIds['Boissons chaudes']],
            ['code_barre' => '611000000016', 'designation' => 'Thé vert 100g', 'description' => 'Thé vert gunpowder - Sultan', 'unite_mesure' => 'Boite', 'seuil_alerte' => 5, 'prix_unitaire' => 28.00, 'categorie_id' => $categorieIds['Boissons chaudes']],
            ['code_barre' => '611000000017', 'designation' => 'Jus d\'orange 1L', 'description' => 'Jus pur fruit - Tropicana', 'unite_mesure' => 'Litre', 'seuil_alerte' => 12, 'prix_unitaire' => 22.00, 'categorie_id' => $categorieIds['Boissons froides']],
            
            // Viandes
            ['code_barre' => '611000000018', 'designation' => 'Filet de poulet 1kg', 'description' => 'Filet sans os - élevage local', 'unite_mesure' => 'Kg', 'seuil_alerte' => 5, 'prix_unitaire' => 55.00, 'categorie_id' => $categorieIds['Volailles']],
            ['code_barre' => '611000000019', 'designation' => 'Saumon frais 500g', 'description' => 'Saumon norvégien', 'unite_mesure' => 'Kg', 'seuil_alerte' => 4, 'prix_unitaire' => 120.00, 'categorie_id' => $categorieIds['Poissons']],
            ['code_barre' => '611000000020', 'designation' => 'Viande hachée 1kg', 'description' => 'Viande bovine hachée 15% matière grasse', 'unite_mesure' => 'Kg', 'seuil_alerte' => 8, 'prix_unitaire' => 90.00, 'categorie_id' => $categorieIds['Viandes rouges']],
            
            // Légumes et fruits
            ['code_barre' => '611000000021', 'designation' => 'Tomates fraîches', 'description' => 'Tomates locales de saison', 'unite_mesure' => 'Kg', 'seuil_alerte' => 10, 'prix_unitaire' => 8.00, 'categorie_id' => $categorieIds['Légumes frais']],
            ['code_barre' => '611000000022', 'designation' => 'Pommes Golden', 'description' => 'Pommes importées', 'unite_mesure' => 'Kg', 'seuil_alerte' => 8, 'prix_unitaire' => 15.00, 'categorie_id' => $categorieIds['Fruits']],
            
            // Produits laitiers
            ['code_barre' => '611000000023', 'designation' => 'Lait demi-écrémé 1L', 'description' => 'Lait UHT - Centrale Danone', 'unite_mesure' => 'Litre', 'seuil_alerte' => 15, 'prix_unitaire' => 9.00, 'categorie_id' => $categorieIds['Produits laitiers']],
            ['code_barre' => '611000000024', 'designation' => 'Beurre doux 250g', 'description' => 'Beurre de baratte - Elle & Vire', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 10, 'prix_unitaire' => 18.00, 'categorie_id' => $categorieIds['Produits laitiers']],
            ['code_barre' => '611000000025', 'designation' => 'Emmental râpé 200g', 'description' => 'Fromage râpé Président', 'unite_mesure' => 'Sachet', 'seuil_alerte' => 8, 'prix_unitaire' => 32.00, 'categorie_id' => $categorieIds['Fromages']],
            
            // Pâtisserie
            ['code_barre' => '611000000026', 'designation' => 'Pain de mie 500g', 'description' => 'Pain de mie complet', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 7, 'prix_unitaire' => 12.00, 'categorie_id' => $categorieIds['Pains']],
            
            // Hygiène
            ['code_barre' => '611000000027', 'designation' => 'Savon liquide 500ml', 'description' => 'Savon mains antibactérien', 'unite_mesure' => 'Flacon', 'seuil_alerte' => 6, 'prix_unitaire' => 25.00, 'categorie_id' => $categorieIds['Hygiène']],
            ['code_barre' => '611000000028', 'designation' => 'Papier toilette', 'description' => 'Pack 12 rouleaux', 'unite_mesure' => 'Pack', 'seuil_alerte' => 5, 'prix_unitaire' => 45.00, 'categorie_id' => $categorieIds['Hygiène']],
            
            // Matériel hôtelier
            ['code_barre' => '611000000029', 'designation' => 'Assiette plate 27cm', 'description' => 'Porcelaine blanche - Revol', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 20, 'prix_unitaire' => 35.00, 'categorie_id' => $categorieIds['Vaisselle']],
            ['code_barre' => '611000000030', 'designation' => 'Verre à eau 30cl', 'description' => 'Verre cristal - Duralex', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 30, 'prix_unitaire' => 8.00, 'categorie_id' => $categorieIds['Vaisselle']],
        ];
        
        $articleIds = [];
        foreach ($articles as $article) {
            $id = DB::table('articles')->insertGetId([
                'code_barre' => $article['code_barre'],
                'designation' => $article['designation'],
                'description' => $article['description'],
                'unite_mesure' => $article['unite_mesure'],
                'seuil_alerte' => $article['seuil_alerte'],
                'seuil_critique' => max(2, floor($article['seuil_alerte'] / 2)),
                'prix_unitaire' => $article['prix_unitaire'],
                'categorie_id' => $article['categorie_id'],
                'statut' => 'actif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $articleIds[$article['designation']] = $id;
        }
        
        // ==================== 6. AFFECTATION ARTICLES AUX MAGASINS ====================
        $this->command->info('🔗 Affectation des articles aux magasins...');

        foreach ($articleIds as $articleId) {
            // Chaque article est dans 2-4 magasins
            $randomMagasins = array_rand(array_flip($magasinIds), rand(2, 4));
            foreach ((array)$randomMagasins as $magasinId) {
                DB::table('article_magasin')->insert([
                    'article_id' => $articleId,
                    'magasins_id' => $magasinId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 7. CRÉATION DES STOCKS INITIAUX ====================
        $this->command->info('💾 Création des stocks initiaux...');

        foreach ($articleIds as $articleId) {
            $magasinsArticle = DB::table('article_magasin')
                ->where('article_id', $articleId)
                ->pluck('magasins_id')
                ->toArray();
            
            foreach ($magasinsArticle as $magasinId) {
                $quantite = rand(15, 200);
                DB::table('stocks')->insert([
                    'article_id' => $articleId,
                    'magasin_id' => $magasinId,
                    'quantite_disponible' => $quantite,
                    'quantite_reservee' => rand(0, 10),
                    'emplacement_code' => 'RACK-' . str_pad(rand(1, 50), 2, '0', STR_PAD_LEFT),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 8. CRÉATION DES UTILISATEURS ====================
        $this->command->info('👤 Création des utilisateurs...');
        
        $users = [
            // Admins
            ['name' => 'Admin Principal', 'email' => 'admin@istaht.ma', 'role' => 'admin', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Mohammed Alami', 'email' => 'mohammed.alami@istaht.ma', 'role' => 'admin', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Khadija Bennani', 'email' => 'khadija.bennani@istaht.ma', 'role' => 'admin', 'password' => 'password123', 'magasin_id' => null],
            
            // Magasiniers
            ['name' => 'Fatima Zahra', 'email' => 'fatima.zahra@istaht.ma', 'role' => 'magasinier', 'password' => 'password123', 'magasin_id' => $magasinIds[0]],
            ['name' => 'Karim Tazi', 'email' => 'karim.tazi@istaht.ma', 'role' => 'magasinier', 'password' => 'password123', 'magasin_id' => $magasinIds[1]],
            ['name' => 'Sanaa El Fassi', 'email' => 'sanaa.elfassi@istaht.ma', 'role' => 'magasinier', 'password' => 'password123', 'magasin_id' => $magasinIds[2]],
            ['name' => 'Youssef Belhaj', 'email' => 'youssef.belhaj@istaht.ma', 'role' => 'magasinier', 'password' => 'password123', 'magasin_id' => $magasinIds[3]],
            ['name' => 'Rachid El Malki', 'email' => 'rachid.elmalki@istaht.ma', 'role' => 'magasinier', 'password' => 'password123', 'magasin_id' => $magasinIds[4]],
            
            // Demandeurs (personnel de l'ISTAHT)
            ['name' => 'Amina Benjelloun', 'email' => 'amina.benjelloun@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Hassan El Mansouri', 'email' => 'hassan.elmansouri@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Leila Othmani', 'email' => 'leila.othmani@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Omar Chraibi', 'email' => 'omar.chraibi@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Nadia Skalli', 'email' => 'nadia.skalli@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Mehdi El Fadili', 'email' => 'mehdi.elfadili@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Salma Bennani', 'email' => 'salma.bennani@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Redouane Berrada', 'email' => 'redouane.berrada@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Fatima Ezzahra', 'email' => 'fatima.ezzahra@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Hicham Bennis', 'email' => 'hicham.bennis@istaht.ma', 'role' => 'user', 'password' => 'password123', 'magasin_id' => null],
        ];
        
        $userIds = [];
        foreach ($users as $user) {
            $id = DB::table('users')->insertGetId([
                'name' => $user['name'],
                'email' => $user['email'],
                'password' => Hash::make($user['password']),
                'role' => $user['role'],
                'magasin_id' => $user['magasin_id'],
                'email_verified_at' => now(),
                'phone' => '06' . rand(10000000, 99999999),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $userIds[$user['name']] = $id;
        }
        
        // ==================== 9. CRÉATION DES DEMANDES ====================
        $this->command->info('📋 Création des demandes...');

        $statuts = ['en_attente', 'approuvee', 'refusee', 'livree'];
        $articlesList = array_values($articleIds);
        $demandeurs = array_slice($userIds, -10, 10);
        
        $magasiniersIds = [$userIds['Fatima Zahra'], $userIds['Karim Tazi'], $userIds['Sanaa El Fassi'], $userIds['Youssef Belhaj']];
        $adminsIds = [$userIds['Admin Principal'], $userIds['Mohammed Alami'], $userIds['Khadija Bennani']];
        $traiteParIds = array_merge($adminsIds, $magasiniersIds);
        
        $motifsListe = [
            'Besoin pour les ateliers pratiques',
            'Routine hebdomadaire',
            'Stock épuisé',
            'Commande spéciale pour formation',
            'Événement pédagogique',
            'Remplacement matériel défectueux',
            'Préparation examens fin d\'année',
            'Besoins du restaurant pédagogique',
            'Commande urgente',
            'Renouvellement inventaire'
        ];

        for ($i = 1; $i <= 80; $i++) {
            $statut = $statuts[array_rand($statuts)];
            $articleId = $articlesList[array_rand($articlesList)];
            $quantite = rand(1, 25);
            $quantiteAccorde = in_array($statut, ['approuvee', 'livree']) ? rand(1, $quantite) : null;
            
            $traitePar = in_array($statut, ['approuvee', 'refusee', 'livree']) 
                ? $traiteParIds[array_rand($traiteParIds)] 
                : null;
            
            $dateDemande = Carbon::now()->subDays(rand(0, 45));
            $dateTraitement = in_array($statut, ['approuvee', 'refusee', 'livree']) 
                ? Carbon::parse($dateDemande)->addDays(rand(1, 10)) 
                : null;
            
            $demandeId = DB::table('demandes')->insertGetId([
                'user_id' => $demandeurs[array_rand($demandeurs)],
                'article_id' => $articleId,
                'quantite_demandee' => $quantite,
                'quantite_accorde' => $quantiteAccorde,
                'statut' => $statut,
                'motif' => $motifsListe[array_rand($motifsListe)] . ' - N°' . $i,
                'date_demande' => $dateDemande,
                'date_traitement' => $dateTraitement,
                'traite_par' => $traitePar,
                'created_at' => $dateDemande,
                'updated_at' => $dateTraitement ?? $dateDemande,
            ]);
            
            // Ajouter des retours pour certaines demandes livrées
            if ($statut === 'livree' && rand(1, 10) <= 4 && $quantiteAccorde > 0) {
                $retourStatuts = ['en_attente', 'approuve', 'refuse'];
                $retourMotifs = ['Produit défectueux', 'Erreur de commande', 'Produit endommagé', 'Date de péremption dépassée', 'Colis incomplet'];
                
                DB::table('retours_magasin')->insert([
                    'demande_id' => $demandeId,
                    'article_id' => $articleId,
                    'quantite' => rand(1, min(5, $quantiteAccorde)),
                    'motif' => $retourMotifs[array_rand($retourMotifs)],
                    'statut' => $retourStatuts[array_rand($retourStatuts)],
                    'user_id' => $demandeurs[array_rand($demandeurs)],
                    'created_at' => Carbon::parse($dateTraitement ?? now())->addDays(rand(1, 5)),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 10. CRÉATION DES RÉSERVATIONS ====================
        $this->command->info('📅 Création des réservations...');
        
        $reservationStatuts = ['en_attente', 'confirmee', 'annulee', 'expiree'];
        
        for ($i = 1; $i <= 40; $i++) {
            $statut = $reservationStatuts[array_rand($reservationStatuts)];
            $dateDebut = Carbon::now()->addDays(rand(1, 30));
            $dateFin = Carbon::parse($dateDebut)->addDays(rand(2, 15));
            
            DB::table('reservations')->insert([
                'user_id' => $demandeurs[array_rand($demandeurs)],
                'article_id' => $articlesList[array_rand($articlesList)],
                'quantite' => rand(1, 15),
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'statut' => $statut,
                'motif' => ['Atelier pratique', 'Formation continue', 'Séminaire', 'Démonstration', 'Projet étudiant'][array_rand(['Atelier pratique', 'Formation continue', 'Séminaire', 'Démonstration', 'Projet étudiant'])],
                'created_at' => Carbon::now()->subDays(rand(1, 20)),
                'updated_at' => now(),
            ]);
        }
        
        // ==================== 11. CRÉATION DES COMMANDES FOURNISSEURS ====================
        $this->command->info('📦 Création des commandes fournisseurs...');
        
        $fournisseurs = [
            'Ministère du Tourisme - Direction Tanger',
            'Metro Maroc - Tanger',
            'Carrefour Supply - Tanger',
            'Bidfood Maroc - Casablanca',
            'Distri Maroc - Tanger',
            'Horeca Supply - Tétouan',
            'El Mostafa Distribution - Tanger'
        ];
        $statutsCommande = ['envoyee', 'partiellement_livree', 'livree_totalement'];
        
        for ($i = 1; $i <= 25; $i++) {
            $commandeId = DB::table('commandes_fournisseurs')->insertGetId([
                'numero_commande' => 'BC-' . date('Y') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'fournisseur' => $fournisseurs[array_rand($fournisseurs)],
                'date_commande' => Carbon::now()->subDays(rand(1, 50)),
                'statut' => $statutsCommande[array_rand($statutsCommande)],
                'created_at' => Carbon::now()->subDays(rand(1, 50)),
                'updated_at' => now(),
            ]);
            
            // Lignes de commande
            $nbLignes = rand(2, 10);
            for ($j = 0; $j < $nbLignes; $j++) {
                $articleId = $articlesList[array_rand($articlesList)];
                $quantiteCommandee = rand(20, 200);
                $quantiteLivree = rand(0, $quantiteCommandee);
                
                DB::table('lignes_commande')->insert([
                    'commande_id' => $commandeId,
                    'article_id' => $articleId,
                    'quantite_commandee' => $quantiteCommandee,
                    'quantite_livree' => $quantiteLivree,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 12. CRÉATION DES BONS DE RÉCEPTION ====================
        $this->command->info('📄 Création des bons de réception...');
        
        $commandes = DB::table('commandes_fournisseurs')->get();
        
        foreach ($commandes as $commande) {
            if (rand(1, 10) <= 6) {
                $bonId = DB::table('bons_receptions')->insertGetId([
                    'commande_id' => $commande->id,
                    'numero_bon' => 'BR-' . date('Ymd') . '-' . str_pad($commande->id, 3, '0', STR_PAD_LEFT),
                    'date_reception' => Carbon::parse($commande->date_commande)->addDays(rand(3, 12)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                $lignesCommande = DB::table('lignes_commande')
                    ->where('commande_id', $commande->id)
                    ->get();
                
                foreach ($lignesCommande as $ligne) {
                    if ($ligne->quantite_livree > 0) {
                        DB::table('lignes_bon_reception')->insert([
                            'bon_reception_id' => $bonId,
                            'article_id' => $ligne->article_id,
                            'quantite_recue' => $ligne->quantite_livree,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }
        
        // ==================== 13. CRÉATION DES MOUVEMENTS DE STOCK ====================
        $this->command->info('🔄 Création des mouvements de stock...');
        
        $types = ['entree', 'sortie', 'ajustement'];
        $stocks = DB::table('stocks')->get();
        $allUsers = array_values($userIds);
        
        foreach ($stocks as $stock) {
            for ($i = 1; $i <= rand(5, 20); $i++) {
                $type = $types[array_rand($types)];
                $quantite = rand(1, 30);
                $quantiteAvant = $stock->quantite_disponible;
                
                if ($type === 'entree') {
                    $quantiteApres = $quantiteAvant + $quantite;
                } elseif ($type === 'sortie') {
                    $quantiteApres = max(0, $quantiteAvant - $quantite);
                } else {
                    $quantiteApres = $quantite;
                }
                
                $motifs = [
                    'entree' => ['Réception commande N°' . rand(100, 999), 'Retour fournisseur', 'Ajustement stock', 'Don interne'],
                    'sortie' => ['Demande N°' . rand(1, 80), 'Utilisation atelier', 'Prêt pédagogique', 'Consommation interne'],
                    'ajustement' => ['Correction inventaire', 'Réévaluation stock', 'Erreur comptage', 'Ajustement périodique']
                ];
                
                DB::table('mouvements')->insert([
                    'article_id' => $stock->article_id,
                    'magasin_id' => $stock->magasin_id,
                    'type' => $type,
                    'quantite' => $quantite,
                    'quantite_avant' => $quantiteAvant,
                    'quantite_apres' => $quantiteApres,
                    'motif' => $motifs[$type][array_rand($motifs[$type])],
                    'reference' => 'REF-' . strtoupper(substr(uniqid(), -6)),
                    'reference_type' => $type === 'entree' ? 'bon_reception' : ($type === 'sortie' ? 'demande' : 'ajustement'),
                    'user_id' => $allUsers[array_rand($allUsers)],
                    'created_at' => Carbon::now()->subDays(rand(1, 40)),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 14. CRÉATION DES NOTIFICATIONS ====================
        $this->command->info('🔔 Création des notifications...');
        
        $notificationTypes = [
            'demande_approuvee', 'demande_refusee', 'demande_livree',
            'reservation_confirmee', 'reservation_annulee', 'stock_alerte',
            'commande_recue', 'nouveau_message'
        ];
        
        $titles = [
            'demande_approuvee' => '✅ Demande approuvée',
            'demande_refusee' => '❌ Demande refusée',
            'demande_livree' => '📦 Demande livrée',
            'reservation_confirmee' => '✅ Réservation confirmée',
            'reservation_annulee' => '❌ Réservation annulée',
            'stock_alerte' => '⚠️ Stock bas',
            'commande_recue' => '📦 Commande réceptionnée',
            'nouveau_message' => '💬 Nouveau message'
        ];
        
        foreach ($userIds as $userId) {
            for ($i = 1; $i <= rand(5, 15); $i++) {
                $type = $notificationTypes[array_rand($notificationTypes)];
                DB::table('notifications')->insert([
                    'user_id' => $userId,
                    'type' => $type,
                    'title' => $titles[$type],
                    'message' => 'Notification N°' . $i . ' - ' . $this->generateRandomMessage($type),
                    'data' => json_encode(['link' => '/dashboard', 'icon' => 'bell']),
                    'is_read' => rand(0, 1),
                    'created_at' => Carbon::now()->subDays(rand(0, 20)),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 15. CRÉATION DES PARAMÈTRES ====================
        $this->command->info('⚙️ Création des paramètres...');
        
        $settings = [
            ['key' => 'app_name', 'value' => '"ISTAHT Stock Manager"', 'group' => 'general'],
            ['key' => 'primary_color', 'value' => '"#006233"', 'group' => 'general'],
            ['key' => 'secondary_color', 'value' => '"#C0392B"', 'group' => 'general'],
            ['key' => 'low_stock_threshold', 'value' => '10', 'group' => 'stock'],
            ['key' => 'critical_stock_threshold', 'value' => '5', 'group' => 'stock'],
            ['key' => 'email_notifications', 'value' => 'true', 'group' => 'notifications'],
            ['key' => 'stock_alert_notification', 'value' => 'true', 'group' => 'notifications'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'group' => 'system'],
            ['key' => 'items_per_page', 'value' => '15', 'group' => 'general'],
            ['key' => 'school_name', 'value' => '"ISTA Hôtellerie et Tourisme Tanger"', 'group' => 'general'],
        ];
        
        foreach ($settings as $setting) {
            DB::table('settings')->insert([
                'key' => $setting['key'],
                'value' => $setting['value'],
                'group' => $setting['group'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // ==================== 16. CRÉATION DES INVENTAIRES ====================
        $this->command->info('📊 Création des inventaires...');
        
        $inventaireStatuts = ['planifie', 'en_cours', 'finalise'];
        
        for ($i = 1; $i <= 8; $i++) {
            $magasinId = $magasinIds[array_rand($magasinIds)];
            $statut = $inventaireStatuts[array_rand($inventaireStatuts)];
            $dateDebut = Carbon::now()->subDays(rand(0, 30));
            $dateFin = $statut === 'finalise' ? Carbon::parse($dateDebut)->addDays(rand(2, 8)) : null;
            
            $inventaireId = DB::table('inventaires')->insertGetId([
                'numero_inventaire' => 'INV-' . date('Ymd') . '-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'magasin_id' => $magasinId,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'statut' => $statut,
                'responsable_id' => $adminsIds[array_rand($adminsIds)],
                'commentaire' => 'Inventaire périodique - ' . now()->format('F Y'),
                'created_at' => $dateDebut,
                'updated_at' => now(),
            ]);
            
            // Lignes d'inventaire
            $articlesMagasin = DB::table('stocks')
                ->where('magasin_id', $magasinId)
                ->pluck('article_id')
                ->unique()
                ->toArray();
            
            foreach ($articlesMagasin as $articleId) {
                $stock = DB::table('stocks')
                    ->where('article_id', $articleId)
                    ->where('magasin_id', $magasinId)
                    ->first();
                
                if ($stock) {
                    $quantiteTheorique = $stock->quantite_disponible;
                    $quantiteReelle = max(0, $quantiteTheorique + rand(-10, 10));
                    $ecart = $quantiteReelle - $quantiteTheorique;
                    
                    DB::table('inventaire_lignes')->insert([
                        'inventaire_id' => $inventaireId,
                        'article_id' => $articleId,
                        'quantite_theorique' => $quantiteTheorique,
                        'quantite_reelle' => $quantiteReelle,
                        'ecart' => $ecart,
                        'observations' => $ecart != 0 ? 'Écart constaté lors du comptage' : null,
                        'est_corrige' => $statut === 'finalise' && abs($ecart) <= 5,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
        
        // ==================== 17. CRÉATION DES TRANSFERTS ====================
        $this->command->info('🔄 Création des transferts...');
        
        for ($i = 1; $i <= 20; $i++) {
            $sourceMagasin = $magasinIds[array_rand($magasinIds)];
            $destMagasin = $magasinIds[array_rand($magasinIds)];
            
            while ($destMagasin == $sourceMagasin) {
                $destMagasin = $magasinIds[array_rand($magasinIds)];
            }
            
            $articleId = $articlesList[array_rand($articlesList)];
            
            // Vérifier que l'article est bien dans le magasin source
            $stockSource = DB::table('stocks')
                ->where('article_id', $articleId)
                ->where('magasin_id', $sourceMagasin)
                ->first();
            
            if ($stockSource && $stockSource->quantite_disponible >= 5) {
                DB::table('transferts_articles')->insert([
                    'article_source_id' => $articleId,
                    'article_dest_id' => $articleId,
                    'magasin_id' => $sourceMagasin,
                    'quantite' => rand(5, min(30, $stockSource->quantite_disponible)),
                    'motif' => 'Transfert pour réapprovisionnement - Magasin ' . $destMagasin,
                    'user_id' => $magasiniersIds[array_rand($magasiniersIds)],
                    'created_at' => Carbon::now()->subDays(rand(1, 30)),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 18. CRÉATION DES CONVERSATIONS ET MESSAGES ====================
        $this->command->info('💬 Création des conversations...');
        
        $demandesTraitees = DB::table('demandes')
            ->whereIn('statut', ['approuvee', 'livree', 'refusee'])
            ->limit(20)
            ->get();
        
        foreach ($demandesTraitees as $demande) {
            $conversationId = DB::table('conversations')->insertGetId([
                'demande_id' => $demande->id,
                'user_id' => $demande->user_id,
                'magasinier_id' => $magasiniersIds[array_rand($magasiniersIds)],
                'created_at' => $demande->date_demande,
                'updated_at' => now(),
            ]);
            
            // Messages
            $nbMessages = rand(2, 8);
            for ($i = 1; $i <= $nbMessages; $i++) {
                $senderId = $i % 2 == 0 ? $demande->user_id : ($i % 3 == 0 ? $adminsIds[array_rand($adminsIds)] : $magasiniersIds[array_rand($magasiniersIds)]);
                
                $messages = [
                    'Bonjour, je souhaite avoir des informations sur ma demande.',
                    'Votre demande est en cours de traitement.',
                    'Merci pour votre réponse rapide.',
                    'Pouvez-vous me confirmer la date de livraison ?',
                    'La livraison est prévue pour la semaine prochaine.',
                    'Super, merci beaucoup !',
                    'Nous avons besoin de documents supplémentaires.',
                    'Je vous les envoie immédiatement.',
                    'La demande a été approuvée par l\'administration.',
                    'Parfait, je vous remercie pour votre aide.'
                ];
                
                DB::table('messages')->insert([
                    'conversation_id' => $conversationId,
                    'user_id' => $senderId,
                    'message' => $messages[array_rand($messages)] . ' (Message ' . $i . ')',
                    'is_read' => rand(0, 1),
                    'created_at' => Carbon::parse($demande->date_demande)->addMinutes($i * rand(5, 60)),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 19. CRÉATION DES ACTIVITÉS UTILISATEURS ====================
        $this->command->info('📝 Création des activités utilisateurs...');
        
        $actions = ['user_login', 'user_logout', 'password_changed', 'user_blocked', 'user_unblocked'];
        
        foreach ($userIds as $userId) {
            for ($i = 1; $i <= rand(3, 10); $i++) {
                DB::table('user_activities')->insert([
                    'user_id' => $userId,
                    'action' => $actions[array_rand($actions)],
                    'action_type' => 'login',
                    'ip_address' => '192.168.' . rand(1, 255) . '.' . rand(1, 255),
                    'details' => 'Activité générée automatiquement',
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'created_at' => Carbon::now()->subDays(rand(0, 30)),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 20. MISE À JOUR DES QUANTITÉS EN STOCK ====================
        $this->command->info('📊 Mise à jour des stocks...');
        
        $mouvements = DB::table('mouvements')->orderBy('created_at')->get();
        $stockUpdates = [];
        
        foreach ($mouvements as $mouvement) {
            $key = $mouvement->article_id . '_' . $mouvement->magasin_id;
            $stockUpdates[$key] = $mouvement->quantite_apres;
        }
        
        foreach ($stockUpdates as $key => $quantite) {
            list($articleId, $magasinId) = explode('_', $key);
            DB::table('stocks')
                ->where('article_id', $articleId)
                ->where('magasin_id', $magasinId)
                ->update(['quantite_disponible' => $quantite]);
        }
        
        // ==================== 21. MESSAGE FINAL ====================
        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════════════════════════');
        $this->command->info('                 ✅ SEEDING TERMINÉ AVEC SUCCÈS !               ');
        $this->command->info('═══════════════════════════════════════════════════════════════');
        $this->command->info('');
        $this->command->info('📊 STATISTIQUES:');
        $this->command->info('   - Magasins: ' . DB::table('magasins')->count());
        $this->command->info('   - Familles: ' . DB::table('familles')->count());
        $this->command->info('   - Catégories: ' . DB::table('categories')->count());
        $this->command->info('   - Articles: ' . DB::table('articles')->count());
        $this->command->info('   - Utilisateurs: ' . DB::table('users')->count());
        $this->command->info('   - Demandes: ' . DB::table('demandes')->count());
        $this->command->info('   - Réservations: ' . DB::table('reservations')->count());
        $this->command->info('   - Commandes fournisseurs: ' . DB::table('commandes_fournisseurs')->count());
        $this->command->info('   - Mouvements: ' . DB::table('mouvements')->count());
        $this->command->info('   - Notifications: ' . DB::table('notifications')->count());
        $this->command->info('   - Inventaires: ' . DB::table('inventaires')->count());
        $this->command->info('   - Transferts: ' . DB::table('transferts_articles')->count());
        $this->command->info('   - Conversations: ' . DB::table('conversations')->count());
        $this->command->info('');
        $this->command->info('🔑 COMPTES DE TEST:');
        $this->command->info('   🔹 ADMINISTRATEURS:');
        $this->command->info('      - admin@istaht.ma / password123');
        $this->command->info('      - mohammed.alami@istaht.ma / password123');
        $this->command->info('      - khadija.bennani@istaht.ma / password123');
        $this->command->info('   🔹 MAGASINIERS:');
        $this->command->info('      - fatima.zahra@istaht.ma / password123 (Magasin Principal)');
        $this->command->info('      - karim.tazi@istaht.ma / password123 (Magasin Satellite)');
        $this->command->info('      - sanaa.elfassi@istaht.ma / password123 (Matières Premières)');
        $this->command->info('   🔹 DEMANDEURS:');
        $this->command->info('      - amina.benjelloun@istaht.ma / password123');
        $this->command->info('      - hassan.elmansouri@istaht.ma / password123');
        $this->command->info('      - leila.othmani@istaht.ma / password123');
        $this->command->info('');
        $this->command->info('🚀 APPLICATION PRÊTE À ÊTRE TESTÉE !');
        $this->command->info('═══════════════════════════════════════════════════════════════');
    }
    
    private function generateRandomMessage(string $type): string
    {
        $messages = [
            'demande_approuvee' => 'Votre demande a été approuvée par l\'administration.',
            'demande_refusee' => 'Malheureusement, votre demande a été refusée.',
            'demande_livree' => 'Votre demande a été livrée avec succès.',
            'reservation_confirmee' => 'Votre réservation est confirmée.',
            'reservation_annulee' => 'Votre réservation a été annulée.',
            'stock_alerte' => 'Le stock de certains articles est bas.',
            'commande_recue' => 'Une nouvelle commande a été réceptionnée.',
            'nouveau_message' => 'Vous avez reçu un nouveau message.'
        ];
        
        return $messages[$type] ?? 'Notification système.';
    }
}