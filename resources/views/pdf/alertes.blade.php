<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport des alertes stock</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background: #006233; color: white; }
        .danger { color: red; font-weight: bold; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Rapport des alertes stock</h2>
        <p>Date: {{ $date->format('d/m/Y H:i') }}</p>
        <p>Total alertes: {{ $total_alertes }} | Ruptures: {{ $ruptures }}</p>
    </div>
    
    @if($alertes->count() > 0)
    <table>
        <thead>
            <tr><th>Article</th><th>Stock actuel</th><th>Seuil alerte</th><th>Magasin</th></tr>
        </thead>
        <tbody>
            @foreach($alertes as $a)
            <tr>
                <td>{{ $a->article->designation ?? '-' }}</td>
                <td class="{{ $a->quantite_disponible == 0 ? 'danger' : '' }}">{{ $a->quantite_disponible }}</td>
                <td>{{ $a->article->seuil_alerte ?? '-' }}</td>
                <td>{{ $a->magasin->nom_magasin ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
        <p>Aucune alerte stock</p>
    @endif
    
    <div class="footer">
        Document généré automatiquement - ISTAHT Tanger
    </div>
</body>
</html>