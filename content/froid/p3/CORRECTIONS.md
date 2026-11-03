# Corrections apportées au support de la Partie 3

Journal destiné au formateur (décisions Q29 et Q45 du 2026-11-03). Le texte servi à l'apprenant intègre la correction sans la signaler. Les pages renvoient au support imprimé « Les bases de l'électricité industrielle » (photos `reference/cours/03_partie3`, pages 2 à 31). Les fautes de frappe sans incidence technique (« éclectique », « asycnchrone », « démarrage directe »…) ne sont pas listées.

## 1. Différence entre moteur synchrone et moteur asynchrone (module 1)

- **Page** : 4
- **Texte d'origine** : « Sur le plan physique, la différence entre un moteur asynchrone et un moteur synchrone se trouve au niveau du stator. Le rotor d'un moteur synchrone se compose d'un aimant… »
- **Correction** : la différence se trouve au niveau du **rotor** (aimant ou électroaimant pour le synchrone, cage d'écureuil pour l'asynchrone). La phrase d'introduction est aussi précisée : le rotor tourne aussi vite (synchrone) ou un peu moins vite (asynchrone) que le **champ tournant** du stator, et non « que le stator », qui est fixe.
- **Justification** : les deux moteurs ont le même type de stator triphasé ; la phrase suivante du support décrit d'ailleurs bien les deux rotors.

## 2. Tensions de l'exemple de couplage triangle (module 3)

- **Page** : 16
- **Texte d'origine** : « Exemple Moteur 400V/790V, Réseau 230/400V » ; le schéma du couplage triangle porte « U 380 V ».
- **Correction** : moteur **400/690 V** sur un réseau 230/400 V ; chaque enroulement reçoit 400 V. Le schéma redessiné porte 400 V.
- **Justification** : les deux tensions d'un moteur triphasé sont dans le rapport √3 (400 × √3 ≈ 690 V) ; 790 V n'est pas une tension normalisée (IEC 60038). Le schéma doit afficher la tension du réseau de l'exemple, 400 V.

## 3. Repérage des enroulements (module 3)

- **Page** : 18, pratique, point 1
- **Texte d'origine** : « Le repérage des enroulements du moteur asynchrone U1-U2, V1-V2, W1-W3 ou UVW-XYZ »
- **Correction** : U1-U2, V1-V2, **W1-W2** (ou U-V-W et X-Y-Z sur les moteurs anciens).
- **Justification** : chaque enroulement a deux extrémités repérées 1 et 2 ; W3 n'existe pas.

## 4. Nature du relais à bobine et contacts (module 2)

- **Page** : 11
- **Texte d'origine** : « Les relais électroniques » ; « Un relais électronique est un interrupteur qui se commande avec une tension continue ou alternative de faible puissance. »
- **Correction** : le relais à bobine et contacts est un relais **électromécanique** ; seul le relais statique (triac et optocoupleur) est électronique.
- **Justification** : le relais décrit (SPST à DPDT) a une bobine et des contacts mobiles ; le support oppose d'ailleurs, juste après, le relais statique « sans éléments mécaniques ».

## 5. Optocoupleur du relais statique (module 2)

- **Page** : 11
- **Texte d'origine** : « un triac piloter par octo-coupleur pour garantir l'isolement électrique entre commande et puissance »
- **Correction** : un triac piloté par un **optocoupleur**.
- **Justification** : l'isolement entre commande et puissance est assuré par un couplage optique (LED et phototriac), d'où le nom d'optocoupleur.

## 6. Définition du relais magnétique (module 2)

- **Page** : 10
- **Texte d'origine** : « Est un déclencheur composé d'une bobine à noyau plongeur ou à armature par potentiel protégé et d'un contact auxiliaire à ouverture »
- **Correction** : déclencheur composé, sur chaque phase, d'une bobine parcourue par le courant du circuit ; en cas de court-circuit, le noyau plongeur (ou l'armature) est attiré et ouvre un contact auxiliaire à ouverture placé dans le circuit de commande.
- **Justification** : « par potentiel protégé » ne veut rien dire ; le relais magnétique réagit au courant (et non à une tension) qui traverse ses bobines.

## 7. Définition du relais thermique (module 2)

- **Page** : 12
- **Texte d'origine** : « Est un déclencheur comprenant un bilame par potentiel et par un contact auxiliaire à ouverture. »
- **Correction** : déclencheur qui comprend, sur chaque phase, un **bilame** chauffé par le courant du moteur ; en cas de surcharge prolongée, les bilames font ouvrir le contact 95-96 et fermer le contact 97-98.
- **Justification** : le bilame est un par phase (« par pôle ») et non « par potentiel » ; la définition doit dire ce qui chauffe le bilame et ce qu'il commande.

## 8. Repères des contacts de maintien et de verrouillage (module 4)

- **Page** : 19 à 21, légendes des schémas de commande
- **Texte d'origine** : « KM11, KM12 : Contact de maintien ; KM21, KM22 : Contact de verrouillage électrique »
- **Correction** : les contacts sont désignés par leur contacteur et leurs bornes : **KM1 (13-14) et KM2 (13-14)** sont les contacts de maintien, **KM1 (21-22) et KM2 (21-22)** les contacts de verrouillage électrique.
- **Justification** : sur le schéma du support, KM11 et KM21 sont en parallèle sur S1 et S2 (maintien), KM12 et KM22 en série avec les bobines opposées (verrouillage) ; la légende les mélangeait. Le NB du support confirme que les 21-22 de KM1 et de KM2 sont les contacts de verrouillage.

## 9. Contacteurs du démarrage étoile-triangle (module 5)

- **Page** : 25 à 27
- **Texte d'origine** : schéma de puissance : « KM1 Contacteur ligne, KM2 Contacteur étoile, KM3 Contacteur triangle » ; schéma de commande et fonctionnement : « KM1 = Couplage étoile ; KM3 = Couplage triangle ; KM21 = Contact auto-maintien de KM2 ; KM22 = Contact temporisé au travail » et « l'impulsion sur S1 alimente la bobine KM1… c'est le démarrage étoile ».
- **Correction** : un seul repérage pour les deux schémas et le texte (décision Q46) : **KM1 contacteur de ligne** (auto-maintien 13-14, bloc temporisé travail 55-56 et 67-68), **KM2 contacteur étoile**, **KM3 contacteur triangle**, verrouillages électrique (21-22) et mécanique entre KM2 et KM3. Le schéma de commande et le texte « 1er temps / 2e temps » sont réécrits avec ce repérage.
- **Justification** : avec deux repérages différents, l'apprenant ne peut pas relier le schéma de commande au schéma de puissance ; la convention « KM1 ligne, KM2 étoile, KM3 triangle » est celle du schéma de puissance et des catalogues de démarreurs.

## 10. Repères des protections thermiques du démarrage fractionné (module 6)

- **Page** : 31, légende
- **Texte d'origine** : « F7, F8 : Protection thermique des enroulements »
- **Correction** : **F1, F2**.
- **Justification** : le schéma de la page 30 repère F1 et F2 les relais thermiques des deux enroulements ; F7 et F8 n'y figurent pas.

## 11. Nombre de relais thermiques du démarrage fractionné (module 6)

- **Page** : 31, liste du matériel
- **Texte d'origine** : « Relais thermique 18 » (pour 18 postes, avec 36 contacteurs moteur)
- **Correction** : **36** relais thermiques, soit deux par poste.
- **Justification** : chaque enroulement a son contacteur (K1, K2) et sa protection thermique (F1, F2) : il faut autant de relais thermiques que de contacteurs moteur.

## 12. Schéma de commande avec butées de fin de course (module 4)

- **Page** : 20, bas de page
- **Texte d'origine** : schéma en partie effacé sur la photo (repères des contacts sous S3 et S4 et bobines illisibles).
- **Correction** : schéma reconstitué d'après le schéma lisible du haut de la page : S3 et S4, contacts à ouverture, en série dans la branche de KM1 et de KM2 respectivement, avant les contacts de verrouillage électrique.
- **Justification** : la légende (« S3, S4 : deux butées de fin de course ») et le fonctionnement décrit ne laissent qu'un câblage possible.

## 13. Activité pratique du module 1 (complément)

- **Page** : 6
- **Texte d'origine** : TAF 1 à TAF 4, sans consignes ni critères d'évaluation.
- **Correction** : ajout de consignes de sécurité (moteur consigné, mesures sous surveillance) et d'éléments d'évaluation.
- **Justification** : les TAF 3 et 4 font intervenir des mesures sous tension et des manipulations sur la plaque à bornes ; les consignes de sécurité doivent figurer dans l'activité.

## 14. Activité pratique du module 2 (ajout)

- **Page** : 14
- **Texte d'origine** : « TAF : Identifier tous les appareillages électriques utilisées en électricité industrielle », sans matériel, séquence ni évaluation.
- **Correction** : activité rédigée sur le modèle des autres modules : matériel, outillage, séquence de réalisation, temps estimé, éléments d'évaluation (décision Q48).
- **Justification** : chaque module a une activité pratique complète (US-43).

## 15. Activité pratique du module 4 (ajout)

- **Page** : 19 à 21
- **Texte d'origine** : aucune activité pratique, aucun matériel, aucune évaluation dans le support.
- **Correction** : activité rédigée sur le modèle des modules 3 et 5 : câblage de l'inverseur avec verrouillages, puis ajout des butées de fin de course ; matériel par poste, séquence, barème 15/60/10/15 (décision Q48).
- **Justification** : un module de 16 heures doit proposer une réalisation pratique évaluée en atelier.

## 16. Activité pratique du module 6 (ajout), avec sa compétence et sa durée

- **Page** : 29 à 31
- **Texte d'origine** : ni compétence visée, ni durée, ni activité pratique ; seule la liste du matériel est donnée.
- **Correction** : compétence visée rédigée, durée fixée à 8 heures (décision Q41), activité rédigée (repérage à l'ohmmètre, câblage, essai), avec la liste du matériel du support et le barème 15/60/10/15 (décision Q48).
- **Justification** : chaque module a une compétence, une durée et une activité pratique (US-37, US-43).
