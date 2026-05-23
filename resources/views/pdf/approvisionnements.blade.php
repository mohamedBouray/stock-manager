<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Approvisionnements</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background: #006233; color: white; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Approvisionnements</h2>
        <p>Période du {{ $date_debut }} au {{ $date_fin }}</p>
        <p>Total commandes: {{ $total_commandes }}</p>
    </div>
    
    @if($commandes->count() > 0)
    <table>
        <thead>
            <tr><th>N° Commande</th><th>Fournisseur</th><th>Date</th><th>Articles</th></tr>
        </thead>
        <tbody>
            @foreach($commandes as $c)
            <tr>
                <td>{{ $c->numero_commande }}</td>
                <td>{{ $c->fournisseur }}</td>
                <td>{{ $c->date_commande }}</td>
                <td>{{ $c->lignes->sum('quantite_commandee') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
        <p>Aucune commande trouvée</p>
    @endif
    
    <div class="footer">
        Document généré automatiquement - ISTAHT Tanger
    </div>
</body>
</html>