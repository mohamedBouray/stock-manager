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
            ['nom_magasin' => 'Magasin Principal', 'localisation' => 'Bâtiment A - Rez-de-chaussée'],
            ['nom_magasin' => 'Magasin Satellite', 'localisation' => 'Bâtiment B - Étage 1'],
            ['nom_magasin' => 'Magasin Matières Premières', 'localisation' => 'Dépôt central'],
            ['nom_magasin' => 'Magasin Produits Finis', 'localisation' => 'Zone industrielle'],
            ['nom_magasin' => 'Magasin Consommables', 'localisation' => 'Bureau administratif'],
        ];
        
        foreach ($magasins as $magasin) {
            DB::table('magasins')->insert([
                'nom_magasin' => $magasin['nom_magasin'],
                'localisation' => $magasin['localisation'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
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
            'Pâtisserie et boulangerie'
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
        
        // Produits d'entretien
        ['nom_categorie' => 'Détergents', 'famille_id' => $familleIds['Produits d\'entretien']],
        ['nom_categorie' => 'Désinfectants', 'famille_id' => $familleIds['Produits d\'entretien']],
        
        // Papeterie
        ['nom_categorie' => 'Papeterie', 'famille_id' => $familleIds['Produits de papeterie']],
        
        // Équipement cuisine
        ['nom_categorie' => 'Ustensiles', 'famille_id' => $familleIds['Équipement de cuisine']],
        ['nom_categorie' => 'Petit électroménager', 'famille_id' => $familleIds['Équipement de cuisine']],
        
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
        
        // 🔥 PRODUITS LAITIERS - AJOUTER CES CATÉGORIES
        ['nom_categorie' => 'Produits laitiers', 'famille_id' => $familleIds['Produits laitiers']],
        ['nom_categorie' => 'Fromages', 'famille_id' => $familleIds['Produits laitiers']],
        ['nom_categorie' => 'Yaourts', 'famille_id' => $familleIds['Produits laitiers']],
        
        // Pâtisserie et boulangerie
        ['nom_categorie' => 'Pains', 'famille_id' => $familleIds['Pâtisserie et boulangerie']],
        ['nom_categorie' => 'Viennoiseries', 'famille_id' => $familleIds['Pâtisserie et boulangerie']],
        ['nom_categorie' => 'Pâtisseries', 'famille_id' => $familleIds['Pâtisserie et boulangerie']],
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
            ['code_barre' => '611000000001', 'designation' => 'Riz basmati 1kg', 'description' => 'Riz long grain importé', 'unite_mesure' => 'Kg', 'seuil_alerte' => 10, 'categorie_id' => $categorieIds['Produits secs']],
            ['code_barre' => '611000000002', 'designation' => 'Farine T55 1kg', 'description' => 'Farine de blé pour pâtisserie', 'unite_mesure' => 'Kg', 'seuil_alerte' => 15, 'categorie_id' => $categorieIds['Produits secs']],
            ['code_barre' => '611000000003', 'designation' => 'Sucre en poudre 1kg', 'description' => 'Sucre blanc cristallisé', 'unite_mesure' => 'Kg', 'seuil_alerte' => 10, 'categorie_id' => $categorieIds['Produits secs']],
            ['code_barre' => '611000000004', 'designation' => 'Huile d\'olive 1L', 'description' => 'Huile d\'olive vierge extra', 'unite_mesure' => 'Litre', 'seuil_alerte' => 8, 'categorie_id' => $categorieIds['Produits secs']],
            ['code_barre' => '611000000005', 'designation' => 'Concentré tomate 500g', 'description' => 'Double concentré', 'unite_mesure' => 'Boite', 'seuil_alerte' => 20, 'categorie_id' => $categorieIds['Conserves']],
            
            // Produits d'entretien
            ['code_barre' => '611000000006', 'designation' => 'Liquide vaisselle 1L', 'description' => 'Liquide vaisselle citron', 'unite_mesure' => 'Litre', 'seuil_alerte' => 5, 'categorie_id' => $categorieIds['Détergents']],
            ['code_barre' => '611000000007', 'designation' => 'Désinfectant sol 2L', 'description' => 'Désinfectant multi-surfaces', 'unite_mesure' => 'Litre', 'seuil_alerte' => 8, 'categorie_id' => $categorieIds['Désinfectants']],
            ['code_barre' => '611000000008', 'designation' => 'Éponge grattoir', 'description' => 'Éponge double face', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 15, 'categorie_id' => $categorieIds['Détergents']],
            
            // Papeterie
            ['code_barre' => '611000000009', 'designation' => 'Papier A4 80g (ramette)', 'description' => '500 feuilles blanches', 'unite_mesure' => 'Ramette', 'seuil_alerte' => 10, 'categorie_id' => $categorieIds['Papeterie']],
            ['code_barre' => '611000000010', 'designation' => 'Stylo bille bleu', 'description' => 'Stylo à bille pointe fine', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 50, 'categorie_id' => $categorieIds['Papeterie']],
            ['code_barre' => '611000000011', 'designation' => 'Marqueur permanent noir', 'description' => 'Pointe ronde 1.5mm', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 20, 'categorie_id' => $categorieIds['Papeterie']],
            
            // Boissons
            ['code_barre' => '611000000012', 'designation' => 'Café moulu 250g', 'description' => 'Café arabica 100%', 'unite_mesure' => 'Paquet', 'seuil_alerte' => 6, 'categorie_id' => $categorieIds['Boissons chaudes']],
            ['code_barre' => '611000000013', 'designation' => 'Thé vert 100g', 'description' => 'Thé vert en vrac', 'unite_mesure' => 'Boite', 'seuil_alerte' => 5, 'categorie_id' => $categorieIds['Boissons chaudes']],
            ['code_barre' => '611000000014', 'designation' => 'Jus d\'orange 1L', 'description' => 'Jus pur fruit', 'unite_mesure' => 'Litre', 'seuil_alerte' => 12, 'categorie_id' => $categorieIds['Boissons froides']],
            
            // Viandes
            ['code_barre' => '611000000015', 'designation' => 'Filet de poulet 1kg', 'description' => 'Filet sans os', 'unite_mesure' => 'Kg', 'seuil_alerte' => 5, 'categorie_id' => $categorieIds['Viandes rouges']],
            ['code_barre' => '611000000016', 'designation' => 'Saumon frais 500g', 'description' => 'Saumon norvégien', 'unite_mesure' => 'Kg', 'seuil_alerte' => 4, 'categorie_id' => $categorieIds['Poissons']],
            
            // Produits laitiers
            ['code_barre' => '611000000017', 'designation' => 'Lait demi-écrémé 1L', 'description' => 'Lait UHT', 'unite_mesure' => 'Litre', 'seuil_alerte' => 15, 'categorie_id' => $categorieIds['Produits laitiers']],
            ['code_barre' => '611000000018', 'designation' => 'Beurre doux 250g', 'description' => 'Beurre de baratte', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 10, 'categorie_id' => $categorieIds['Produits laitiers']],
            ['code_barre' => '611000000019', 'designation' => 'Emmental râpé 200g', 'description' => 'Fromage râpé', 'unite_mesure' => 'Sachet', 'seuil_alerte' => 8, 'categorie_id' => $categorieIds['Fromages']],
            
            // Pâtisserie
            ['code_barre' => '611000000020', 'designation' => 'Pain de mie 500g', 'description' => 'Pain de mie complet', 'unite_mesure' => 'Pièce', 'seuil_alerte' => 7, 'categorie_id' => $categorieIds['Pains']],
        ];
        
        $articleIds = [];
        foreach ($articles as $article) {
            $id = DB::table('articles')->insertGetId([
                'code_barre' => $article['code_barre'],
                'designation' => $article['designation'],
                'description' => $article['description'],
                'unite_mesure' => $article['unite_mesure'],
                'seuil_alerte' => $article['seuil_alerte'],
                'categorie_id' => $article['categorie_id'],
                'statut' => 'actif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $articleIds[$article['designation']] = $id;
        }
        
        // ==================== 6. AFFECTATION ARTICLES AUX MAGASINS ====================
        $this->command->info('🔗 Affectation des articles aux magasins...');

        $magasinIds = DB::table('magasins')->pluck('id')->toArray();

        foreach ($articleIds as $articleId) {
            // Chaque article est dans 2-3 magasins
            $randomMagasins = array_rand(array_flip($magasinIds), rand(2, 3));
            foreach ((array)$randomMagasins as $magasinId) {
                DB::table('article_magasin')->insert([
                    'article_id' => $articleId,
                    'magasin_id' => $magasinId,  // 🔥 CHANGER magasins_id → magasin_id
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
        
// ==================== 7. CRÉATION DES STOCKS INITIAUX ====================
$this->command->info('💾 Création des stocks initiaux...');

foreach ($articleIds as $articleId) {
    // 🔥 CHANGER magasins_id → magasin_id
    $magasinsArticle = DB::table('article_magasin')
        ->where('article_id', $articleId)
        ->pluck('magasin_id')  // ← CHANGER ICI
        ->toArray();
    
    foreach ($magasinsArticle as $magasinId) {
        $quantite = rand(5, 100);
        DB::table('stocks')->insert([
            'article_id' => $articleId,
            'magasin_id' => $magasinId,
            'quantite_disponible' => $quantite,
            'quantite_reservee' => rand(0, 5),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
        // ==================== 8. CRÉATION DES UTILISATEURS ====================
        $this->command->info('👤 Création des utilisateurs...');
        
        $users = [
            ['name' => 'Admin Principal', 'email' => 'admin@istaht.ma', 'role' => 'admin', 'password' => 'password123'],
            ['name' => 'Mohammed Admin', 'email' => 'mohammed.admin@istaht.ma', 'role' => 'admin', 'password' => 'password123'],
            ['name' => 'Fatima Zahra', 'email' => 'fatima.magasinier@istaht.ma', 'role' => 'magasinier', 'password' => 'password123', 'magasin_id' => 1],
            ['name' => 'Karim Tanger', 'email' => 'karim.magasinier@istaht.ma', 'role' => 'magasinier', 'password' => 'password123', 'magasin_id' => 2],
            ['name' => 'Sanaa Chefchaouen', 'email' => 'sanaa.magasinier@istaht.ma', 'role' => 'magasinier', 'password' => 'password123', 'magasin_id' => 3],
            ['name' => 'Youssef Tetouan', 'email' => 'youssef.magasinier@istaht.ma', 'role' => 'magasinier', 'password' => 'password123', 'magasin_id' => null],
            ['name' => 'Amina Demandeur', 'email' => 'amina.demandeur@istaht.ma', 'role' => 'user', 'password' => 'password123'],
            ['name' => 'Hassan Cuisine', 'email' => 'hassan.cuisine@istaht.ma', 'role' => 'user', 'password' => 'password123'],
            ['name' => 'Leila Service', 'email' => 'leila.service@istaht.ma', 'role' => 'user', 'password' => 'password123'],
            ['name' => 'Omar Restaurant', 'email' => 'omar.restaurant@istaht.ma', 'role' => 'user', 'password' => 'password123'],
            ['name' => 'Nadia Pâtisserie', 'email' => 'nadia.patisserie@istaht.ma', 'role' => 'user', 'password' => 'password123'],
            ['name' => 'Rachid Bar', 'email' => 'rachid.bar@istaht.ma', 'role' => 'user', 'password' => 'password123'],
        ];
        
        $userIds = [];
        foreach ($users as $user) {
            $id = DB::table('users')->insertGetId([
                'name' => $user['name'],
                'email' => $user['email'],
                'password' => Hash::make($user['password']),
                'role' => $user['role'],
                'magasin_id' => $user['magasin_id'] ?? null,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $userIds[$user['name']] = $id;
        }
        
       // ==================== 9. CRÉATION DES DEMANDES ====================
$this->command->info('📋 Création des demandes...');

$statuts = ['en_attente', 'approuvee', 'refusee', 'livree'];
$articlesList = array_values($articleIds);
$demandeurs = array_slice($userIds, 6, 6); // Les users avec role='user'

// 🔥 CRÉER UN TABLEAU D'IDS POUR LES MAGASINIERS ET ADMINS
$magasiniersIds = [$userIds['Fatima Zahra'], $userIds['Karim Tanger'], $userIds['Sanaa Chefchaouen']];
$adminsIds = [$userIds['Admin Principal'], $userIds['Mohammed Admin']];
$traiteParIds = array_merge($adminsIds, $magasiniersIds);

for ($i = 1; $i <= 50; $i++) {
    $statut = $statuts[array_rand($statuts)];
    $articleId = $articlesList[array_rand($articlesList)];
    $quantite = rand(1, 20);
    $quantiteAccorde = in_array($statut, ['approuvee', 'livree']) ? rand(1, $quantite) : null;
    
    // 🔥 CORRECTION : Utiliser $traiteParIds au lieu de $userIds avec array_rand
    $traitePar = in_array($statut, ['approuvee', 'refusee', 'livree']) 
        ? $traiteParIds[array_rand($traiteParIds)] 
        : null;
    
    $motifs = ['Besoin urgent', 'Routinely', 'Stock épuisé', 'Commande spéciale'];
    
    $demandeId = DB::table('demandes')->insertGetId([
        'user_id' => $demandeurs[array_rand($demandeurs)],
        'article_id' => $articleId,
        'quantite_demandee' => $quantite,
        'quantite_accorde' => $quantiteAccorde,
        'statut' => $statut,
        'motif' => 'Demande N°' . $i . ' - ' . $motifs[array_rand($motifs)],
        'date_demande' => Carbon::now()->subDays(rand(1, 30)),
        'date_traitement' => in_array($statut, ['approuvee', 'refusee', 'livree']) ? Carbon::now()->subDays(rand(1, 15)) : null,
        'traite_par' => $traitePar,
        'created_at' => Carbon::now()->subDays(rand(1, 30)),
        'updated_at' => now(),
    ]);
    
    // Ajouter des retours pour certaines demandes livrées
    if ($statut === 'livree' && rand(1, 10) <= 3) {
        $retourStatuts = ['en_attente', 'approuve', 'refuse'];
        $retourMotifs = ['Produit défectueux', 'Erreur de commande', 'Produit endommagé', 'Date de péremption dépassée'];
        
        DB::table('retours_magasin')->insert([
            'demande_id' => $demandeId,
            'article_id' => $articleId,
            'quantite' => rand(1, $quantiteAccorde ?? 1),
            'motif' => $retourMotifs[array_rand($retourMotifs)],
            'statut' => $retourStatuts[array_rand($retourStatuts)],
            'user_id' => $demandeurs[array_rand($demandeurs)],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
        
        // ==================== 10. CRÉATION DES RÉSERVATIONS ====================
        $this->command->info('📅 Création des réservations...');
        
        $reservationStatuts = ['en_attente', 'confirmee', 'annulee', 'expiree'];
        
        for ($i = 1; $i <= 30; $i++) {
            $statut = $reservationStatuts[array_rand($reservationStatuts)];
            $dateDebut = Carbon::now()->addDays(rand(1, 60));
            $dateFin = Carbon::now()->addDays(rand(1, 60) + 7);
            
            DB::table('reservations')->insert([
                'user_id' => $demandeurs[array_rand($demandeurs)],
                'article_id' => $articlesList[array_rand($articlesList)],
                'quantite' => rand(1, 10),
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'statut' => $statut,
                'motif' => ['Événement spécial', 'Formation', 'Atelier', 'Période de test'][array_rand(['Événement spécial', 'Formation', 'Atelier', 'Période de test'])],
                'created_at' => Carbon::now()->subDays(rand(1, 30)),
                'updated_at' => now(),
            ]);
        }
        
        // ==================== 11. CRÉATION DES COMMANDES FOURNISSEURS ====================
        $this->command->info('📦 Création des commandes fournisseurs...');
        
        $fournisseurs = ['Ministère du Tourisme', 'Metro Maroc', 'Carrefour Supply', 'Bidfood Maroc', 'Distri Maroc'];
        $statutsCommande = ['envoyee', 'partiellement_livree', 'livree_totalement'];
        
        for ($i = 1; $i <= 20; $i++) {
            $commandeId = DB::table('commandes_fournisseurs')->insertGetId([
                'numero_commande' => 'BC-' . date('Y') . '-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'fournisseur' => $fournisseurs[array_rand($fournisseurs)],
                'date_commande' => Carbon::now()->subDays(rand(1, 60)),
                'statut' => $statutsCommande[array_rand($statutsCommande)],
                'created_at' => Carbon::now()->subDays(rand(1, 60)),
                'updated_at' => now(),
            ]);
            
            // Lignes de commande
            $nbLignes = rand(2, 8);
            for ($j = 0; $j < $nbLignes; $j++) {
                $articleId = $articlesList[array_rand($articlesList)];
                $quantiteCommandee = rand(10, 100);
                $quantiteLivree = 0;
                
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
        
        // ==================== 12. CRÉATION DES MOUVEMENTS DE STOCK ====================
        $this->command->info('🔄 Création des mouvements de stock...');
        
        $types = ['entree', 'sortie', 'ajustement'];
        $stocks = DB::table('stocks')->get();
        
        foreach ($stocks as $stock) {
            for ($i = 1; $i <= rand(5, 15); $i++) {
                $type = $types[array_rand($types)];
                $quantite = rand(1, 20);
                $quantiteAvant = $stock->quantite_disponible;
                $quantiteApres = $type === 'entree' ? $quantiteAvant + $quantite : ($type === 'sortie' ? max(0, $quantiteAvant - $quantite) : $quantite);
                
                DB::table('mouvements')->insert([
                    'article_id' => $stock->article_id,
                    'magasin_id' => $stock->magasin_id,
                    'type' => $type,
                    'quantite' => $quantite,
                    'quantite_avant' => $quantiteAvant,
                    'quantite_apres' => $quantiteApres,
                    'motif' => $type === 'entree' ? 'Réception commande' : ($type === 'sortie' ? 'Sortie pour demande' : 'Ajustement inventaire'),
                    'user_id' => $userIds['Mohammed Admin'],
                    'created_at' => Carbon::now()->subDays(rand(1, 30)),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 13. CRÉATION DES NOTIFICATIONS ====================
        $this->command->info('🔔 Création des notifications...');
        
        $notificationTypes = [
            'demande_approuvee', 'demande_refusee', 'demande_livree',
            'reservation_confirmee', 'reservation_annulee', 'stock_alerte'
        ];
        
        foreach ($userIds as $userId) {
            for ($i = 1; $i <= rand(3, 8); $i++) {
                $type = $notificationTypes[array_rand($notificationTypes)];
                DB::table('notifications')->insert([
                    'user_id' => $userId,
                    'type' => $type,
                    'title' => $type === 'demande_approuvee' ? '✅ Demande approuvée' : ($type === 'demande_refusee' ? '❌ Demande refusée' : ($type === 'demande_livree' ? '📦 Demande livrée' : ($type === 'reservation_confirmee' ? '✅ Réservation confirmée' : ($type === 'reservation_annulee' ? '❌ Réservation annulée' : '⚠️ Stock bas')))),
                    'message' => 'Ceci est une notification de test N°' . $i,
                    'is_read' => rand(0, 1),
                    'created_at' => Carbon::now()->subDays(rand(1, 15)),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 14. CRÉATION DES PARAMÈTRES ====================
        $this->command->info('⚙️ Création des paramètres...');
        
        $settings = [
            ['key' => 'app_name', 'value' => '"ISTAHT Stock Manager"', 'group' => 'general'],
            ['key' => 'primary_color', 'value' => '"#006233"', 'group' => 'general'],
            ['key' => 'secondary_color', 'value' => '"#C0392B"', 'group' => 'general'],
            ['key' => 'low_stock_threshold', 'value' => '10', 'group' => 'stock'],
            ['key' => 'critical_stock_threshold', 'value' => '5', 'group' => 'stock'],
            ['key' => 'email_notifications', 'value' => 'true', 'group' => 'notifications'],
            ['key' => 'stock_alert_notification', 'value' => 'true', 'group' => 'notifications'],
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
        
        // ==================== 15. CRÉATION DES INVENTAIRES ====================
        $this->command->info('📊 Création des inventaires...');
        
        $inventaireStatuts = ['planifie', 'en_cours', 'finalise'];
        $magasinIdsList = DB::table('magasins')->pluck('id')->toArray();
        
        for ($i = 1; $i <= 5; $i++) {
            $magasinId = $magasinIdsList[array_rand($magasinIdsList)];
            $statut = $inventaireStatuts[array_rand($inventaireStatuts)];
            
            $inventaireId = DB::table('inventaires')->insertGetId([
                'numero_inventaire' => 'INV-' . date('Ymd') . '-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'magasin_id' => $magasinId,
                'date_debut' => Carbon::now()->subDays(rand(1, 30)),
                'date_fin' => $statut === 'finalise' ? Carbon::now()->subDays(rand(1, 5)) : null,
                'statut' => $statut,
                'responsable_id' => $userIds['Mohammed Admin'],
                'commentaire' => 'Inventaire périodique du magasin',
                'created_at' => Carbon::now()->subDays(rand(1, 30)),
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
                    $quantiteReelle = $quantiteTheorique + rand(-5, 5);
                    $quantiteReelle = max(0, $quantiteReelle);
                    $ecart = $quantiteReelle - $quantiteTheorique;
                    
                    DB::table('inventaire_lignes')->insert([
                        'inventaire_id' => $inventaireId,
                        'article_id' => $articleId,
                        'quantite_theorique' => $quantiteTheorique,
                        'quantite_reelle' => $quantiteReelle,
                        'ecart' => $ecart,
                        'est_corrige' => $statut === 'finalise',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
        
        // ==================== 16. CRÉATION DES TRANSFERTS ====================
        $this->command->info('🔄 Création des transferts...');
        
        for ($i = 1; $i <= 15; $i++) {
            $sourceMagasin = $magasinIdsList[array_rand($magasinIdsList)];
            $destMagasin = $magasinIdsList[array_rand($magasinIdsList)];
            
            while ($destMagasin == $sourceMagasin) {
                $destMagasin = $magasinIdsList[array_rand($magasinIdsList)];
            }
            
            $articleId = $articlesList[array_rand($articlesList)];
            
            DB::table('transferts_articles')->insert([
                'article_source_id' => $articleId,
                'article_dest_id' => $articleId,
                'magasin_id' => $sourceMagasin,
                'quantite' => rand(5, 30),
                'motif' => 'Transfert pour réapprovisionnement',
                'user_id' => $userIds['Mohammed Admin'],
                'created_at' => Carbon::now()->subDays(rand(1, 30)),
                'updated_at' => now(),
            ]);
        }
        
        // ==================== 17. CRÉATION DES CONVERSATIONS ET MESSAGES ====================
        $this->command->info('💬 Création des conversations...');
        
        $demandes = DB::table('demandes')->whereIn('statut', ['approuvee', 'livree'])->limit(10)->get();
        
        foreach ($demandes as $demande) {
            $conversationId = DB::table('conversations')->insertGetId([
                'demande_id' => $demande->id,
                'user_id' => $demande->user_id,
                'magasinier_id' => $userIds['Fatima Zahra'],
                'created_at' => $demande->created_at,
                'updated_at' => now(),
            ]);
            
            // Messages
            for ($i = 1; $i <= rand(2, 5); $i++) {
                $senderId = $i % 2 == 0 ? $demande->user_id : $userIds['Fatima Zahra'];
                DB::table('messages')->insert([
                    'conversation_id' => $conversationId,
                    'user_id' => $senderId,
                    'message' => 'Message N°' . $i . ' concernant la demande N°' . $demande->id,
                    'is_read' => 1,
                    'created_at' => Carbon::parse($demande->created_at)->addMinutes($i * 5),
                    'updated_at' => now(),
                ]);
            }
        }
        
        // ==================== 18. MISE À JOUR DES QUANTITÉS EN STOCK ====================
        $this->command->info('📊 Mise à jour des stocks...');
        
        // Appliquer les mouvements pour avoir des stocks cohérents
        $mouvements = DB::table('mouvements')->orderBy('created_at')->get();
        foreach ($mouvements as $mouvement) {
            DB::table('stocks')
                ->where('article_id', $mouvement->article_id)
                ->where('magasin_id', $mouvement->magasin_id)
                ->update(['quantite_disponible' => $mouvement->quantite_apres]);
        }
        
        // ==================== 19. MESSAGE FINAL ====================
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
        $this->command->info('');
        $this->command->info('🔑 COMPTES DE TEST:');
        $this->command->info('   Admin: admin@istaht.ma / password123');
        $this->command->info('   Admin 2: mohammed.admin@istaht.ma / password123');
        $this->command->info('   Magasinier 1: fatima.magasinier@istaht.ma / password123');
        $this->command->info('   Magasinier 2: karim.magasinier@istaht.ma / password123');
        $this->command->info('   Demandeur: amina.demandeur@istaht.ma / password123');
        $this->command->info('');
        $this->command->info('🚀 APPLICATION PRÊTE À ÊTRE TESTÉE !');
        $this->command->info('═══════════════════════════════════════════════════════════════');
    }
}