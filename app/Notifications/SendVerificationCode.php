<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SendVerificationCode extends Notification
{
    use Queueable;

    protected $code;

    public function __construct($code)
    {
        $this->code = $code;
    }

    public function toInject($notifiable)
    {
        return ['mail'];
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Code de vérification de l\'email')
            ->greeting('Bonjour !')
            ->line('Voici votre code de vérification pour l\'email :')
            ->line($this->code)
            ->line('Ce code est valide pendant 15 minutes.')
            ->line('Merci de vous être inscrit !');
    }
}