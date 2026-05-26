<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Situation des sorties</title>
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
        <h2>Situation des sorties</h2>
        <p>Période du {{ $date_debut }} au {{ $date_fin }}</p>
        <p>Total sorties: {{ $total_sorties }} unités</p>
    </div>
    
    @if($sorties->count() > 0)
    <table>
        <thead>
            <tr><th>Date</th><th>Article</th><th>Quantité</th><th>Motif</th><th>Utilisateur</th></tr>
        </thead>
        <tbody>
            @foreach($sorties as $s)
            <tr>
                <td>{{ $s->created_at->format('d/m/Y H:i') }}</td>
                <td>{{ $s->article->designation ?? '-' }}</td>
                <td>{{ $s->quantite }}</td>
                <td>{{ $s->motif ?? '-' }}</td>
                <td>{{ $s->user->name ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
        <p>Aucune sortie trouvée</p>
    @endif
    
    <div class="footer">
        Document généré automatiquement - ISTAHT Tanger
    </div>
</body>
</html>