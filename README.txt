SMARTBRIEF APP V1 – TESTBUILD

INHALT
- index.html
- styles.css
- app.js
- assets/icons/  (Piktogramme aus der freigegebenen Referenz)
- manifest.webmanifest

FUNKTIONEN
- echte Mehrfachauswahl der Projektbereiche
- dynamischer Ablauf je nach Auswahl
- mehrere Teilbereiche in einer einzigen Anfrage
- lokale Speicherung der Formulardaten
- Datei-/Foto-Uploads mit lokaler Speicherung im Browser (IndexedDB)
- Vollständigkeitscheck
- dynamische Zusammenfassung
- Kontaktvalidierung
- Test-Senden + JSON-Export
- Browser-Zurück funktioniert über Hash-Routing

GITHUB PAGES
1. Neues Repository anlegen.
2. Den INHALT dieses Ordners in die oberste Ebene des Repositories kopieren.
3. Commit + Push.
4. GitHub: Settings > Pages.
5. Deploy from a branch > main > /(root).
6. Speichern und die angezeigte https-Adresse öffnen.

HINWEIS
Diese V1 hat absichtlich noch KEIN echtes Backend.
"Anfrage senden" prüft die Kontaktdaten und öffnet den Testmodus.
Mit "JSON exportieren" kann die komplette strukturierte Anfrage geprüft werden.

WICHTIG BEIM TESTEN
Nicht die iOS-Dateivorschau verwenden. Die App über GitHub Pages bzw. einen normalen
HTTPS-Webserver in Safari/Chrome öffnen.
