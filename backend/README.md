# SmartBrief Backend – Phase 1: Backend & Datenhaltung

Produktionsgrundlage für den Betrieb auf Infomaniak Public Cloud. Die bestehende GitHub-Pages-Oberfläche bleibt in dieser Phase unverändert.

## Bereits umgesetzt

- Mandantenfähige REST-API für Entwürfe, Datei-Uploads, Löschen und Absenden
- MySQL-Datenmodell mit 30/90/180 Tagen Aufbewahrung pro Kunde
- AES-256-GCM-Verschlüsselung der Anfrageinhalte und Originaldateinamen
- private S3-kompatible Ablage ohne öffentliche Objekt-URLs
- serverseitige Typprüfung anhand des Dateiinhalts, nicht der Dateiendung
- serverseitige Bildnormalisierung auf JPEG, maximal 5000 px und Qualitätsstufe 88
- Limits passend zum Prototyp: 25 MiB Bildquelle, 12 MiB optimiertes Bild, 50 MiB sonstige Datei, 150 MiB pro Projekt
- kurzlebiges, zufälliges Bearbeitungs-Token; in MySQL liegt nur dessen Hash
- automatische vollständige Löschung abgelaufener Anfragen aus Object Storage und MySQL
- exakte CORS-Freigaben, Rate Limiting, Security Header, PII-redigierte Logs
- Docker-Image ohne Root-Rechte und mit read-only Dateisystem
- lokale Entwicklungsumgebung mit MySQL und MinIO

## Datenfluss

1. Frontend erstellt eine verschlüsselt gespeicherte Anfrage mit `POST /api/v1/submissions`.
2. Die API liefert `submissionId`, Referenz und ein nur dem Browser bekanntes Upload-Token.
3. Dateien werden einzeln mit `POST /api/v1/submissions/:id/files` hochgeladen.
4. Dateien bleiben privat; die Datenbank enthält nur Metadaten und den nicht öffentlichen Object-Storage-Schlüssel.
5. `POST /api/v1/submissions/:id/submit` sperrt die Anfrage für Änderungen.
6. Der Löschjob entfernt nach Ablauf der kundenspezifischen Frist Dateien und Datensatz.

## Lokaler Start

1. `.env.example` nach `.env` kopieren und alle `change-me`-/`replace-...`-Werte ersetzen.
2. Den privaten Bucket `smartbrief-dev-private` in MinIO anlegen.
3. `docker compose up -d mysql minio`
4. `npm install && npm run migrate`
5. `npm run tenant:create -- "Testfirma AG" offerte@testfirma.ch https://suncica1212.github.io 90`
6. `npm run dev`

## Infomaniak-Produktion

- API-Container auf einem Ubuntu-LTS-App-Server betreiben.
- MySQL-Verbindung auf die Managed-MySQL-Instanz und S3-Werte auf einen privaten Infomaniak-Object-Storage-Bucket setzen.
- TLS ausschliesslich am vorgeschalteten Reverse Proxy terminieren; API nur intern auf Port 3000 freigeben.
- Produktions- und Entwicklungsbucket sowie Zugangsdaten strikt trennen.
- Object Storage zusätzlich mit einer serverseitigen Lifecycle-Regel als Sicherheitsnetz konfigurieren. Die Anwendung bleibt für die fristgerechte Löschung von Datei und Datenbankeintrag verantwortlich.
- Verschlüsselungsschlüssel, Token-Pepper und Zugangsdaten nie in Git speichern; als geschützte Server-Secrets setzen und separat sichern.

## Nächste Produktionsphasen

1. Frontend an diese API anbinden und Testmodus entfernen.
2. PDF/ZIP serverseitig erzeugen, geschützte zeitlich begrenzte Download-Links ausgeben und E-Mails an Firma sowie anfragende Person versenden.
3. Adminsystem mit Mandantenkonfiguration, Status und kontrolliertem Zugriff ergänzen.

Die API ist absichtlich noch nicht mit echten Infomaniak-Zugangsdaten versehen. Dafür werden in der Einrichtungsphase nur die von Infomaniak erzeugten Endpunkte und Secrets benötigt.
