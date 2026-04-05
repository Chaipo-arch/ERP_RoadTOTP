<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 24px; text-align: center; border-bottom: 1px solid #334155;">
                            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <span style="font-size: 24px; font-weight: bold; color: white;">R</span>
                            </div>
                            <h1 style="color: #f8fafc; font-size: 24px; font-weight: 700; margin: 0 0 8px;">
                                Vous êtes invité !
                            </h1>
                            <p style="color: #94a3b8; font-size: 15px; margin: 0;">
                                {{ config('app.name') }}
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                                Bonjour,
                            </p>
                            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                Vous avez été invité à rejoindre la plateforme <strong style="color: #fbbf24;">{{ config('app.name') }}</strong>.
                                Cliquez sur le bouton ci-dessous pour créer votre mot de passe et finaliser votre inscription.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $setupUrl }}" 
                                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">
                                            Créer mon compte
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="background-color: #0f172a; border-radius: 10px; padding: 20px; border: 1px solid #334155; margin: 24px 0;">
                                <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px;">
                                    ⏰ Ce lien expire dans <strong style="color: #fbbf24;">48 heures</strong>.
                                </p>
                                <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                                    Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
                                </p>
                            </div>

                            <p style="color: #64748b; font-size: 13px; margin: 24px 0 0;">
                                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                                <a href="{{ $setupUrl }}" style="color: #fbbf24; word-break: break-all; font-size: 12px;">{{ $setupUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #334155;">
                            <p style="color: #475569; font-size: 12px; margin: 0;">
                                © {{ date('Y') }} {{ config('app.name') }}. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
