// resources/views/pdf/bon-livraison.blade.php
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bon de livraison N°{{ $demande->id }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #006233; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #006233; font-size: 24px; }
        .info-box { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #006233; color: white; }
        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">ISTAHT Tanger</h1>
        <h2>Bon de livraison</h2>
    </div>

    <div class="info-box">
        <p><strong>N° Bon de livraison:</strong> #{{ $demande->id }}</p>
        <p><strong>Date de livraison:</strong> {{ $demande->date_traitement ? $demande->date_traitement->format('d/m/Y') : now()->format('d/m/Y') }}</p>
        <p><strong>Demandeur:</strong> {{ $demande->user->name }}</p>
        <p><strong>Email:</strong> {{ $demande->user->email }}</p>
    </div>

    <table>
        <thead>
            <tr><th>Article</th><th>Quantité demandée</th><th>Quantité livrée</th><th>Unité</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $demande->article->designation }}</td>
                <td>{{ $demande->quantite_demandee }}</td>
                <td>{{ $demande->quantite_accorde ?? $demande->quantite_demandee }}</td>
                <td>{{ $demande->article->unite_mesure }}</td>
            </tr>
        </tbody>
    </table>

    <div class="signature">
        <div>
            <p>Signature du demandeur:</p>
            <p style="margin-top: 30px;">____________________</p>
        </div>
        <div>
            <p>Signature du magasinier:</p>
            <p style="margin-top: 30px;">____________________</p>
        </div>
        <div>
            <p>Cachet de l'établissement:</p>
            <p style="margin-top: 30px;">____________________</p>
        </div>
    </div>

    <div class="footer">
        <p>Ce document atteste que l'article a bien été réceptionné.</p>
        <p>ISTAHT Tanger - {{ now()->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>