// resources/views/pdf/demande.blade.php
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bon de demande N°{{ $demande->id }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #006233; padding-bottom: 20px; }
        .logo { max-width: 100px; margin-bottom: 10px; }
        .title { color: #006233; font-size: 24px; }
        .info-box { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #006233; color: white; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
        .status { display: inline-block; padding: 5px 10px; border-radius: 5px; font-size: 12px; }
        .status-approuvee { background: #d4edda; color: #155724; }
        .status-refusee { background: #f8d7da; color: #721c24; }
        .status-attente { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('image/ISTAHT.png') }}" class="logo" style="width: 80px;">
        <h1 class="title">ISTAHT Tanger</h1>
        <h2>Bon de demande interne</h2>
    </div>

    <div class="info-box">
        <p><strong>N° Demande:</strong> #{{ $demande->id }}</p>
        <p><strong>Date de création:</strong> {{ $demande->created_at->format('d/m/Y à H:i') }}</p>
        <p><strong>Demandeur:</strong> {{ $demande->user->name }}</p>
        <p><strong>Email:</strong> {{ $demande->user->email }}</p>
    </div>

    <table>
        <thead>
            <tr><th>Article</th><th>Quantité demandée</th><th>Unité</th><th>Statut</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $demande->article->designation }}</td>
                <td>{{ $demande->quantite_demandee }}</td>
                <td>{{ $demande->article->unite_mesure }}</td>
                <td>
                    @if($demande->statut == 'approuvee')
                        <span class="status status-approuvee">✓ Approuvée</span>
                    @elseif($demande->statut == 'refusee')
                        <span class="status status-refusee">✗ Refusée</span>
                    @else
                        <span class="status status-attente">⏳ En attente</span>
                    @endif
                </td>
            </tr>
        </tbody>
    </table>

    @if($demande->quantite_accorde)
    <div class="info-box">
        <p><strong>Quantité accordée:</strong> {{ $demande->quantite_accorde }}</p>
    </div>
    @endif

    @if($demande->motif)
    <div class="info-box">
        <p><strong>Motif:</strong> {{ $demande->motif }}</p>
    </div>
    @endif

    @if($demande->commentaire_refus)
    <div class="info-box" style="background: #f8d7da;">
        <p><strong>Motif du refus:</strong> {{ $demande->commentaire_refus }}</p>
    </div>
    @endif

    <div class="footer">
        <p>Document généré automatiquement - ISTAHT Tanger</p>
        <p>{{ now()->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>