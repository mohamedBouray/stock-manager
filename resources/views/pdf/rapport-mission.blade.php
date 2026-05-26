<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport de mission</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 18px; font-weight: bold; color: #006233; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #006233; color: white; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">ISTAHT Tanger</h1>
        <h2>Rapport de mission</h2>
        <p>Date: {{ $date_rapport->format('d/m/Y H:i') }}</p>
    </div>
    
    <h3>Statistiques générales</h3>
    <table>
        <thead>
            <tr><th>Indicateur</th><th>Valeur</th></tr>
        </thead>
        <tbody>
            <tr><td>Total articles</td><td>{{ $statistiques['total_articles'] ?? 0 }}</td></tr>
            <tr><td>Total magasins</td><td>{{ $statistiques['total_magasins'] ?? 0 }}</td></tr>
            <tr><td>Total commandes</td><td>{{ $statistiques['total_commandes'] ?? 0 }}</td></tr>
            <tr><td>Total mouvements</td><td>{{ $statistiques['total_mouvements'] ?? 0 }}</td></tr>
            <tr><td>Total demandes</td><td>{{ $statistiques['total_demandes'] ?? 0 }}</td></tr>
            <!-- 🔥 SUPPRIME ou COMMENTE cette ligne -->
            <!-- <tr><td>Articles en stock</td><td>{{ $statistiques['articles_en_stock'] ?? 0 }}</td></tr> -->
        </tbody>
    </table>
    
    @if(isset($alertes) && count($alertes) > 0)
    <h3>Alertes stock</h3>
    <table>
        <thead>
            <tr><th>Article</th><th>Stock actuel</th><th>Seuil alerte</th></tr>
        </thead>
        <tbody>
            @foreach($alertes as $alerte)
            <tr>
                <td>{{ $alerte['article'] ?? $alerte->article->designation ?? '-' }}</td>
                <td>{{ $alerte['stock'] ?? $alerte->quantite_disponible ?? 0 }}</td>
                <td>{{ $alerte['seuil'] ?? $alerte->article->seuil_alerte ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
    
    <div class="footer">
        Document généré automatiquement - ISTAHT Tanger
    </div>
</body>
</html>