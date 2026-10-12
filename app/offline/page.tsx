export default function OfflinePage() {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Hors ligne — Fresque de l'IA</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, sans-serif; background: #F7F7F7; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; }
          .card { background: white; border-radius: 20px; padding: 40px 32px; max-width: 360px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .icon { font-size: 56px; margin-bottom: 16px; }
          h1 { font-size: 22px; font-weight: 800; color: #1a1a2e; margin-bottom: 10px; }
          p { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 24px; }
          a { display: block; padding: 14px; background: #534AB7; color: white; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="icon">📡</div>
          <h1>Pas de connexion</h1>
          <p>Vérifiez votre connexion internet et rechargez la page.</p>
          <a href="/">Retour à l&apos;accueil</a>
        </div>
      </body>
    </html>
  )
}
