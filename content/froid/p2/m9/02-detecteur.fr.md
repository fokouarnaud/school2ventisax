## Définition

Un capteur de mouvement détecte le déplacement d'une personne ou d'un objet dans une zone donnée et peut commander une lampe. Les modèles courants pour l'éclairage utilisent la technologie infrarouge passive (PIR), qui détecte des variations du rayonnement infrarouge.

## Principe de fonctionnement

- Lorsqu'un mouvement est détecté, la sortie commande l'allumage de la lampe.
- La lampe reste allumée pendant la durée réglée.
- En l'absence de nouvelle détection, elle s'éteint à la fin de la temporisation.

Certains modèles relancent la temporisation à chaque nouvelle détection.

## Applications

- Couloirs et escaliers
- Entrées, garages et parkings
- Sanitaires et locaux de passage
- Allées et éclairage extérieur

## Bornes courantes

| Borne | Désignation | Fonction habituelle |
|---|---|---|
| L | Phase | Alimentation du capteur |
| N | Neutre | Alimentation du capteur et parfois de la lampe |
| L' / OUT | Sortie | Phase commandée vers la lampe |

Ce tableau concerne un modèle 230 V à sortie de phase commutée. Vérifier le schéma du fabricant avant tout raccordement. Comme pour l'interrupteur crépusculaire, le conducteur de protection (PE) est amené au luminaire.

## Schémas de principe

Le capteur de mouvement B1 se raccorde comme l'interrupteur crépusculaire : L et N pour l'alimentation, sortie L' vers la lampe E1, retour au neutre, PE au luminaire.

![Schéma de principe : capteur de mouvement B1 (PIR) alimenté par F1 entre L et N, sa sortie L' commande la lampe E1, PE raccordé au luminaire](img/detecteur-direct.svg)

Un interrupteur S1 raccordé en parallèle entre L et la sortie L' permet de forcer l'allumage, par exemple pour un entretien : fermé, il alimente la lampe quelle que soit la détection.

![Capteur de mouvement avec forçage : l'interrupteur S1, en parallèle entre L et la sortie L' de B1, allume la lampe E1 en permanence](img/detecteur-forcage.svg)

| Repère | Rôle |
|---|---|
| F1 | Disjoncteur de protection du circuit |
| B1 | Capteur de mouvement infrarouge passif (PIR) |
| S1 | Interrupteur de forçage (marche permanente) |
| E1 | Lampe ou luminaire |

## Fonctionnement

1. Sans mouvement, la sortie reste inactive après la temporisation.
2. Lorsqu'un mouvement est détecté, le capteur commande la lampe.
3. Après la dernière détection, la temporisation commence ou se réinitialise selon le modèle.
4. À la fin de la durée prévue, la lampe s'éteint si aucun nouveau mouvement n'est détecté.

## Réglages

| Réglage | Signification | Rôle |
|---|---|---|
| TIME | Durée | Temps d'allumage après détection |
| LUX | Luminosité | Autorise ou limite le fonctionnement selon la lumière ambiante |
| SENS | Sensibilité | Ajuste la sensibilité ou la portée effective de détection |

**Procédure pratique**

1. Couper l'alimentation et vérifier l'absence de tension avant de toucher aux conducteurs.
2. Vérifier le raccordement avec la notice du modèle.
3. Refermer le boîtier avant la remise sous tension.
4. Régler TIME sur une durée courte pour les essais.
5. Régler LUX selon le fonctionnement souhaité, puis ajuster SENS.
6. Tester la zone en marchant à différents endroits et corriger les réglages.
