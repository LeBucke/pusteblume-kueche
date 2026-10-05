---
name: paket
description: Setzt ein Arbeitspaket aus docs/tasks um. Ohne Angabe das nächste offene aus docs/PROGRESS.md, sonst die angegebene Nummer, z. B. /paket 05.
---

# Arbeitspaket umsetzen

Gewünschtes Paket: $ARGUMENTS (leer = das erste nicht abgehakte in docs/PROGRESS.md)

1. Lies CLAUDE.md, docs/PROGRESS.md und die Paketdatei in docs/tasks/.
2. Prüfe, ob alle in der Paketdatei genannten Vorgängerpakete abgehakt sind. Wenn nicht: sag das und stoppe.
3. Lies die in der Paketdatei genannten SPEC.md Abschnitte und, bei Oberflächen, die genannten Dateien in docs/design/.
4. Schau dir den aktuellen Stand des Codes an, soweit er das Paket betrifft.
5. Zeig einen kurzen Plan: Dateien, Migrationen, neue Abhängigkeiten, offene Fragen. Warte auf Pauls OK.
6. Setze das Paket um. Nur den Umfang des Pakets.
7. Lass `npm run lint`, `npm run typecheck`, `npm test` und `npm run build` laufen und behebe Fehler.
8. Gehe die Liste „Fertig, wenn“ der Paketdatei Punkt für Punkt durch und sag ehrlich, was erfüllt ist und was nicht.
9. Aktualisiere docs/PROGRESS.md (Haken, Datum, ein Satz) und bei Bedarf docs/DECISIONS.md.
10. Committe mit der Nachricht `Paket NN: Titel`.
11. Nenne Paul die Schritte aus „Von Hand testen“ und stoppe. Nicht mit dem nächsten Paket beginnen.
