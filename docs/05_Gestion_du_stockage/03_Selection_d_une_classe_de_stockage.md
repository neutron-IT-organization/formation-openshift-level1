# Section de Cours : Gestion des Classes de Stockage dans Kubernetes

#### Introduction
Dans Kubernetes, la gestion efficace du stockage est cruciale pour répondre aux besoins variés des applications. Les classes de stockage permettent d’associer des applications à des types de stockage spécifiques, en fournissant des services adaptés qui répondent aux exigences de performance, de fiabilité et de coût.

#### Sélection des Classes de Stockage
Les classes de stockage, définies par les administrateurs de cluster, décrivent les types de stockage disponibles. Elles peuvent être adaptées à différents environnements, comme le développement ou la production. Kubernetes supporte divers backends de stockage, permettant aux développeurs de choisir la solution qui correspond le mieux à leurs besoins, sans nécessiter de connaissances approfondies sur l'infrastructure sous-jacente.

- **Classe de stockage par défaut** : Kubernetes permet d’attribuer une classe de stockage par défaut pour l’approvisionnement dynamique. Cela signifie que si une PVC (Persistent Volume Claim) ne spécifie pas de classe, Kubernetes utilise automatiquement cette classe par défaut. Les développeurs doivent donc définir explicitement la classe de stockage requise pour leurs applications afin d'éviter des comportements inattendus.

#### Politique de Récupération
Une politique de récupération détermine le sort des données d'une PVC après sa suppression. Les deux principales politiques sont :

- **Retain** : Cette politique conserve les données sur le volume persistant (PV) après la suppression de la PVC. L'administrateur doit alors effectuer des étapes manuelles pour récupérer et réutiliser le volume.

- **Delete** : Cette politique supprime automatiquement le PV et ses données lorsque la PVC est supprimée. C'est la politique par défaut pour la plupart des approvisionneurs de stockage.

Les développeurs doivent comprendre l'impact de ces politiques sur les exigences de stockage et choisir la classe en conséquence.

#### Responsabilités des Applications
Il est essentiel de noter que Kubernetes ne modifie pas la relation entre une application et son stockage. Les applications sont responsables de l'utilisation appropriée de leurs périphériques de stockage, ce qui inclut la gestion de l'intégrité et de la cohérence des données. Des configurations incorrectes, comme le partage d'une PVC entre plusieurs pods nécessitant un accès exclusif, peuvent entraîner des comportements indésirables.

#### Modes de Volumes de Stockage
Les classes de stockage peuvent également être configurées pour prendre en charge différents modes de volumes :

- **Block** : Idéal pour des performances optimales, utilisé par des applications nécessitant un accès en mode bloc brut.
- **Filesystem** : Approprié pour les applications qui partagent des fichiers ou nécessitent un accès aux fichiers.

#### Niveaux de Qualité de Service (QoS)
Les classes de stockage peuvent également différer en termes de qualité de service. Par exemple, l'utilisation de disques SSD rapides peut convenir aux applications à accès fréquent, tandis que des disques durs plus lents peuvent être utilisés pour des fichiers rarement consultés.

#### Création d'une Classe de Stockage
La création d'une classe de stockage se fait à l'aide d'un objet `StorageClass` en YAML. Ce dernier contient des paramètres cruciaux, tels que :

- **Provisionneur** : Définit la source du plug-in de stockage.
- **Politique de récupération** : Indique si le stockage doit être supprimé ou conservé après la suppression de la PVC.
- **Mode de liaison de volume** : Spécifie comment les associations de volumes sont gérées lors de la demande d'une PVC.

Exemple d'un objet `StorageClass` :
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: io1-gold-storage
  annotations:
    storageclass.kubernetes.io/is-default-class: 'false'
description: 'Provides RWO and RWOP Filesystem & Block volumes'
parameters:
  type: io1
  iopsPerGB: "10"
provisioner: kubernetes.io/aws-ebs
reclaimPolicy: Delete
volumeBindingMode: Immediate
allowVolumeExpansion: true
```

#### Conclusion
La gestion des classes de stockage dans Kubernetes est essentielle pour garantir que les applications disposent du stockage dont elles ont besoin. En comprenant les différents types de classes de stockage, les politiques de récupération, et les responsabilités des applications, les administrateurs et développeurs peuvent optimiser les performances et la fiabilité des solutions de stockage dans un environnement Kubernetes.
