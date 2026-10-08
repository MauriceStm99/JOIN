# Join

Join ist ein Kanban-Board, mit dem man Aufgaben im Team planen kann. Tasks lassen sich anlegen, Kontakten zuweisen und per Drag & Drop zwischen den Spalten „To do“, „In progress“, „Await feedback“ und „Done“ verschieben. Das Projekt ist im Rahmen der Weiterbildung bei der Developer Akademie entstanden.

## Technik

- HTML, CSS und JavaScript, ohne Framework
- Firebase Authentication für Login und Registrierung
- Cloud Firestore als Datenbank für Tasks und Kontakte

Firebase wird über das CDN eingebunden. Es gibt keinen Build-Schritt und nichts zu installieren.

## Lokal starten

```bash
git clone https://github.com/MauriceStm99/JOIN.git
cd JOIN
```

Die JavaScript-Dateien werden als ES-Module geladen. Ein Doppelklick auf `index.html` reicht deshalb nicht, die Seite muss über einen lokalen Server laufen. Am einfachsten geht das in VS Code mit der Erweiterung **Live Server** (Rechtsklick auf `index.html`, dann „Open with Live Server“) oder im Terminal:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` im Browser öffnen. Zum Ausprobieren reicht „Guest Log in“, über „Sign up“ kann man sich auch einen eigenen Account anlegen.

Die Firebase-Konfiguration steht in `js/core/firebase.js`. Wer mit einer eigenen Datenbank arbeiten will, trägt dort die Daten seines eigenen Firebase-Projekts ein.
