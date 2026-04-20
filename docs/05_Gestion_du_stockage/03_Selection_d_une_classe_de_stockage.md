---
slug: /Gestion_du_stockage/Selection_d_une_classe_de_stockage
---
# Sélection d'une classe de stockage

## Introduction

Dans un cluster OpenShift, plusieurs types de stockage peuvent coexister simultanément : disques SSD rapides pour les bases de données, stockage réseau partagé pour les fichiers statiques, stockage objet pour les archives. Les **StorageClasses** sont le mécanisme qui permet de catégoriser ces différents backends et de laisser les développeurs choisir le niveau de service adapté à leur application, sans avoir à connaître les détails de l'infrastructure sous-jacente.

Une StorageClass définit :
- Le **provisioner** : le pilote (driver) responsable de créer les volumes (AWS EBS, Ceph RBD, NFS, etc.).
- La **politique de réclamation** : ce qu'il advient du stockage quand le PVC est supprimé.
- Des **paramètres spécifiques** au provisioner : type de disque, IOPS, zone de disponibilité, etc.
- Le **mode de liaison de volume** : immédiat ou différé jusqu'à la création du Pod.

---

## Objectifs de la section

A la fin de cette section, vous serez capable de :

- Lister et inspecter les StorageClasses disponibles dans un cluster.
- Comprendre la différence entre provisionnement statique et dynamique.
- Choisir la StorageClass adaptée aux besoins de performance et de fiabilité d'une application.
- Créer un PVC en spécifiant explicitement une StorageClass.
- Comprendre les politiques de réclamation et leurs implications opérationnelles.

---

## Provisionnement statique vs dynamique

### Provisionnement statique

Dans ce mode, l'administrateur crée manuellement des PersistentVolumes avant que les applications en aient besoin. C'est l'approche historique, adaptée aux environnements on-premise avec du stockage dédié.

```
Admin                          Développeur / Application
  |                                      |
  | 1. Crée PV manuellement             |
  |    (nfs-pv-01, 20Gi, RWX)           |
  |                                      |
  |                          2. Crée PVC (20Gi, RWX)
  |                                      |
  | 3. Kubernetes lie le PVC au PV <-----+
  |    (matching: taille, mode, SC)      |
  |                                      |
  |                          4. Pod monte le PVC
```

**Inconvénients du statique :**
- L'administrateur doit anticiper les besoins.
- Les PV non utilisés gaspillent des ressources.
- Difficile à automatiser dans des environnements dynamiques.

### Provisionnement dynamique

Dans ce mode - recommandé pour les environnements cloud et OpenShift - la StorageClass décrit comment créer un volume à la demande. Lorsqu'un PVC est créé, le provisioner est appelé automatiquement et un PV est créé en temps réel.

```
Développeur / Application                    Infrastructure
       |                                            |
       | 1. Crée PVC (10Gi, RWO, standard-csi)     |
       |                                            |
       | 2. K8s appelle le provisioner --------->   |
       |    de la StorageClass standard-csi         |
       |                                       3. Volume créé
       |                                          (cloud disk, LUN...)
       |                                            |
       | 4. PV créé automatiquement <-----------    |
       |                                            |
       | 5. PVC lié au PV, statut Bound             |
       |                                            |
       | 6. Pod monte le PVC                        |
```

**Avantages du dynamique :**
- Aucune intervention manuelle de l'administrateur.
- Les volumes sont créés à la demande, pas en avance.
- Adapté aux environnements élastiques et aux pipelines CI/CD.

:::tip[Activez le provisionnement dynamique dès que possible]
Dans un cluster OpenShift en production, configurez au moins une StorageClass avec un provisioner dynamique et définissez-la comme classe par défaut. Cela simplifie grandement le travail des développeurs et automatise la gestion du stockage.
:::

---

## Anatomie d'une StorageClass

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: io1-gold-storage
  annotations:
    # Marquer comme classe par défaut (optionnel)
    storageclass.kubernetes.io/is-default-class: 'false'
# Description humaine (champ OpenShift)
description: 'Stockage haute performance SSD io1 - RWO et RWOP'
# Provisioner : pilote CSI responsable de créer les volumes
provisioner: kubernetes.io/aws-ebs
# Paramètres spécifiques au provisioner
parameters:
  type: io1
  iopsPerGB: "10"
  fsType: ext4
# Politique de réclamation à la suppression du PVC
reclaimPolicy: Delete
# WaitForFirstConsumer : le PV est créé dans la zone du Pod
# Immediate : le PV est créé dès la création du PVC
volumeBindingMode: WaitForFirstConsumer
# Autoriser l'agrandissement des PVCs liés à cette classe
allowVolumeExpansion: true
```

### Les champs clés

| Champ | Valeurs possibles | Impact |
|---|---|---|
| `provisioner` | Nom du driver CSI | Détermine le backend de stockage utilisé |
| `reclaimPolicy` | `Delete`, `Retain` | Comportement à la suppression du PVC |
| `volumeBindingMode` | `Immediate`, `WaitForFirstConsumer` | Timing de création du PV |
| `allowVolumeExpansion` | `true`, `false` | Possibilité d'agrandir un PVC existant |

---

## Les StorageClasses courantes dans OpenShift

### Sur OpenShift avec ODF (OpenShift Data Foundation / Ceph)

| Nom | Provisioner | Mode | Usage recommandé |
|---|---|---|---|
| `ocs-storagecluster-ceph-rbd` | `openshift-storage.rbd.csi.ceph.com` | RWO, RWOP | Bases de données, volumes de blocs |
| `ocs-storagecluster-cephfs` | `openshift-storage.cephfs.csi.ceph.com` | RWO, RWX, ROX | Fichiers partages, CMS, NFS-like |
| `openshift-storage.noobaa.io` | `openshift-storage.noobaa.io` | Stockage objet S3 | Artefacts, backups, buckets |

### Sur OpenShift sur AWS (ROSA)

| Nom | Type de disque | IOPS | Usage recommandé |
|---|---|---|---|
| `gp3-csi` (défaut) | SSD gp3 | 3000 baseline | Charge générale, développement |
| `io1-csi` | SSD io1 provisioned | Configurable | Bases de données critiques |
| `sc1-csi` | HDD Cold | Faible | Archivage, logs froids |
| `efs-sc` | EFS (NFS managé) | Elastique | Partage de fichiers RWX |

### Sur OpenShift sur Azure (ARO)

| Nom | Type de disque | Usage recommandé |
|---|---|---|
| `managed-csi` (défaut) | Azure Managed Disk Standard SSD | Charge générale |
| `managed-premium-csi` | Azure Managed Disk Premium SSD | Bases de données |
| `azurefile-csi` | Azure Files (SMB/NFS) | Partage RWX |

### Sur OpenShift on-premise (vSphere)

| Nom | Backend | Usage recommandé |
|---|---|---|
| `thin-csi` | vSphere Thin Provisioned | Développement |
| `thick-csi` | vSphere Thick Provisioned | Production, performances |
| `vsan-default` | VMware vSAN | Haute disponibilité |

---

## Choisir la bonne StorageClass

### Arbre de décision

```
Mon application a-t-elle besoin de stockage persistant ?
  |
  +-- Non -> Utilisez emptyDir
  |
  +-- Oui -> Plusieurs Pods doivent-ils accéder au même volume simultanément ?
              |
              +-- Oui -> Mode RWX nécessaire
              |           -> CephFS, NFS, Azure Files, EFS
              |
              +-- Non -> Quel niveau de performance ?
                          |
                          +-- Critique (DB, OLTP) -> SSD haute perf
                          |    -> io1 (AWS), Premium SSD (Azure), Ceph RBD
                          |
                          +-- Standard (app web, cache) -> SSD standard
                          |    -> gp3 (AWS), Standard SSD (Azure), thin
                          |
                          +-- Archivage, logs -> HDD/Cold storage
                               -> sc1 (AWS), Standard HDD (Azure)
```

### Critères de sélection

| Critere | Impact sur le choix de la StorageClass |
|---|---|
| Nombre de Pods accedant au volume | RWO si un seul Pod, RWX si plusieurs |
| IOPS requises | SSD provisioned (io1) pour > 3000 IOPS |
| Latence | SSD local pour < 1 ms, NFS pour > 5 ms acceptable |
| Taille du volume | HDD pour les grands volumes (> 1 To) si latence acceptable |
| Politique de sauvegarde | Préférez des backends avec snapshots CSI |
| Cout | HDD < SSD standard < SSD provisioned |
| Disponibilité | Stockage distribué (Ceph, cloud managed) > hostPath |

:::tip[La StorageClass par défaut]
Si vous ne spécifiez pas de `storageClassName` dans votre PVC, Kubernetes utilise la StorageClass annotée `storageclass.kubernetes.io/is-default-class: 'true'`. Sur la plupart des clusters OpenShift, cette classe offre un niveau de service généraliste (SSD standard). Spécifiez toujours explicitement la StorageClass dans vos manifestes de production pour éviter les comportements inattendus lors d'un changement de classe par défaut.
:::

---

## Exemples pratiques

### PVC standard pour une application web

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: webapp-assets
  namespace: formation
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3-csi
  resources:
    requests:
      storage: 5Gi
```

### PVC haute performance pour une base de données

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: formation
  annotations:
    description: "Stockage PostgreSQL - SSD haute performance"
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: io1-gold-storage
  resources:
    requests:
      storage: 50Gi
```

### PVC partagé en lecture/écriture pour plusieurs Pods

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-media
  namespace: formation
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: ocs-storagecluster-cephfs
  resources:
    requests:
      storage: 20Gi
```

### StorageClass personnalisée pour l'environnement de développement

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: dev-standard
  annotations:
    storageclass.kubernetes.io/is-default-class: 'false'
description: 'Stockage standard pour les environnements de développement'
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  fsType: ext4
  encrypted: "false"
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

---

## Modes de volume : Filesystem vs Block

En plus des modes d'accès (RWO, RWX…), les StorageClasses peuvent exposer les volumes selon deux modes :

| Mode | Description | Usage |
|---|---|---|
| `Filesystem` (défaut) | Le volume est formatte avec un système de fichiers (ext4, xfs…) et monté dans un répertoire | Applications standard lisant/écrivant des fichiers |
| `Block` | Le volume est exposé comme un périphérique bloc brut (pas de système de fichiers) | Bases de données gérant leur propre I/O (Oracle, PostgreSQL avec tablespaces) |

```yaml
spec:
  volumeMode: Block  # ou Filesystem (défaut)
  accessModes:
    - ReadWriteOnce
  storageClassName: io1-gold-storage
  resources:
    requests:
      storage: 100Gi
```

:::info[Quand utiliser le mode Block ?]
Le mode Block est reservé aux applications qui gèrent elles-mêmes leurs structures de données sur le disque (certains moteurs de bases de données, logiciels de sauvegarde). Dans la grande majorité des cas, le mode `Filesystem` est le choix correct. Consultez la documentation de votre application pour déterminer si elle bénéficie du mode Block.
:::

---

## Niveaux de qualité de service (QoS)

Les StorageClasses peuvent différer significativement en termes de performances. Voici une hiérarchie typique :

| Niveau | Type de disque | IOPS typiques | Latence | Cout relatif |
|---|---|---|---|---|
| Gold | SSD NVMe / io2 | > 10 000 | < 0,5 ms | Tres élevé |
| Silver | SSD gp3 / Premium | 3 000 - 10 000 | 1 - 3 ms | Moyen |
| Bronze | SSD standard / gp2 | 100 - 3 000 | 3 - 10 ms | Faible |
| Archive | HDD / Cold | < 500 | > 10 ms | Tres faible |

Définir des StorageClasses à plusieurs niveaux QoS permet aux équipes de placer les charges de travail sur le stockage le plus adapté :

```
Bases de données transactionnelles  -> Gold (SSD NVMe, io1/io2)
Applications web, microservices     -> Silver (SSD gp3)
Logs, cache tiède                   -> Bronze (SSD standard)
Archivage, sauvegardes              -> Archive (HDD/Cold)
```

---

## Vérifier les StorageClasses disponibles

```bash
# Lister toutes les StorageClasses du cluster
oc get storageclass

# Voir les détails d'une StorageClass
oc describe storageclass standard-csi

# Identifier la classe par défaut
oc get storageclass -o jsonpath='{range .items[?(@.metadata.annotations.storageclass\.kubernetes\.io/is-default-class=="true")]}{.metadata.name}{"\n"}{end}'
```

Exemple de sortie de `oc get storageclass` :

```
NAME                          PROVISIONER                    RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
standard-csi (default)        disk.csi.azure.com             Delete          WaitForFirstConsumer   true                   45d
premium-csi                   disk.csi.azure.com             Delete          WaitForFirstConsumer   true                   45d
azurefile-csi                 file.csi.azure.com             Delete          Immediate              true                   45d
```

---

## Résumé

| Concept | Points clés |
|---|---|
| StorageClass | Definit le provisioner, la politique de réclamation et les paramètres du backend |
| Provisionnement dynamique | Crée les PV à la demande, recommandé pour OpenShift |
| Provisionnement statique | PV créés manuellement, adapté aux environnements on-premise rigides |
| reclaimPolicy Delete | PV supprimé avec le PVC, convient aux environnements de développement |
| reclaimPolicy Retain | PV conservé après suppression du PVC, recommandé pour la production |
| WaitForFirstConsumer | Le PV est créé dans la zone du noeud qui schedule le Pod, évite les problèmes de topologie |
| allowVolumeExpansion | Permet d'agrandir un PVC sans interruption de service (si le backend le supporte) |

La sélection d'une StorageClass est une décision qui impacte directement les performances, la disponibilité et le cout des applications en production. Prenez le temps d'évaluer les besoins réels de chaque workload et de documenter les classes utilisées dans vos manifestes.
