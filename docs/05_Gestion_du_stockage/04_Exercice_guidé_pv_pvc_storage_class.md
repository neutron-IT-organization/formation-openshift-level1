# Exercice Guidé : Persistent Volumes (PV), PVC et Storage Class

## Objectifs

A la fin de cet exercice, vous serez capable de :

- [ ] Comprendre la différence entre le stockage **éphémère** (`emptyDir`) et le stockage **persistant** (PVC)
- [ ] Observer concrètement la **perte de données** causée par un volume `emptyDir`
- [ ] Créer un **PersistentVolumeClaim** (PVC) pour demander du stockage persistant
- [ ] Modifier un déploiement pour **remplacer** un volume éphémère par un PVC
- [ ] Vérifier que les données **survivent** à la suppression d'un pod
- [ ] Inspecter les **Storage Classes** disponibles dans le cluster

---

:::tip Terminal web OpenShift
Toutes les commandes `oc` de cet exercice sont à exécuter dans le **terminal web OpenShift**. Cliquez sur l'icône de terminal en haut à droite de la console pour l'ouvrir.

![Icône du terminal web](/img/screenshots/web_terminal_icon.png)
:::

## Ce que vous allez apprendre

Dans cet exercice, vous allez travailler avec une application **Todo App** connectée à une base de données **PostgreSQL**. Au départ, PostgreSQL utilise un volume éphémère (`emptyDir`) : cela signifie que les données sont **perdues** à chaque fois que le pod est supprimé ou redémarré. Vous allez constater ce problème par vous-même, puis le résoudre en passant à un stockage persistant grâce à un **PVC** (PersistentVolumeClaim). Enfin, vous vérifierez que vos données survivent désormais aux redémarrages.

Le schéma ci-dessous illustre la différence fondamentale entre ces deux approches :

![Éphémère vs Persistant](./images/emptydir-vs-pvc.svg)

:::info Pourquoi cet exercice est important
En production, une base de données qui perd ses données au moindre redémarrage serait catastrophique. Comprendre le stockage persistant est **indispensable** pour tout opérateur d'applications sur OpenShift ou Kubernetes.
:::

---

## Prérequis

Une application **Todo App** connectée à PostgreSQL est **déjà déployée** dans votre namespace. L'application utilise actuellement un stockage éphémère (`emptyDir`).

:::note Ce qui est déjà en place
- Un **Deployment** `todo-app` : l'interface web de la liste de tâches
- Un **Deployment** `postgres` : la base de données PostgreSQL (image `registry.access.redhat.com/rhscl/postgresql-12-rhel7:latest`)
- Un **Service** et une **Route** pour accéder à l'application
- Un **Secret** `postgres-credentials` contenant les identifiants de la base de données
- Le volume de PostgreSQL est configuré en `emptyDir` (stockage éphémère)
:::

Commencez par vérifier que les déploiements sont bien présents :

```bash
oc get deployment
```

**Sortie attendue :**

```
NAME        READY   UP-TO-DATE   AVAILABLE   AGE
postgres    1/1     1            1           5m
todo-app    1/1     1            1           5m
```

Récupérez ensuite l'URL de la Todo App :

```bash
oc get route todo-route -o jsonpath='https://{.spec.host}'
```

**Sortie attendue :**

```
https://todo-route-votre-namespace.apps.cluster.example.com
```

Ouvrez cette URL dans votre navigateur. Vous devriez voir l'interface de la Todo App.

:::tip Premier test
Ajoutez **2 ou 3 tâches** dans l'interface (par exemple : "Acheter du pain", "Lire la documentation OpenShift"). Vous en aurez besoin pour l'étape suivante.
:::

---

## Étape 1 : Observer la perte de données avec le stockage éphémère

### Pourquoi cette étape ?

Avant de résoudre un problème, il faut le **voir** de ses propres yeux. Vous allez constater ce qui se passe quand une base de données utilise un volume `emptyDir` et que son pod est supprimé.

### 1.1 - Vérifier le type de volume actuel

Commencez par inspecter la configuration des volumes du déploiement PostgreSQL :

```bash
oc get deployment postgres -o jsonpath='{.spec.template.spec.volumes}' | python3 -m json.tool
```

**Sortie attendue :**

```json
[
    {
        "name": "postgres-storage",
        "emptyDir": {}
    }
]
```

:::info Que signifie emptyDir ?
Un volume `emptyDir` est un répertoire **vide** créé en même temps que le pod. Il existe uniquement **tant que le pod existe**. Dès que le pod est supprimé, le répertoire et tout son contenu sont **définitivement supprimés**.
:::

### 1.2 - Ajouter des tâches dans l'application

Si ce n'est pas déjà fait, ouvrez la Todo App dans votre navigateur et ajoutez quelques tâches. Vous devriez voir quelque chose comme ceci :

![Tâches ajoutées](./images/task-ephemere.png)

### 1.3 - Supprimer le pod PostgreSQL

Maintenant, supprimez le pod PostgreSQL pour simuler un redémarrage :

```bash
oc delete pod -l app=postgres
```

**Sortie attendue :**

```
pod "postgres-xxxxxxxxx-xxxxx" deleted
```

:::warning Que se passe-t-il en arrière-plan ?
Quand vous supprimez un pod géré par un Deployment, Kubernetes en **recrée automatiquement un nouveau**. Mais le nouveau pod démarre avec un volume `emptyDir` **vide** - toutes les données de l'ancien pod sont perdues.
:::

Attendez que le nouveau pod soit prêt :

```bash
oc get pods -l app=postgres -w
```

**Sortie attendue :**

```
NAME                        READY   STATUS    RESTARTS   AGE
postgres-xxxxxxxxx-yyyyy    1/1     Running   0          15s
```

Appuyez sur `Ctrl+C` pour quitter le mode watch une fois que le pod est `Running`.

### 1.4 - Constater la perte de données

Retournez dans votre navigateur et **rafraîchissez la page** de la Todo App.

![Tâches disparues](./images/task-ephemere-remove.png)

**Les tâches ont disparu.** La base de données est vide car le nouveau pod a démarré avec un volume `emptyDir` vierge.

:::warning Leçon importante
Avec `emptyDir`, les données sont **éphémères**. Ce type de volume ne doit **jamais** être utilisé pour des données que vous souhaitez conserver (bases de données, fichiers utilisateurs, etc.).
:::

### Vérification de l'étape 1

Avant de passer à la suite, assurez-vous que :

- [x] Vous avez vérifié que le déploiement PostgreSQL utilise bien `emptyDir`
- [x] Vous avez ajouté des tâches dans la Todo App
- [x] Vous avez supprimé le pod PostgreSQL
- [x] Vous avez constaté que les tâches ont **disparu** après le redémarrage

---

## Étape 2 : Créer un PersistentVolumeClaim (PVC)

### Pourquoi cette étape ?

Pour que les données survivent à la suppression d'un pod, nous avons besoin d'un **stockage indépendant du pod**. C'est exactement ce que fournit un **PersistentVolumeClaim** (PVC) : une demande de stockage persistant qui sera satisfaite par le cluster.

![PV vs PVC vs StorageClass](./images/pv_vs_pvc_vs_storageclass.png)

:::info Comment fonctionne le PVC ?
1. Vous créez un **PVC** : c'est une **demande** de stockage (par exemple : "je veux 1 Go en lecture-écriture")
2. Le cluster trouve ou crée un **PV** (Persistent Volume) qui correspond à cette demande
3. Le PVC est **lié** (Bound) au PV
4. Vous montez le PVC dans votre pod - le stockage persiste même si le pod est supprimé
:::

### 2.1 - Créer le fichier PVC

Créez un fichier nommé `postgres-pvc.yaml` avec le contenu suivant :

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce       # Un seul pod peut lire/écrire à la fois
  resources:
    requests:
      storage: 1Gi        # Nous demandons 1 Go de stockage
```

:::tip Explication des champs
- **`accessModes: ReadWriteOnce`** (RWO) : le volume peut être monté en lecture-écriture par **un seul noeud** à la fois. C'est le mode le plus courant pour les bases de données.
- **`storage: 1Gi`** : la quantité de stockage demandée. Pour notre exercice, 1 Go est largement suffisant.
- Nous ne spécifions pas de `storageClassName` : le cluster utilisera la **Storage Class par défaut**.
:::

### 2.2 - Appliquer le PVC

#### Méthode 1 : Via la console web (bouton +)

Cliquez sur le bouton **+** en haut à droite de la console, collez le contenu du fichier `postgres-pvc.yaml` et cliquez sur **Create**.

![Bouton + pour importer du YAML dans la console OpenShift](/img/screenshots/console-add-button.png)

#### Méthode 2 : Via le terminal

```bash
oc apply -f postgres-pvc.yaml
```

**Sortie attendue :**

```
persistentvolumeclaim/postgres-pvc created
```

### 2.3 - Vérifier que le PVC est lié

```bash
oc get pvc postgres-pvc
```

**Sortie attendue :**

```
NAME           STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
postgres-pvc   Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   1Gi        RWO            thin-csi       10s
```

:::warning Le statut doit être "Bound"
Si le statut est `Pending` au lieu de `Bound`, cela signifie que le cluster n'a pas encore trouvé ou créé de PV correspondant. Attendez quelques secondes et relancez la commande. Si le statut reste `Pending`, demandez à votre formateur de vérifier la configuration du cluster.
:::

### Vérification de l'étape 2

Avant de passer à la suite, assurez-vous que :

- [x] Vous avez créé le fichier `postgres-pvc.yaml`
- [x] Vous avez appliqué le PVC avec `oc apply`
- [x] Le PVC est en statut **Bound**

---

## Étape 3 : Modifier le déploiement PostgreSQL pour utiliser le PVC

### Pourquoi cette étape ?

Le PVC existe maintenant, mais PostgreSQL ne l'utilise pas encore. Nous devons modifier le déploiement pour **remplacer** le volume `emptyDir` par notre PVC.

### 3.1 - Créer le fichier de déploiement modifié

Créez un fichier `postgres-pvc-deployment.yaml` avec le contenu suivant :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      volumes:
        - name: postgres-storage
          # highlight-start
          persistentVolumeClaim:      # Avant : emptyDir: {}
            claimName: postgres-pvc   # Référence vers notre PVC
          # highlight-end
      containers:
        - name: postgres
          image: registry.access.redhat.com/rhscl/postgresql-12-rhel7:latest
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRESQL_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_USER
            - name: POSTGRESQL_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_PASSWORD
            - name: POSTGRESQL_DATABASE
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_DB
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/pgsql/data   # Répertoire de données PostgreSQL
```

:::info Qu'est-ce qui a changé ?
La seule différence par rapport au déploiement initial est la section `volumes`. Au lieu de :
```yaml
volumes:
  - name: postgres-storage
    emptyDir: {}
```
Nous avons maintenant :
```yaml
volumes:
  - name: postgres-storage
    persistentVolumeClaim:
      claimName: postgres-pvc
```
Tout le reste (container, ports, variables d'environnement, volumeMounts) est **identique**.
:::

### 3.2 - Appliquer le nouveau déploiement

#### Méthode 1 : Via la console web (bouton +)

Cliquez sur le bouton **+** en haut à droite de la console, collez le contenu du fichier `postgres-pvc-deployment.yaml` et cliquez sur **Create**.

![Bouton + pour importer du YAML dans la console OpenShift](/img/screenshots/console-add-button.png)

#### Méthode 2 : Via le terminal

```bash
oc apply -f postgres-pvc-deployment.yaml
```

**Sortie attendue :**

```
deployment.apps/postgres configured
```

:::note "configured" et non "created"
Le message dit `configured` car le déploiement `postgres` existait déjà. Kubernetes a **mis à jour** la configuration existante au lieu d'en créer une nouvelle.
:::

### 3.3 - Attendre que le nouveau pod soit prêt

```bash
oc rollout status deployment/postgres
```

**Sortie attendue :**

```
deployment "postgres" successfully rolled out
```

Vérifiez que le pod est bien en cours d'exécution :

```bash
oc get pods -l app=postgres
```

**Sortie attendue :**

```
NAME                        READY   STATUS    RESTARTS   AGE
postgres-xxxxxxxxx-zzzzz    1/1     Running   0          30s
```

### 3.4 - Vérifier que le PVC est bien utilisé

```bash
oc get deployment postgres -o jsonpath='{.spec.template.spec.volumes}' | python3 -m json.tool
```

**Sortie attendue :**

```json
[
    {
        "name": "postgres-storage",
        "persistentVolumeClaim": {
            "claimName": "postgres-pvc"
        }
    }
]
```

:::tip Confirmé !
Le volume `emptyDir` a bien été remplacé par un `persistentVolumeClaim`. PostgreSQL utilise maintenant un stockage persistant.
:::

### Vérification de l'étape 3

Avant de passer à la suite, assurez-vous que :

- [x] Vous avez créé le fichier `postgres-pvc-deployment.yaml`
- [x] Le déploiement a été mis à jour (`configured`)
- [x] Le rollout est terminé avec succès
- [x] Le volume est désormais un `persistentVolumeClaim` (et non plus `emptyDir`)

---

## Étape 4 : Tester la persistance des données

### Pourquoi cette étape ?

C'est le moment de vérité. Nous allons reproduire exactement le même scénario que l'étape 1 (ajouter des tâches, supprimer le pod) et vérifier que cette fois-ci, **les données sont conservées**.

### 4.1 - Ajouter de nouvelles tâches

Ouvrez la Todo App dans votre navigateur et ajoutez de nouvelles tâches (par exemple : "Apprendre les PVC", "Maîtriser OpenShift").

![Tâches ajoutées avec PVC](./images/task-permanente.png)

### 4.2 - Supprimer le pod PostgreSQL

Comme à l'étape 1, supprimez le pod :

```bash
oc delete pod -l app=postgres
```

**Sortie attendue :**

```
pod "postgres-xxxxxxxxx-zzzzz" deleted
```

### 4.3 - Attendre la recréation du pod

```bash
oc get pods -l app=postgres -w
```

**Sortie attendue :**

```
NAME                        READY   STATUS    RESTARTS   AGE
postgres-xxxxxxxxx-aaaaa    1/1     Running   0          10s
```

Appuyez sur `Ctrl+C` pour quitter le mode watch.

### 4.4 - Vérifier que les données sont toujours là

Retournez dans votre navigateur et **rafraîchissez la page**.

**Les tâches sont toujours présentes !**

:::tip Succès !
Contrairement à l'étape 1, les données ont survécu à la suppression du pod. Le PVC a conservé les données de PostgreSQL de manière **indépendante** du cycle de vie du pod.
:::

### Vérification de l'étape 4

Avant de passer à la suite, assurez-vous que :

- [x] Vous avez ajouté des tâches dans la Todo App
- [x] Vous avez supprimé le pod PostgreSQL
- [x] Après le redémarrage, les tâches sont **toujours présentes**

---

## Étape 5 : Inspecter le PVC et la Storage Class

### Pourquoi cette étape ?

Maintenant que le PVC fonctionne, prenons un moment pour comprendre **comment** le cluster a satisfait notre demande de stockage.

### 5.1 - Détails du PVC

```bash
oc describe pvc postgres-pvc
```

**Sortie attendue (extraits importants) :**

```
Name:          postgres-pvc
Namespace:     votre-namespace
Status:        Bound
Volume:        pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Capacity:      1Gi
Access Modes:  RWO
StorageClass:  thin-csi
Events:
  Type    Reason                 Age   From                         Message
  ----    ------                 ----  ----                         -------
  Normal  ProvisioningSucceeded  10m   persistentvolume-controller  Successfully provisioned volume ...
```

:::info Lecture des détails
- **Status: Bound** - Le PVC est lié à un PV, tout va bien
- **Volume** - L'identifiant du PV qui a été créé automatiquement
- **Capacity: 1Gi** - Le stockage alloué correspond à notre demande
- **Access Modes: RWO** - ReadWriteOnce, comme demandé
- **StorageClass: thin-csi** - La classe de stockage utilisée (celle par défaut du cluster)
:::

### 5.2 - Lister les Storage Classes

```bash
oc get storageclass
```

**Sortie attendue :**

```
NAME                 PROVISIONER                    RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
thin-csi (default)   csi.vsphere.vmware.com         Delete          Immediate           true                   90d
```

![StorageClass List](/img/screenshots/admin_storageclasses_list.png)

:::note Storage Class par défaut
La Storage Class marquée `(default)` est utilisée automatiquement quand vous ne spécifiez pas de `storageClassName` dans votre PVC. C'est pour cela que notre PVC a fonctionné sans préciser de classe de stockage.
:::

### 5.3 - Voir le PV associé

```bash
oc get pv | grep postgres-pvc
```

**Sortie attendue :**

```
pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   1Gi   RWO   Delete   Bound   votre-namespace/postgres-pvc   thin-csi   10m
```

:::info Approvisionnement dynamique
Le PV a été créé **automatiquement** par la Storage Class. C'est ce qu'on appelle l'**approvisionnement dynamique** (dynamic provisioning). Vous n'avez pas eu besoin de demander à un administrateur de créer un PV manuellement - la Storage Class s'en est chargée.
:::

### Vérification de l'étape 5

Avant de passer à la suite, assurez-vous que :

- [x] Vous avez inspecté les détails du PVC avec `oc describe`
- [x] Vous avez identifié la Storage Class par défaut du cluster
- [x] Vous comprenez le lien entre PVC, PV et Storage Class

---

## Étape 6 : Nettoyage

### Pourquoi cette étape ?

Il est important de nettoyer les ressources créées pendant l'exercice pour ne pas laisser de stockage inutilisé dans le cluster.

Supprimez le déploiement modifié et le PVC :

```bash
oc delete -f postgres-pvc-deployment.yaml
```

**Sortie attendue :**

```
deployment.apps "postgres" deleted
```

```bash
oc delete pvc postgres-pvc
```

**Sortie attendue :**

```
persistentvolumeclaim "postgres-pvc" deleted
```

:::warning Suppression du PVC
Quand vous supprimez un PVC dont la politique de récupération (Reclaim Policy) est `Delete`, le PV associé et les données qu'il contient sont **supprimés définitivement**. En production, assurez-vous toujours d'avoir une sauvegarde avant de supprimer un PVC.
:::

Vérifiez que tout a bien été nettoyé :

```bash
oc get pvc
```

**Sortie attendue :**

```
No resources found in votre-namespace namespace.
```

---

## Récapitulatif

Voici un tableau résumant les différences que vous avez observées :

| Critère | `emptyDir` (éphémère) | PVC (persistant) |
|---|---|---|
| **Durée de vie** | Liée au pod | Indépendante du pod |
| **Données après suppression du pod** | Perdues | Conservées |
| **Cas d'usage** | Cache, fichiers temporaires | Bases de données, fichiers utilisateurs |
| **Création** | Automatique avec le pod | Manuelle (fichier YAML) |
| **Taille** | Limitée par le noeud | Définie dans le PVC |
| **Résultat dans l'exercice** | Tâches disparues | Tâches conservées |

:::tip A retenir
- **`emptyDir`** = stockage temporaire, détruit avec le pod
- **PVC** = demande de stockage persistant, survit à la suppression du pod
- **PV** = le stockage réel fourni par le cluster
- **Storage Class** = le "type" de stockage disponible, permet l'approvisionnement dynamique
- En production, toute application **stateful** (base de données, file d'attente, etc.) doit utiliser un **PVC**
:::

## Conclusion

Vous avez réalisé les étapes suivantes :

1. **Constaté le problème** : avec `emptyDir`, les données PostgreSQL sont perdues à chaque redémarrage de pod
2. **Créé un PVC** : une demande de 1 Go de stockage persistant
3. **Modifié le déploiement** : remplacement du volume `emptyDir` par le PVC
4. **Vérifié la solution** : les données survivent maintenant à la suppression du pod
5. **Exploré l'infrastructure** : compréhension du lien entre PVC, PV et Storage Class

Vous maîtrisez maintenant les bases du stockage persistant dans OpenShift. Cette compétence est essentielle pour déployer des applications de production qui nécessitent la durabilité des données.
