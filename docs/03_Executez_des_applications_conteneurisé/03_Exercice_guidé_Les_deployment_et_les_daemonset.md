---
slug: /Executez_des_applications_conteneurisé/Exercice_guidé_Les_deployment_et_les_daemonset
---
# Exercice Guidé : Les Déploiements et Rolling Updates dans OpenShift

## Ce que vous allez apprendre

Dans cet exercice, vous allez apprendre pas à pas comment **déployer une application web moderne** sur OpenShift, la **mettre à jour sans interruption de service** grâce à la stratégie Rolling Update, puis **revenir en arrière** (rollback) en cas de problème. 

Nous allons utiliser une application de démo visuelle qui affiche une **matrice de carrés de couleur**. Cela vous permettra de voir en temps réel comment OpenShift remplace progressivement les pods de l'ancienne version (carrés bleus) par la nouvelle version (carrés verts).

:::info Prérequis
Avant de commencer, assurez-vous que :
- Vous êtes connecté à votre cluster OpenShift avec `oc login`
- Vous avez un projet actif (votre namespace de travail)
- Vous avez accès à la console web OpenShift
:::

:::tip Terminal web OpenShift
Toutes les commandes `oc` de cet exercice sont à exécuter dans le **terminal web OpenShift**. Cliquez sur l'icône de terminal en haut à droite de la console pour l'ouvrir.

![Icône du terminal web](/img/screenshots/web_terminal_icon.png)
:::

---

## Objectifs

A la fin de cet exercice, vous serez capable de :

- [ ] Comprendre ce qu'est un **Deployment** et son rôle dans la gestion du cycle de vie des applications
- [ ] Créer un déploiement avec **2 réplicas** et des limites de ressources
- [ ] Exposer l'application via un **Service** et une **Route HTTPS (Edge)**
- [ ] Observer visuellement un **Rolling Update** en direct via l'interface de l'application
- [ ] Consulter l'**historique des révisions** et effectuer un **rollback**
- [ ] Vérifier l'état de vos ressources à chaque étape

---

## Étape 1 : Comprendre ce que nous allons déployer

:::note Pourquoi un Deployment ?
Un **Deployment** est un objet Kubernetes/OpenShift qui garantit que le nombre souhaité de copies de votre application (réplicas) est toujours en cours d'exécution. Si un pod tombe en panne, il est instantanément recréé. C'est la base de la haute disponibilité.
:::

### L'application Rollouts Demo
Pour cet exercice, nous utilisons une application interactive conçue pour visualiser les déploiements. Voici comment elle fonctionne :
*   **Les carrés de couleur** : Chaque petit carré qui clignote représente une **requête HTTP** traitée avec succès (Code 200 OK) par l'un de vos pods.
*   **La couleur** : Elle indique quelle version de l'application a répondu. Au début, tous les carrés seront **bleus**. Lors de la mise à jour, vous verrez les carrés **verts** apparaître.
*   **Les carrés rouges** : Si un carré devient **rouge**, cela signifie qu'une requête a échoué (erreur 500) ou que l'application n'est pas joignable. C'est ce que nous voulons éviter grâce au Rolling Update !

Nous allons utiliser l'application de démo **Rollouts Demo** (version Go/React moderne). Voici ses caractéristiques :

| Paramètre | Valeur | Explication |
|---|---|---|
| **Nom** | `my-deployment` | Le nom global de l'application |
| **Réplicas** | `2` | Nombre de copies pour la haute disponibilité |
| **Image (V1)** | `docker.io/argoproj/rollouts-demo:blue` | Affiche des carrés **bleus** |
| **Image (V2)** | `docker.io/argoproj/rollouts-demo:green` | Affiche des carrés **verts** |
| **Port** | `8080` | Port d'écoute de l'application |
| **CPU request** | `5m` | Minimum CPU garanti |
| **CPU limit** | `50m` | Maximum CPU autorisé |
| **Mémoire request** | `16Mi` | Minimum mémoire garanti |
| **Mémoire limit** | `64Mi` | Maximum mémoire autorisé |

:::warning Attention aux Quotas
Dans un environnement de formation avec des ressources limitées (comme un cluster SNO), il est possible que votre projet ait un **ResourceQuota**. Si le quota est plein, OpenShift ne pourra pas créer de pods supplémentaires pendant la mise à jour. C'est pourquoi nous allons configurer une stratégie qui ne demande pas de ressources additionnelles.
:::

---

## Étape 2 : Créer le fichier de déploiement

**Pourquoi cette étape ?** Nous définissons l'infrastructure sous forme de code (YAML) pour automatiser le déploiement du Deployment, du Service et de la Route HTTPS.

Créez un fichier nommé `my-app.yaml` :

```bash
vi my-app.yaml
```

Contenu du fichier :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
  namespace: <CITY>-user-ns
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
      maxSurge: 0
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-container
        image: docker.io/argoproj/rollouts-demo:blue
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "16Mi"
            cpu: "5m"
          limits:
            memory: "64Mi"
            cpu: "50m"
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-svc
  namespace: <CITY>-user-ns
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
  namespace: <CITY>-user-ns
spec:
  to:
    kind: Service
    name: my-app-svc
  tls:
    termination: edge
```

---

## Étape 3 : Appliquer le déploiement et accéder à la démo

Appliquez le fichier YAML :

```bash
oc apply -f my-app.yaml
```

### 3.1 : Accéder à l'application
Récupérez l'URL HTTPS générée par la Route :

```bash
oc get route my-app-route
```

Copiez l'URL (HOST/PORT) et ouvrez-la dans votre navigateur (utilisez `https://`).

Vous devriez voir une interface moderne affichant une matrice de petits carrés **bleus** qui clignotent. 

![Aperçu de l'application Rollouts Demo (Bleu)](/img/screenshots/rollouts_demo_blue.png)

:::info Que visualisez-vous ?
Chaque carré clignotant est une requête envoyée par votre navigateur au Service, qui la transmet à l'un de vos deux pods. Comme les deux pods utilisent actuellement l'image `blue`, tous les carrés sont bleus. C'est la preuve que votre **Load Balancer** (le Service OpenShift) répartit bien le trafic entre vos pods.
:::

---

## Étape 4 : Mettre à jour l'application (Rolling Update Visuel)

**Pourquoi cette étape ?** C'est ici que vous voyez la puissance d'OpenShift. Nous allons mettre à jour l'application vers la version "green" sans couper le service.

### 4.1 : Lancer la mise à jour
Dans votre terminal, lancez la commande suivante :

```bash
oc set image deployment/my-deployment my-container=docker.io/argoproj/rollouts-demo:green
```

### 4.2 : Observer le résultat (En direct !)
Retournez immédiatement sur votre navigateur. Vous allez voir les carrés **bleus** être remplacés progressivement par des carrés **verts**.

![Rolling Update en cours (mélange Bleu/Vert)](/img/screenshots/rollouts_demo_rolling.png)

![Rolling Update terminé (uniquement Vert)](/img/screenshots/rollouts_demo_green.png)

*   C'est le **Rolling Update** : OpenShift crée les nouveaux pods "verts" et s'assure qu'ils sont prêts avant de supprimer les anciens pods "bleus".
*   Grâce au paramètre `maxUnavailable: 1`, vous ne devriez voir aucune interruption puisque l'un des deux pods reste actif pendant que l'autre est mis à jour.

Vérifiez le statut via la CLI :

```bash
oc rollout status deployment/my-deployment
```

---

## Étape 5 : Consulter l'historique et faire un Rollback

En cas de problème sur la version "green", vous pouvez revenir en arrière instantanément.

### 5.1 : Liste des révisions

```bash
oc rollout history deployment/my-deployment
```

### 5.2 : Effectuer le rollback
Revenons à la version bleue :

```bash
oc rollout undo deployment/my-deployment
```

Observez à nouveau votre navigateur : les carrés redeviennent **bleus** progressivement.

---

## Étape 6 : Nettoyage

```bash
oc delete -f my-app.yaml
```

---

## Récapitulatif

| Action | Commande | Visualisation attendue |
|---|---|---|
| Déploiement initial | `oc apply -f my-app.yaml` | Matrice de carrés **bleus** |
| Mise à jour | `oc set image ...=...:green` | Transition progressive **Bleu -> Vert** |
| Rollback | `oc rollout undo ...` | Transition de retour **Vert -> Bleu** |

:::info Pourquoi maxSurge: 0 ?
Par défaut, Kubernetes utilise `maxSurge: 25%`, ce qui signifie qu'il crée de nouveaux pods **avant** de supprimer les anciens. Si votre quota de ressources est plein, cela échouera. Avec **`maxSurge: 0`** et **`maxUnavailable: 1`**, OpenShift va :
1. Arrêter un ancien pod (libérant ainsi de la place dans le quota).
2. Créer un nouveau pod.
3. Répéter l'opération pour le second pod.
Cela permet de mettre à jour l'application même quand les ressources sont au maximum !
:::

*   **Zero Downtime** : Bien qu'un pod soit temporairement arrêté, le second pod continue de répondre aux requêtes, garantissant la continuité de service.
*   **Visibilité** : Le changement de couleur par pod/requête permet de comprendre immédiatement le concept de répartition de charge (Load Balancing) et de mise à jour progressive.
*   **Sécurité** : La route utilise une terminaison **TLS Edge**, standard de l'industrie pour sécuriser l'accès aux microservices.
