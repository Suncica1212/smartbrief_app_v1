SMARTBRIEF APP V1 – SWISS-HOSTING-VORBEREITUNG

INHALT
- index.html
- styles.css
- app.js
- assets/icons/  (Piktogramme aus der freigegebenen Referenz)
- assets/fonts/  (Inter lokal, inklusive Lizenz)
- assets/config.js  (kundenspezifische Datenschutz-/Uploadregeln)
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
- Datenschutzbestätigung und transparente Aufbewahrungsinformation
- lokale Inter-Schrift ohne Google Fonts
- Uploadprüfung mit verständlichen Fehlermeldungen
- qualitätsschonende Optimierung grosser JPG-/WEBP-Bilder
- konfigurierbare Aufbewahrungsfrist (30/90/180 Tage; Standard 90)
- automatische Bereinigung abgelaufener lokaler Entwürfe
- ZIP/PDF- und JSON-Export im Testmodus
- Browser-Zurück funktioniert über Hash-Routing

GITHUB PAGES
1. Neues Repository anlegen.
2. Den INHALT dieses Ordners in die oberste Ebene des Repositories kopieren.
3. Commit + Push.
4. GitHub: Settings > Pages.
5. Deploy from a branch > main > /(root).
6. Speichern und die angezeigte https-Adresse öffnen.

HINWEIS
Diese V1 hat noch KEIN echtes Backend.
"Anfrage senden" prüft die Kontaktdaten und öffnet den Testmodus.
Mit "JSON exportieren" kann die komplette strukturierte Anfrage geprüft werden.

VORBEREITET FÜR DEN PRODUKTIVBETRIEB BEI INFOMANIAK
- verschlüsselte Übertragung an ein Schweizer Backend
- Speicherung und Verarbeitung der Projektdaten in der Schweiz
- automatische serverseitige Löschung gemäss assets/config.js
- Bestätigung an ausführende Firma und anfragende Person
- Projektunterlagen und sämtliche Dateien ausschliesslich über geschützte, zeitlich begrenzte Download-Links statt Mailanhang
- spätere Verwaltung von Aufbewahrung und Datenschutz im SmartBrief-Adminsystem

Wichtig: Diese serverseitigen Funktionen werden erst mit dem Infomaniak-Backend aktiv.
Die aktuelle GitHub-Pages-Version behauptet deshalb nicht, Daten bereits zu übertragen.

WICHTIG BEIM TESTEN
Nicht die iOS-Dateivorschau verwenden. Die App über GitHub Pages bzw. einen normalen
HTTPS-Webserver in Safari/Chrome öffnen.
