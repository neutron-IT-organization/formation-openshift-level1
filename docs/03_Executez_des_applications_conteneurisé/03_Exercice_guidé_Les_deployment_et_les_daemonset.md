# Exercice Guidé : Les Déploiements et Rolling Updates dans OpenShift

## Ce que vous allez apprendre

Dans cet exercice, vous allez apprendre pas à pas comment **déployer une application web moderne** sur OpenShift, la **mettre à jour sans interruption de service** grâce à la stratégie Rolling Update, puis **revenir en arrière** (rollback) en cas de problème. 

:::info Prérequis
Avant de commencer, assurez-vous que :
- Vous êtes connecté à votre cluster OpenShift avec `oc login`
- Vous avez un projet actif (vérifiez avec `oc project`)
- Vous avez accès à la console web OpenShift
:::

:::tip Terminal web OpenShift
Toutes les commandes `oc` de cet exercice sont à exécuter dans le **terminal web OpenShift**. Cliquez sur l'icône de terminal en haut à droite de la console pour l'ouvrir.

![Icône du terminal web](/img/screenshots/web_terminal_icon.png)
:::

---

## Objectifs

A la fin de cet exercice, vous serez capable de :

- [ ] Comprendre ce qu'est un **Deployment** et pourquoi il est essentiel dans Kubernetes/OpenShift
- [ ] Créer un déploiement avec **2 réplicas** et des **limites de ressources**
- [ ] Exposer l'application via un **Service** et une **Route HTTPS (Edge)**
- [ ] Observer le comportement d'un **Rolling Update** lors d'une mise à jour d'image
- [ ] Consulter l'**historique des révisions** d'un déploiement
- [ ] Effectuer un **rollback** pour revenir à une version précédente
- [ ] Vérifier l'état de vos ressources à chaque étape

---

## Étape 1 : Comprendre ce que nous allons déployer

:::note Pourquoi un Deployment ?
Un **Deployment** est un objet Kubernetes qui gère le cycle de vie de vos pods. Il garantit que le nombre souhaité de réplicas est toujours en cours d'exécution. Si un pod tombe en panne, le Deployment en crée automatiquement un nouveau. C'est la manière standard de déployer des applications **sans état** (stateless) sur OpenShift.
:::

Nous allons déployer une application simple basée sur Nginx et UBI 9. Voici les caractéristiques de notre déploiement :

| Paramètre | Valeur | Explication |
|---|---|---|
| **Nom** | `my-deployment` | Le nom de notre déploiement |
| **Réplicas** | `2` | 2 copies du pod pour la haute disponibilité |
| **Image** | `registry.access.redhat.com/ubi9/nginx-122:latest` | Serveur web Nginx moderne sur UBI 9 |
| **Port** | `8080` | Port d'écoute par défaut (non-root) |
| **CPU request** | `10m` | Le minimum de CPU garanti |
| **CPU limit** | `100m` | Le maximum de CPU autorisé |
| **Mémoire request** | `32Mi` | Le minimum de mémoire garanti |
| **Mémoire limit** | `128Mi` | Le maximum de mémoire autorisé |

:::tip Requests vs Limits
- **Request** = le minimum garanti. Kubernetes réserve cette quantité de ressources pour votre pod.
- **Limit** = le maximum autorisé. Si le pod dépasse cette limite, il peut être redémarré (OOMKilled pour la mémoire) ou bridé (throttled pour le CPU).

Toujours définir des requests et limits est une **bonne pratique** pour éviter qu'un pod ne consomme toutes les ressources du cluster.
:::

---

## Étape 2 : Créer le fichier de déploiement

**Pourquoi cette étape ?** Nous allons créer un fichier YAML qui décrit l'ensemble des ressources nécessaires : le Deployment, le Service et la Route. Ce fichier est la "source de vérité" de notre application.

Créez un fichier nommé `my-app.yaml` avec le contenu suivant :

```bash
vi my-app.yaml
```

:::tip Préférez nano ?
Si vous n'êtes pas à l'aise avec `vi`, utilisez `nano` à la place :
```bash
nano my-app.yaml
```
:::

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
  labels:
    app: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-container
        image: registry.access.redhat.com/ubi9/nginx-122:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "32Mi"
            cpu: "10m"
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: my-app-route
spec:
  to:
    kind: Service
    name: my-app-svc
  tls:
    termination: edge
```

:::info Décryptage du YAML
Voici les sections clés à comprendre :

- **`replicas: 2`** : nous voulons 2 pods identiques en permanence.
- **`ports.containerPort: 8080`** : Nginx sur UBI écoute sur le port 8080 pour pouvoir s'exécuter sans droits root.
- **`Service`** : expose l'application sur un port stable à l'intérieur du cluster.
- **`Route`** : permet l'accès depuis l'extérieur. L'option **`tls.termination: edge`** configure HTTPS avec le certificat géré par le routeur OpenShift.
- **`strategy.type: RollingUpdate`** : lors d'une mise à jour, les pods sont remplacés progressivement.
- **`maxSurge: 1`** : pendant la mise à jour, au maximum 1 pod supplémentaire peut être créé.
- **`maxUnavailable: 0`** : ici, nous forçons à ce qu'aucun pod ne soit indisponible pour garantir 100% de disponibilité.
:::

---

## Étape 3 : Appliquer le déploiement

**Pourquoi cette étape ?** Nous allons envoyer notre fichier YAML à OpenShift pour créer les trois ressources.

```bash
oc apply -f my-app.yaml
```

**Sortie attendue :**

```
deployment.apps/my-deployment created
service/my-app-svc created
route.route.openshift.io/my-app-route created
```

:::tip Bonne pratique
Utilisez toujours `oc apply -f` plutôt que `oc create -f`. La commande `apply` est **idempotente** : elle crée la ressource si elle n'existe pas, ou la met à jour si elle existe déjà.
:::

---

## Étape 4 : Vérifier le déploiement

**Pourquoi cette étape ?** Après avoir créé un déploiement, il est essentiel de vérifier que tout s'est bien passé.

### 4.1 : Vérifier l'état du Deployment

```bash
oc get deployments
```

**Sortie attendue :**

```
NAME            READY   UP-TO-DATE   AVAILABLE   AGE
my-deployment   2/2     2            2           30s
```

### 4.2 : Vérifier les pods

```bash
oc get pods
```

**Sortie attendue :**

```
NAME                             READY   STATUS    RESTARTS   AGE
my-deployment-5d8f6b7c4a-abc12   1/1     Running   0          30s
my-deployment-5d8f6b7c4a-def34   1/1     Running   0          30s
```

### 4.3 : Vérifier la Route

Récupérez l'URL de votre application :

```bash
oc get route my-app-route
```

Testez l'accès en HTTPS :

```bash
curl -I -k https://$(oc get route my-app-route -o jsonpath='{.spec.host}')
```

**Sortie attendue :**
```
HTTP/1.1 200 OK
...
```

---

## Étape 5 : Mettre à jour l'application (Rolling Update)

**Pourquoi cette étape ?** Le Rolling Update permet de mettre à jour l'image sans interruption de service.

### 5.1 : Lancer la mise à jour

Nous allons passer à Nginx 1.24 :

```bash
oc set image deployment/my-deployment my-container=registry.access.redhat.com/ubi9/nginx-124:latest
```

### 5.2 : Suivre le déploiement

```bash
oc rollout status deployment/my-deployment
```

**Sortie attendue :**
```
deployment "my-deployment" successfully rolled out
```

### 5.3 : Vérifier l'image

```bash
oc get deployment my-deployment -o jsonpath='{.spec.template.spec.containers[0].image}'
```

**Sortie attendue :**
```
registry.access.redhat.com/ubi9/nginx-124:latest
```

---

## Étape 6 : Consulter l'historique

```bash
oc rollout history deployment/my-deployment
```

**Sortie attendue :**
```
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

---

## Étape 7 : Effectuer un rollback

:::warning Scénario
Imaginons que la version `nginx-124:latest` pose un problème. Nous revenons à la version `nginx-122:latest`.
:::

```bash
oc rollout undo deployment/my-deployment
```

### Vérifier le succès du rollback

```bash
oc get deployment my-deployment -o jsonpath='{.spec.template.spec.containers[0].image}'
```

**Sortie attendue :**
```
registry.access.redhat.com/ubi9/nginx-122:latest
```

---

## Étape 8 : Nettoyage

```bash
oc delete -f my-app.yaml
```

---

## Récapitulatif

| Étape | Commande | Description |
|---|---|---|
| Créer les ressources | `oc apply -f my-app.yaml` | Crée le Deployment, Service et Route |
| Vérifier le déploiement | `oc get deployments` | Affiche l'état des déploiements |
| Lister les pods | `oc get pods` | Affiche les pods en cours d'exécution |
| Accéder à la route | `oc get route my-app-route` | Récupère l'URL HTTPS externe |
| Mettre à jour l'image | `oc set image deployment/my-deployment my-container=<image>` | Lance un Rolling Update |
| Suivre la mise à jour | `oc rollout status deployment/my-deployment` | Affiche la progression du rollout |
| Voir l'historique | `oc rollout history deployment/my-deployment` | Liste les révisions |
| Rollback | `oc rollout undo deployment/my-deployment` | Revient à la version précédente |
| Supprimer | `oc delete -f my-app.yaml` | Supprime toutes les ressources |

### Concepts clés

| Concept | Explication |
|---|---|
| **Deployment** | Objet qui gère le cycle de vie des pods |
| **Service** | Expose les pods à l'intérieur du cluster |
| **Route** | Génère une URL publique via le router OpenShift |
| **Rolling Update** | Mise à jour progressive sans interruption |
| **Rollback** | Retour à une version précédente |
| **Requests / Limits** | Gestion des ressources CPU et Mémoire |
