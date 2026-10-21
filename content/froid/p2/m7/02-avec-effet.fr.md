## Rôle

La minuterie avec effet commande l'allumage, l'extinction étant automatique après un temps prédéfini. **Un nouvel appui sur le bouton-poussoir relance la temporisation.**

## Schéma architectural

![Plan architectural : deux boutons-poussoirs commandent la minuterie t, qui alimente un point d'éclairage ; arrivée 230 V](img/minuterie-plan.svg)

## Schéma développé

![Schéma développé de la minuterie : le bouton-poussoir S1 alimente la bobine temporisée K1 ; le contact K1 alimente la lampe L1](img/minuterie-developpe.svg)

## Étude temporelle

La temporisation est réglée sur 3 secondes. Le bouton-poussoir S1 est actionné à 1 s, puis à 6 s et à 7 s.

![Chronogramme de la minuterie avec effet : appuis à 1, 6 et 7 secondes ; la lampe est allumée de 1 à 4 secondes, puis de 6 à 10 secondes](img/chronogramme-avec-effet.svg)

| Moment | Ce qui se passe |
|---|---|
| 1 s | Appui : la lampe s'allume pour 3 s |
| 4 s | Fin de la temporisation : la lampe s'éteint |
| 6 s | Appui : la lampe s'allume |
| 7 s | Nouvel appui : la temporisation **repart** pour 3 s |
| 10 s | La lampe s'éteint (7 + 3) |

**Remarque** : chaque nouvelle action sur le bouton-poussoir relance la temporisation.
