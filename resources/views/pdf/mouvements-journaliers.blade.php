<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Mouvements journaliers</title>
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
        <h2>Mouvements journaliers</h2>
        <p>Date: {{ $date }}</p>
        <p>Total entrées: {{ $total_entrees }} | Total sorties: {{ $total_sorties }}</p>
    </div>
    
    @if($mouvements->count() > 0)
    <table>
        <thead>
            <tr><th>Heure</th><th>Type</th><th>Article</th><th>Qté</th><th>Magasin</th><th>Utilisateur</th></tr>
        </thead>
        <tbody>
            @foreach($mouvements as $m)
            <tr>
                <td>{{ $m->created_at->format('H:i') }}</td>
                <td>{{ $m->type == 'entree' ? 'ENTRÉE' : ($m->type == 'sortie' ? 'SORTIE' : 'AJUSTEMENT') }}</td>
                <td>{{ $m->article->designation ?? '-' }}</td>
                <td>{{ $m->quantite }}</td>
                <td>{{ $m->magasin->nom_magasin ?? '-' }}</td>
                <td>{{ $m->user->name ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
        <p>Aucun mouvement trouvé pour cette date</p>
    @endif
    
    <div class="footer">
        Document généré automatiquement - ISTAHT Tanger
    </div>
</body>
</html>