# Designvorlagen

Diese Dateien sind Referenzen, keine lauffähigen Seiten.

- `kueche-heute.dc.html`: Tagesansicht Küche, Tablet quer (1180 × 820)
- `speiseplan.dc.html`: Monatsansicht Planung, Desktop
- `einkauf.dc.html`: Einkaufsliste, Handy (390 breit)
- `eltern-woche.dc.html`: Wochenplan für Eltern, Handy
- `eltern-rezept.dc.html`: Rezept zum Nachkochen mit Haushaltsgröße, Handy
- `pusteblume-logo.png`: Logo, freigestellt aus einem Flyer. Nur Platzhalter, bis die Originaldatei der Kita vorliegt.
- `prototyp-funktionen.html`: früher Funktionsprototyp (Rezepte, Plan, Einkauf). Zeigt Abläufe und Rechenlogik, NICHT das Aussehen.

Die `.dc.html` Dateien stammen aus einem Designwerkzeug. Sie enthalten Platzhalter wie `{{d.h}}`, Beispieldaten im `<script>` Block und Bildpfade wie `/_blob/...`, die hier nicht funktionieren. Maßgeblich sind die Inline Styles: Farben, Abstände, Schriftgrößen, Rundungen, Aufbau. Die verbindlichen Design Tokens stehen in SPEC.md Abschnitt 7a.

Beim Umsetzen eines Screens: Aufbau und Abstände aus der passenden Datei übernehmen, Farben nur über die Tokens (nicht als Hexwerte im Code), Texte und Daten aus der Datenbank statt der Beispieldaten.
