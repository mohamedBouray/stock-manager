<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bon de réception {{ $bon->numero_bon }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            color: #1a56db;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0;
            color: #666;
        }
        .info {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }
        .info table {
            width: 100%;
        }
        .info td {
            padding: 5px;
        }
        .info .label {
            font-weight: bold;
            width: 120px;
        }
        table.data {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        table.data th {
            background: #f3f4f6;
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-weight: bold;
        }
        table.data td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .signatures {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }
        .signature {
            text-align: center;
            width: 200px;
        }
        .signature .line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .logo { text-align: center; margin-bottom: 20px; }
        .logo img { max-height: 80px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>BON DE RÉCEPTION N° {{ $bon->numero_bon }}</h1>
        <p>Institut Spécialisé de Technologie Appliquée Hôtelière et Touristique de Tanger</p>
    </div>

    <div class="info">
        <table>
            <tr>
                <td class="label">Date de réception :</td>
                <td>{{ \Carbon\Carbon::parse($bon->date_reception)->format('d/m/Y') }}</td>
                <td class="label">N° Commande :</td>
                <td>{{ $bon->commandeFournisseur->numero_commande ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Fournisseur :</td>
                <td>{{ $bon->commandeFournisseur->fournisseur ?? '—' }}</td>
                <td class="label">Magasin :</td>
                <td>{{ $bon->commandeFournisseur->magasin->nom_magasin ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Réceptionné par :</td>
                <td>{{ $magasinier ?? auth()->user()->name }}</td>
                <td class="label">Date impression :</td>
                <td>{{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</td>
            </tr>
        </table>
    </div>

    <h3>Articles réçus</h3>
    <table class="data">
        <thead>
            <tr>
                <th>Code barre</th>
                <th>Désignation</th>
                <th>Unité</th>
                <th class="text-center">Quantité reçue</th>
            </tr>
        </thead>
        <tbody>
            @foreach($bon->lignes as $ligne)
            <tr>
                <td>{{ $ligne->article->code_barre ?? '—' }}</td>
                <td>{{ $ligne->article->designation ?? '—' }}</td>
                <td>{{ $ligne->article->unite_mesure ?? 'Pièce' }}</td>
                <td class="text-center">{{ $ligne->quantite_recue }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" class="text-right bold">Total :</td>
                <td class="text-center bold">{{ $bon->lignes->sum('quantite_recue') }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="signatures">
        <div class="signature">
            <div class="line">Signature du magasinier</div>
        </div>
        <div class="signature">
            <div class="line">Cachet de l'établissement</div>
        </div>
    </div>

    <div class="footer">
        <p>ISTAHT Tanger - Service de gestion des stocks</p>
        <p>Document généré automatiquement - Fait foi de la réception des articles</p>
    </div>
</body>
</html>