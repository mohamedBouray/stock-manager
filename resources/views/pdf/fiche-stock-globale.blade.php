<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Fiche de stock globale</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; color: #1a56db; }
        .info { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f3f4f6; border: 1px solid #ddd; padding: 10px; text-align: left; font-weight: bold; }
        td { border: 1px solid #ddd; padding: 8px; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FICHE DE STOCK GLOBALE</h1>
        <p>{{ $institut }}</p>
        <p>Date rapport: {{ \Carbon\Carbon::parse($date_rapport)->format('d/m/Y H:i') }}</p>
    </div>

    <div class="info">
        <p><strong>Période:</strong> {{ $date_debut ? \Carbon\Carbon::parse($date_debut)->format('d/m/Y') : 'Début' }} → {{ $date_fin ? \Carbon\Carbon::parse($date_fin)->format('d/m/Y') : 'Aujourd\'hui' }}</p>
        <p><strong>Total articles:</strong> {{ $total_articles }}</p>
        <p><strong>Stock total:</strong> {{ $total_stock }} unités</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Code barre</th>
                <th>Désignation</th>
                <th>Catégorie</th>
                <th class="text-center">Entrées</th>
                <th class="text-center">Sorties</th>
                <th class="text-center">Stock actuel</th>
            </tr>
        </thead>
        <tbody>
            @foreach($articles as $item)
            <tr>
                <td>{{ $item['article']->code_barre }}</td>
                <td>{{ $item['article']->designation }}</td>
                <td>{{ $item['article']->categorie->nom_categorie ?? '-' }}</td>
                <td class="text-center text-green-600">{{ $item['total_entrees'] }}</td>
                <td class="text-center text-red-600">{{ $item['total_sorties'] }}</td>
                <td class="text-center bold">{{ $item['stock_actuel'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>ISTAHT Tanger - Service de gestion des stocks</p>
        <p>Document généré automatiquement</p>
    </div>
</body>
</html>