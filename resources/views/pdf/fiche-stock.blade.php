<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Fiche de stock</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background: #006233; color: white; }
        .info { margin-bottom: 20px; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Fiche de stock</h2>
        <p>Article: {{ $article->designation }}</p>
        <p>Code barre: {{ $article->code_barre }}</p>
        <p>Stock actuel: {{ $stock_actuel }} {{ $article->unite_mesure }}</p>
    </div>
    
    @if($mouvements->count() > 0)
    <table>
        <thead>
            <tr><th>Date</th><th>Type</th><th>Entrée</th><th>Sortie</th><th>Stock après</th><th>Motif</th></tr>
        </thead>
        <tbody>
            @php $stock = 0; @endphp
            @foreach($mouvements as $m)
                @php
                    if($m->type == 'entree') {
                        $stock += $m->quantite;
                        $entree = $m->quantite;
                        $sortie = '-';
                    } else {
                        $stock -= $m->quantite;
                        $entree = '-';
                        $sortie = $m->quantite;
                    }
                @endphp
                <tr>
                    <td>{{ $m->created_at->format('d/m/Y H:i') }}</td>
                    <td>{{ $m->type == 'entree' ? 'ENTRÉE' : 'SORTIE' }}</td>
                    <td>{{ $entree }}</td>
                    <td>{{ $sortie }}</td>
                    <td>{{ $stock }}</td>
                    <td>{{ $m->motif ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    @else
        <p>Aucun mouvement trouvé</p>
    @endif
    
    <div class="footer">
        Document généré automatiquement - ISTAHT Tanger
    </div>
</body>
</html>