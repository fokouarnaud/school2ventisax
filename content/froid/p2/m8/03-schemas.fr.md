## Cas de l'éclairage

Le moteur de l'horloge H1 est alimenté en permanence entre L et N. Son contact (borne commune 1) ferme vers la borne 2 pendant les plages programmées et alimente la lampe L1. Le circuit est protégé par un disjoncteur de 16 A ; le contact de l'horloge supporte 16 A au plus.

![Schéma développé : horloge H1 alimentée entre L et N, son contact 1-2 commande la lampe L1, protection F1](img/horloge-eclairage.svg)

## Cas du réfrigérateur à froid ventilé (no frost)

Dans un réfrigérateur no frost, la minuterie de dégivrage alterne deux phases : production de froid, puis dégivrage de l'évaporateur.

![Schéma simplifié d'un réfrigérateur no frost : thermostat TH, minuterie de dégivrage M et son contact C, compresseur K, résistance de dégivrage R avec thermostat TD et fusible thermique FT, lampe E1 et interrupteur de porte P](img/refrigerateur-no-frost.svg)

| Repère | Rôle |
|---|---|
| TH | Thermostat d'ambiance : met en marche le circuit quand le compartiment est trop chaud |
| M | Moteur de la minuterie de dégivrage |
| C | Contact de la minuterie : vers 4 en production de froid, vers 2 en dégivrage |
| K | Compresseur (avec son relais de démarrage et sa protection thermique) |
| R | Résistance de dégivrage de l'évaporateur |
| TD | Thermostat de fin de dégivrage : coupe la résistance quand l'évaporateur est dégivré |
| FT | Fusible thermique de sécurité (72 °C environ) |
| E1, P | Lampe intérieure et interrupteur de porte |

Le ventilateur de l'évaporateur, alimenté en parallèle sur le compresseur, n'est pas représenté.
