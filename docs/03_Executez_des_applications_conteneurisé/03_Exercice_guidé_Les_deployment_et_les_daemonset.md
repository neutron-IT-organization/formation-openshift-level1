# Exercice Guidé : Les Déploiements et Rolling Updates dans OpenShift

## Ce que vous allez apprendre

Dans cet exercice, vous allez apprendre pas à pas comment **déployer une application** sur OpenShift, la **mettre à jour sans interruption de service** grâce à la stratégie Rolling Update, puis **revenir en arrière** (rollback) en cas de problème. Chaque étape est expliquée en détail pour que vous compreniez non seulement le _comment_, mais aussi le _pourquoi_.

:::info Prérequis
Avant de commencer, assurez-vous que :
- Vous êtes connecté à votre cluster OpenShift avec `oc login`
- Vous avez un projet actif (vérifiez avec `oc project`)
- Vous avez accès à la console web OpenShift
:::

---

## Objectifs

A la fin de cet exercice, vous serez capable de :

- [ ] Comprendre ce qu'est un **Deployment** et pourquoi il est essentiel dans Kubernetes/OpenShift
- [ ] Créer un déploiement avec **3 réplicas** et des **limites de ressources**
- [ ] Observer le comportement d'un **Rolling Update** lors d'une mise à jour d'image
- [ ] Consulter l'**historique des révisions** d'un déploiement
- [ ] Effectuer un **rollback** pour revenir à une version précédente
- [ ] Vérifier l'état de vos ressources à chaque étape

---

## Étape 1 : Comprendre ce que nous allons déployer

:::note Pourquoi un Deployment ?
Un **Deployment** est un objet Kubernetes qui gère le cycle de vie de vos pods. Il garantit que le nombre souhaité de réplicas est toujours en cours d'exécution. Si un pod tombe en panne, le Deployment en crée automatiquement un nouveau. C'est la manière standard de déployer des applications **sans état** (stateless) sur OpenShift.
:::

Nous allons déployer un serveur web Apache (httpd) basé sur l'image Red Hat UBI 9. Voici les caractéristiques de notre déploiement :

| Paramètre | Valeur | Explication |
|---|---|---|
| **Nom** | `my-deployment` | Le nom de notre déploiement |
| **Réplicas** | `3` | 3 copies du pod pour la haute disponibilité |
| **Image** | `registry.access.redhat.com/ubi9/httpd-24:1-3` | Serveur web Apache sur Red Hat UBI 9 |
| **Port** | `8080` | Le port sur lequel le serveur écoute |
| **CPU request** | `100m` | Le minimum de CPU garanti (0.1 core) |
| **CPU limit** | `500m` | Le maximum de CPU autorisé (0.5 core) |
| **Mémoire request** | `64Mi` | Le minimum de mémoire garanti |
| **Mémoire limit** | `128Mi` | Le maximum de mémoire autorisé |

:::tip Requests vs Limits
- **Request** = le minimum garanti. Kubernetes réserve cette quantité de ressources pour votre pod.
- **Limit** = le maximum autorisé. Si le pod dépasse cette limite, il peut être redémarré (OOMKilled pour la mémoire) ou bridé (throttled pour le CPU).

Toujours définir des requests et limits est une **bonne pratique** pour éviter qu'un pod ne consomme toutes les ressources du cluster.
:::

---

## Étape 2 : Créer le fichier de déploiement

**Pourquoi cette étape ?** Nous allons créer un fichier YAML qui décrit notre déploiement. Ce fichier est la "source de vérité" de notre application. Il permet de recréer le déploiement de manière identique à chaque fois.

Créez un fichier nommé `my-deployment.yaml` avec le contenu suivant :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-container
        image: registry.access.redhat.com/ubi9/httpd-24:1-3
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

:::info Décryptage du YAML
Voici les sections clés à comprendre :

- **`replicas: 3`** : nous voulons 3 pods identiques en permanence.
- **`selector.matchLabels`** : le Deployment utilise ce label (`app: my-app`) pour savoir quels pods il doit gérer.
- **`strategy.type: RollingUpdate`** : lors d'une mise à jour, les pods sont remplacés progressivement (et non tous en même temps).
- **`maxSurge: 1`** : pendant la mise à jour, au maximum 1 pod supplémentaire peut être créé (donc 4 pods temporairement).
- **`maxUnavailable: 1`** : pendant la mise à jour, au maximum 1 pod peut être indisponible (donc minimum 2 pods actifs).
- **`resources`** : les limites de CPU et mémoire pour chaque pod.
:::

---

## Étape 3 : Appliquer le déploiement

**Pourquoi cette étape ?** La commande `oc apply` envoie notre fichier YAML au serveur OpenShift, qui va créer les ressources décrites.

```bash
oc apply -f my-deployment.yaml
```

**Sortie attendue :**

```
deployment.apps/my-deployment created
```

:::tip Bonne pratique
Utilisez toujours `oc apply -f` plutôt que `oc create -f`. La commande `apply` est **idempotente** : elle crée la ressource si elle n'existe pas, ou la met à jour si elle existe déjà. Cela vous permet de relancer la commande sans erreur.
:::

---

## Étape 4 : Vérifier le déploiement

**Pourquoi cette étape ?** Après avoir créé un déploiement, il est essentiel de vérifier que tout s'est bien passé. Un déploiement peut échouer pour de nombreuses raisons (image introuvable, ressources insuffisantes, etc.).

### 4.1 : Vérifier l'état du Deployment

```bash
oc get deployments
```

**Sortie attendue :**

```
NAME            READY   UP-TO-DATE   AVAILABLE   AGE
my-deployment   3/3     3            3           30s
```

:::info Lecture du tableau
- **READY 3/3** : 3 pods sur 3 sont prêts.
- **UP-TO-DATE 3** : 3 pods utilisent la dernière version du template.
- **AVAILABLE 3** : 3 pods sont disponibles pour recevoir du trafic.
- Si vous voyez `0/3` dans READY, patientez quelques secondes : les pods sont en cours de démarrage.
:::

### 4.2 : Vérifier les pods

```bash
oc get pods
```

**Sortie attendue :**

```
NAME                             READY   STATUS    RESTARTS   AGE
my-deployment-5d8f6b7c4a-abc12   1/1     Running   0          30s
my-deployment-5d8f6b7c4a-def34   1/1     Running   0          30s
my-deployment-5d8f6b7c4a-ghi56   1/1     Running   0          30s
```

:::note
Les noms des pods contiennent un identifiant aléatoire (comme `abc12`). Vos noms seront différents de ceux affichés ici, c'est tout à fait normal.
:::

### 4.3 : Vérifier les détails du déploiement

```bash
oc describe deployment my-deployment
```

**Sortie attendue (extraits importants) :**

```
Name:                   my-deployment
Namespace:              votre-projet
Selector:               app=my-app
Replicas:               3 desired | 3 updated | 3 total | 3 available | 0 unavailable
StrategyType:           RollingUpdate
RollingUpdateStrategy:  1 max unavailable, 1 max surge
Pod Template:
  Containers:
   my-container:
    Image:      registry.access.redhat.com/ubi9/httpd-24:1-3
    Port:       8080/TCP
    Limits:
      cpu:     500m
      memory:  128Mi
    Requests:
      cpu:     100m
      memory:  64Mi
```

### Vérification dans la console web

Ouvrez la console web OpenShift et naviguez vers **Workloads > Deployments**. Vous devriez voir votre déploiement :

![Workloads Section](/img/screenshots/admin_deployments_list.png)

Cliquez sur `my-deployment` pour voir les détails :

![My Deployment](/img/screenshots/admin_pod_details.png)

:::tip
La console web est un excellent outil pour **visualiser** l'état de vos ressources. Elle offre une vue graphique du nombre de pods, de leur état, et permet de voir les événements en temps réel.
:::

---

## Étape 5 : Mettre à jour l'application (Rolling Update)

**Pourquoi cette étape ?** En production, vous devrez régulièrement mettre à jour vos applications (nouvelles fonctionnalités, correctifs de sécurité). Le Rolling Update permet de faire cette mise à jour **sans interruption de service**.

### 5.1 : Comprendre le Rolling Update

![Rolling Update](./images/rolling-update-diagram.svg)

:::info Comment fonctionne le Rolling Update ?
Le Rolling Update remplace les pods **un par un** (ou selon les valeurs de `maxSurge` et `maxUnavailable`). Voici le processus :

1. Un **nouveau pod** est créé avec la nouvelle image.
2. OpenShift attend que le nouveau pod soit **prêt** (status Running).
3. Un **ancien pod** est alors supprimé.
4. Le processus se répète jusqu'à ce que **tous les pods** utilisent la nouvelle image.

Grâce à ce mécanisme, au moins 2 pods (sur 3) sont toujours disponibles pendant la mise à jour. Vos utilisateurs ne subissent **aucune interruption**.
:::

### 5.2 : Préparer l'observation

Avant de lancer la mise à jour, ouvrez la console web OpenShift dans **Workloads > Deployments > my-deployment** pour observer le Rolling Update en temps réel.

:::tip Astuce
Ouvrez un **second terminal** et lancez la commande suivante pour observer les pods en direct pendant la mise à jour :

```bash
oc get pods -w
```

Le flag `-w` (watch) affiche les changements en temps réel. Appuyez sur `Ctrl+C` pour arrêter l'observation.
:::

### 5.3 : Lancer la mise à jour

Nous allons changer la version de l'image pour simuler une mise à jour :

```bash
oc set image deployment/my-deployment my-container=registry.access.redhat.com/ubi9/httpd-24:1-325
```

**Sortie attendue :**

```
deployment.apps/my-deployment image updated
```

:::warning Attention
Ici, nous utilisons volontairement le tag d'image `1-325` qui est une version différente. En production, vérifiez toujours que l'image cible **existe** avant de lancer une mise à jour.
:::

### 5.4 : Observer le Rolling Update

```bash
oc rollout status deployment/my-deployment
```

**Sortie attendue :**

```
Waiting for deployment "my-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "my-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "my-deployment" rollout to finish: 2 of 3 updated replicas are available...
deployment "my-deployment" successfully rolled out
```

### Vérification

Vérifiez que les pods utilisent bien la nouvelle image :

```bash
oc get deployment my-deployment -o jsonpath='{.spec.template.spec.containers[0].image}'
```

**Sortie attendue :**

```
registry.access.redhat.com/ubi9/httpd-24:1-325
```

Vérifiez que tous les pods sont en cours d'exécution :

```bash
oc get pods
```

**Sortie attendue :**

```
NAME                             READY   STATUS    RESTARTS   AGE
my-deployment-7b9f4c8d2e-jkl78   1/1     Running   0          45s
my-deployment-7b9f4c8d2e-mno90   1/1     Running   0          38s
my-deployment-7b9f4c8d2e-pqr12   1/1     Running   0          30s
```

:::note
Remarquez que les noms des pods ont changé. Les anciens pods ont été supprimés et de nouveaux pods ont été créés avec la nouvelle image. Le suffixe aléatoire (`7b9f4c8d2e`) est différent de celui de l'étape précédente.
:::

---

## Étape 6 : Consulter l'historique des déploiements

**Pourquoi cette étape ?** L'historique des révisions vous permet de savoir quelles versions ont été déployées. C'est essentiel pour le **suivi des changements** et pour savoir vers quelle version revenir en cas de problème.

```bash
oc rollout history deployment/my-deployment
```

**Sortie attendue :**

```
deployment.apps/my-deployment
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

:::info Lecture de l'historique
- **Revision 1** : notre premier déploiement avec l'image `ubi9/httpd-24:1-3`
- **Revision 2** : la mise à jour avec l'image `ubi9/httpd-24:1-325`
- **CHANGE-CAUSE** est vide car nous n'avons pas annoté nos déploiements. Vous pouvez ajouter une cause avec :

```bash
oc annotate deployment/my-deployment kubernetes.io/change-cause="Mise à jour vers httpd-24:1-325"
```
:::

Pour voir les détails d'une révision spécifique :

```bash
oc rollout history deployment/my-deployment --revision=1
```

**Sortie attendue :**

```
deployment.apps/my-deployment with revision #1
Pod Template:
  Labels:       app=my-app
                pod-template-hash=5d8f6b7c4a
  Containers:
   my-container:
    Image:      registry.access.redhat.com/ubi9/httpd-24:1-3
    Port:       8080/TCP
    Limits:
      cpu:     500m
      memory:  128Mi
    Requests:
      cpu:     100m
      memory:  64Mi
```

### Vérification

Confirmez que vous avez bien 2 révisions dans l'historique. La révision 1 doit contenir l'image `:1-3` et la révision 2 l'image `:1-325`.

---

## Étape 7 : Effectuer un rollback

**Pourquoi cette étape ?** En production, si une mise à jour introduit un bug ou un comportement inattendu, vous devez pouvoir **revenir rapidement** à la version précédente. C'est le principe du rollback.

:::warning Scénario
Imaginons que la version `1-325` de notre application pose un problème (erreurs, lenteur, crash...). Nous devons revenir à la version `1-3` qui fonctionnait correctement.
:::

### 7.1 : Lancer le rollback

```bash
oc rollout undo deployment/my-deployment
```

**Sortie attendue :**

```
deployment.apps/my-deployment rolled back
```

:::info Que fait cette commande ?
La commande `oc rollout undo` recrée les pods avec la **configuration de la révision précédente**. Elle utilise exactement le même mécanisme de Rolling Update pour revenir en arrière, garantissant une transition sans interruption.

Vous pouvez aussi revenir à une révision spécifique avec :
```bash
oc rollout undo deployment/my-deployment --to-revision=1
```
:::

### 7.2 : Observer le rollback dans la console

Ouvrez la console web et observez le rollback en temps réel :

![Rollback](/img/screenshots/admin_events.png)

### Vérification

#### Vérifier le statut du déploiement

```bash
oc rollout status deployment/my-deployment
```

**Sortie attendue :**

```
deployment "my-deployment" successfully rolled out
```

#### Vérifier que les pods sont en cours d'exécution

```bash
oc get pods
```

**Sortie attendue :**

```
NAME                             READY   STATUS    RESTARTS   AGE
my-deployment-5d8f6b7c4a-stu34   1/1     Running   0          20s
my-deployment-5d8f6b7c4a-vwx56   1/1     Running   0          15s
my-deployment-5d8f6b7c4a-yza78   1/1     Running   0          10s
```

#### Vérifier l'image utilisée

```bash
oc get deployment my-deployment -o jsonpath='{.spec.template.spec.containers[0].image}'
```

**Sortie attendue :**

```
registry.access.redhat.com/ubi9/httpd-24:1-3
```

:::tip Succès !
L'image est bien revenue à `registry.access.redhat.com/ubi9/httpd-24:1-3`. Le rollback a fonctionné correctement.
:::

#### Vérifier l'historique après le rollback

```bash
oc rollout history deployment/my-deployment
```

**Sortie attendue :**

```
deployment.apps/my-deployment
REVISION  CHANGE-CAUSE
2         <none>
3         <none>
```

:::note
Remarquez que le rollback a créé une **nouvelle révision** (3) au lieu de revenir à la révision 1. La révision 1 a disparu car son contenu est maintenant identique à la révision 3. OpenShift ne garde pas de doublons dans l'historique.
:::

---

## Étape 8 : Nettoyage

**Pourquoi cette étape ?** Il est important de supprimer les ressources que vous n'utilisez plus pour libérer les ressources du cluster et garder votre projet propre.

```bash
oc delete -f my-deployment.yaml
```

**Sortie attendue :**

```
deployment.apps "my-deployment" deleted
```

### Vérification

Vérifiez que le déploiement et les pods ont bien été supprimés :

```bash
oc get deployments
```

**Sortie attendue :**

```
No resources found in votre-projet namespace.
```

```bash
oc get pods
```

**Sortie attendue :**

```
No resources found in votre-projet namespace.
```

:::tip
Lorsque vous supprimez un Deployment, tous les **ReplicaSets** et **pods** associés sont automatiquement supprimés. C'est le principe de la suppression en cascade dans Kubernetes.
:::

---

## Récapitulatif

Voici un résumé visuel de toutes les commandes et concepts vus dans cet exercice :

| Étape | Commande | Description |
|---|---|---|
| Créer un déploiement | `oc apply -f my-deployment.yaml` | Crée le Deployment avec 3 réplicas |
| Vérifier le déploiement | `oc get deployments` | Affiche l'état des déploiements |
| Lister les pods | `oc get pods` | Affiche les pods en cours d'exécution |
| Détails du déploiement | `oc describe deployment my-deployment` | Affiche les détails complets |
| Mettre à jour l'image | `oc set image deployment/my-deployment my-container=<image>` | Lance un Rolling Update |
| Suivre la mise à jour | `oc rollout status deployment/my-deployment` | Affiche la progression du rollout |
| Voir l'historique | `oc rollout history deployment/my-deployment` | Liste les révisions |
| Rollback | `oc rollout undo deployment/my-deployment` | Revient à la version précédente |
| Supprimer | `oc delete -f my-deployment.yaml` | Supprime le déploiement |

### Concepts clés

| Concept | Explication |
|---|---|
| **Deployment** | Objet qui gère le cycle de vie des pods et garantit le nombre souhaité de réplicas |
| **ReplicaSet** | Créé automatiquement par le Deployment, il maintient le nombre de pods souhaité |
| **Rolling Update** | Stratégie de mise à jour qui remplace les pods progressivement, sans interruption |
| **maxSurge** | Nombre maximum de pods supplémentaires créés pendant la mise à jour |
| **maxUnavailable** | Nombre maximum de pods indisponibles pendant la mise à jour |
| **Rollback** | Retour à une version précédente du déploiement |
| **Requests** | Minimum de ressources (CPU/mémoire) garanti pour un pod |
| **Limits** | Maximum de ressources (CPU/mémoire) autorisé pour un pod |
