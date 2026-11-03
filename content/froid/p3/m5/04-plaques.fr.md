## Exercice de consolidation : lire une plaque signalétique

Les grandeurs nominales d'une plaque signalétique décrivent le fonctionnement du moteur prévu par le constructeur, dans ses meilleures performances. Elles comprennent : la puissance nominale, la vitesse nominale, la fréquence de fonctionnement, le nombre de phases, le rendement nominal, le facteur de puissance nominal, le courant nominal, l'échauffement possible (classe d'isolation) et les tensions du réseau avec leur couplage.

Répondre aux questions pour chacune des deux plaques ci-dessous. Le réseau d'alimentation est un réseau triphasé **230/400 V** (400 V entre phases).

## Plaque A

| Grandeur | Valeur |
|---|---|
| Moteur | Asynchrone triphasé |
| Tensions | 230 V en triangle, 400 V en étoile |
| Fréquence | 50 Hz |

## Plaque B

| Couplage et tension | Fréquence | Vitesse (tr/min) | Puissance (kW) | cos φ | Courant (A) |
|---|---|---|---|---|---|
| Δ 380 V | 50 Hz | 2970 | 250 | 0,92 | 434 |
| Δ 400 V | 50 Hz | 2974 | 250 | 0,90 | 422 |
| Y 690 V | 50 Hz | 2974 | 250 | 0,90 | 244 |
| Δ 415 V | 50 Hz | 2976 | 250 | 0,88 | 415 |
| Δ 440 V | 60 Hz | 3568 | 288 | 0,92 | 418 |
| Δ 460 V | 60 Hz | 3572 | 288 | 0,91 | 417 |

Autres indications de la plaque B : indice de protection IP23, température ambiante maximale 40 °C, service S1 (continu), masse 790 kg.

## Questions

Pour chaque plaque :

1. Peut-on démarrer ce moteur avec un couplage étoile ?
2. Peut-on démarrer ce moteur avec un couplage triangle ?
3. Peut-on faire un démarrage étoile-triangle avec ce moteur ?

## Corrigé

**Plaque A** (230/400 V) :

1. **Oui** : la plus grande tension de la plaque, 400 V, est égale à la tension entre phases du réseau. Le moteur se couple en étoile.
2. **Non** : en triangle, chaque enroulement recevrait 400 V au lieu des 230 V prévus ; il serait détruit.
3. **Non** : le démarrage étoile-triangle exige un moteur qui fonctionne en triangle sur le réseau. Ce moteur fonctionne en étoile ; il démarre en direct.

**Plaque B** (Δ 400 V / Y 690 V) :

1. **Non** pour un fonctionnement en étoile : l'étoile est prévue pour 690 V ; sous 400 V, chaque enroulement ne recevrait que 230 V au lieu de 400 V. L'étoile ne sert que de premier temps d'un démarrage étoile-triangle.
2. **Oui** : la plus petite tension (400 V en triangle) est égale à la tension entre phases du réseau.
3. **Oui** : le moteur fonctionne en triangle sur ce réseau ; le démarrage étoile-triangle est possible et même conseillé, vu sa puissance (250 kW) et son courant (422 A).
