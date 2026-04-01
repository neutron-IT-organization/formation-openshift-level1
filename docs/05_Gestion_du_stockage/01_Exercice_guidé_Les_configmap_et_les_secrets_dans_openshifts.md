# Exercice Guidé : Les ConfigMaps et les Secrets dans OpenShift

## Ce que vous allez apprendre

Dans cet exercice, vous allez découvrir comment **séparer la configuration de votre application du code source**. C'est une bonne pratique fondamentale dans le monde des conteneurs : plutôt que de coder en dur vos paramètres (messages, modes, mots de passe...), vous les stockez dans des objets Kubernetes dédiés. Vous apprendrez à utiliser deux objets essentiels : les **ConfigMaps** (pour la configuration classique) et les **Secrets** (pour les données sensibles), puis à les injecter dans une application.

![ConfigMap et Secret](./images/configmap-secret-injection.svg)

## Objectifs

A la fin de cet exercice, vous serez capable de :

- [ ] Comprendre la différence entre un **ConfigMap** et un **Secret**
- [ ] Créer un **ConfigMap** pour stocker des données de configuration non sensibles
- [ ] Créer un **Secret** pour stocker des données sensibles (tokens, mots de passe)
- [ ] Injecter un ConfigMap et un Secret dans un pod via des **variables d'environnement**
- [ ] Mettre à jour un ConfigMap et **observer l'impact** sur l'application
- [ ] Comprendre pourquoi un **redémarrage des pods** est nécessaire après une mise à jour

---

:::tip Terminal web OpenShift
Toutes les commandes `oc` de cet exercice sont à exécuter dans le **terminal web OpenShift**. Cliquez sur l'icône de terminal en haut à droite de la console pour l'ouvrir.

![Icône du terminal web](/img/screenshots/web_terminal_icon.png)
:::

## Prérequis

Une application **welcome-app** est déjà déployée dans votre namespace. Cette application affiche un message de bienvenue que l'on peut configurer via des variables d'environnement.

:::info Qu'est-ce que welcome-app ?
`welcome-app` est une application web simple (image : `quay.io/neutron-it/welcome-app:latest`) qui écoute sur le port **8080**. Elle lit des variables d'environnement pour personnaliser son comportement. C'est l'application idéale pour apprendre à manipuler la configuration externe.
:::

Vérifiez que l'application est bien en cours d'exécution :

```bash
oc get deployment welcome-app
```

**Sortie attendue :**

```
NAME          READY   UP-TO-DATE   AVAILABLE   AGE
welcome-app   2/2     2            2           5m
```

:::warning Si la colonne READY n'affiche pas 2/2
Attendez quelques instants et relancez la commande. Si le problème persiste, demandez de l'aide au formateur.
:::

---

## Etape 1 : Créer un ConfigMap

### Pourquoi cette étape ?

Un **ConfigMap** est un objet Kubernetes qui permet de stocker des paires **clé/valeur** de configuration. L'idée est simple : plutôt que d'écrire vos paramètres directement dans le code de votre application, vous les externalisez dans un ConfigMap. Cela permet de **modifier la configuration sans reconstruire l'image** de votre conteneur.

:::tip Analogie
Pensez à un ConfigMap comme un **fichier de configuration** (type `.env` ou `.properties`) que Kubernetes gère pour vous et peut injecter automatiquement dans vos conteneurs.
:::

### Création du fichier YAML

Créez un fichier nommé `welcome-config.yaml` avec le contenu suivant :

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: welcome-config
data:
  welcome_message: "Bienvenue sur notre site de démonstration !"
  app_mode: "production"
```

:::info Comprendre le fichier
- **`apiVersion: v1`** : les ConfigMaps font partie de l'API de base de Kubernetes.
- **`kind: ConfigMap`** : le type d'objet que l'on crée.
- **`metadata.name`** : le nom de notre ConfigMap. On l'utilisera plus tard pour le référencer.
- **`data`** : la section qui contient les paires clé/valeur. Ici, on définit deux clés : `welcome_message` et `app_mode`.
:::

### Appliquer le ConfigMap

#### Méthode 1 : Via la console web (bouton +)

Cliquez sur le bouton **+** en haut à droite de la console, collez le contenu du fichier `welcome-config.yaml` et cliquez sur **Create**.

![Bouton + pour importer du YAML dans la console OpenShift](/img/screenshots/console-add-button.png)

#### Méthode 2 : Via le terminal

```bash
oc apply -f welcome-config.yaml
```

**Sortie attendue :**

```
configmap/welcome-config created
```

### Vérifier la création

Affichez le contenu du ConfigMap pour confirmer que les données sont correctes :

```bash
oc get configmap welcome-config -o yaml
```

**Sortie attendue :**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: welcome-config
  namespace: votre-namespace
data:
  app_mode: production
  welcome_message: Bienvenue sur notre site de démonstration !
```

Vous pouvez aussi utiliser la commande `describe` pour un affichage plus lisible :

```bash
oc describe configmap welcome-config
```

**Sortie attendue :**

```
Name:         welcome-config
Namespace:    votre-namespace
Labels:       <none>
Annotations:  <none>

Data
====
app_mode:
----
production
welcome_message:
----
Bienvenue sur notre site de démonstration !
```

### Vérification

:::tip Checklist de vérification
- [ ] La commande `oc get configmap welcome-config` ne retourne pas d'erreur
- [ ] Les deux clés `welcome_message` et `app_mode` apparaissent dans la sortie
- [ ] Les valeurs correspondent à ce que vous avez mis dans le fichier YAML
:::

---

## Etape 2 : Créer un Secret

### Pourquoi cette étape ?

Un **Secret** fonctionne comme un ConfigMap, mais il est conçu pour stocker des **données sensibles** : mots de passe, tokens d'API, certificats, etc. La principale différence est que les valeurs sont **encodées en base64** dans le fichier YAML et que Kubernetes les traite avec des précautions supplémentaires (accès restreint, non affichées dans les logs...).

:::warning Encodage base64 ne veut pas dire chiffrement !
L'encodage base64 n'est **pas un mécanisme de sécurité**. C'est simplement un format de représentation. N'importe qui peut décoder une valeur base64. La sécurité des Secrets repose sur les **contrôles d'accès (RBAC)** d'OpenShift, pas sur l'encodage.
:::

### Encoder une valeur en base64

Avant de créer le Secret, il faut encoder nos valeurs. Encodons le token `welcomeToken123` :

```bash
echo -n "welcomeToken123" | base64
```

**Sortie attendue :**

```
d2VsY29tZVRva2VuMTIz
```

:::note Pourquoi l'option -n ?
L'option `-n` de la commande `echo` évite d'ajouter un retour à la ligne (`\n`) à la fin de la chaîne. Sans cette option, le retour à la ligne serait encodé avec la valeur, ce qui causerait des erreurs difficiles à diagnostiquer.
:::

### Création du fichier YAML

Créez un fichier nommé `welcome-secret.yaml` :

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: welcome-secret
type: Opaque
data:
  api_token: d2VsY29tZVRva2VuMTIz
```

:::info Comprendre le fichier
- **`type: Opaque`** : c'est le type par défaut pour un Secret générique. Il existe d'autres types (`kubernetes.io/dockerconfigjson` pour les registres d'images, `kubernetes.io/tls` pour les certificats, etc.).
- **`data`** : les valeurs doivent être encodées en base64. Si vous préférez écrire les valeurs en clair, vous pouvez utiliser `stringData` à la place de `data` et Kubernetes se chargera de l'encodage.
:::

### Appliquer le Secret

#### Méthode 1 : Via la console web (bouton +)

Cliquez sur le bouton **+** en haut à droite de la console, collez le contenu du fichier `welcome-secret.yaml` et cliquez sur **Create**.

![Bouton + pour importer du YAML dans la console OpenShift](/img/screenshots/console-add-button.png)

#### Méthode 2 : Via le terminal

```bash
oc apply -f welcome-secret.yaml
```

**Sortie attendue :**

```
secret/welcome-secret created
```

### Vérifier la création

```bash
oc get secret welcome-secret -o yaml
```

**Sortie attendue :**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: welcome-secret
  namespace: votre-namespace
type: Opaque
data:
  api_token: d2VsY29tZVRva2VuMTIz
```

Pour décoder et vérifier la valeur stockée :

```bash
oc get secret welcome-secret -o jsonpath='{.data.api_token}' | base64 -d
```

**Sortie attendue :**

```
welcomeToken123
```

### Vérification

:::tip Checklist de vérification
- [ ] La commande `oc get secret welcome-secret` ne retourne pas d'erreur
- [ ] La clé `api_token` est présente dans le Secret
- [ ] Le décodage base64 retourne bien `welcomeToken123`
:::

---

## Etape 3 : Injecter le ConfigMap et le Secret dans l'application

### Pourquoi cette étape ?

Nous avons créé nos objets de configuration, mais pour l'instant **l'application ne les utilise pas**. Il faut dire à OpenShift d'injecter les valeurs du ConfigMap et du Secret dans les conteneurs sous forme de **variables d'environnement**. Ainsi, l'application pourra lire ces valeurs comme n'importe quelle variable d'environnement classique.

:::info Deux méthodes d'injection
Kubernetes propose deux façons d'injecter des ConfigMaps et des Secrets :
1. **Variables d'environnement** (ce que nous faisons ici) : chaque clé devient une variable d'environnement dans le conteneur.
2. **Montage en volume** : les clés deviennent des fichiers dans un répertoire du conteneur.

Dans cet exercice, nous utilisons la méthode par variables d'environnement car elle est la plus simple pour débuter.
:::

### Modifier le Deployment

Créez un fichier `welcome-app-updated.yaml` avec le contenu suivant. Les parties importantes sont les blocs `env` qui référencent notre ConfigMap et notre Secret :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: welcome-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: welcome-app
  template:
    metadata:
      labels:
        app: welcome-app
    spec:
      containers:
        - name: welcome-app-container
          image: quay.io/neutron-it/welcome-app:latest
          ports:
            - containerPort: 8080
          env:
            - name: WELCOME_MESSAGE
              valueFrom:
                configMapKeyRef:
                  name: welcome-config
                  key: welcome_message
            - name: APP_MODE
              valueFrom:
                configMapKeyRef:
                  name: welcome-config
                  key: app_mode
            - name: API_TOKEN
              valueFrom:
                secretKeyRef:
                  name: welcome-secret
                  key: api_token
```

:::info Comprendre les blocs env
Chaque variable d'environnement est définie par :
- **`name`** : le nom de la variable telle que l'application la verra (ex : `WELCOME_MESSAGE`).
- **`valueFrom.configMapKeyRef`** : indique que la valeur provient d'un ConfigMap. On précise le **nom** du ConfigMap et la **clé** à lire.
- **`valueFrom.secretKeyRef`** : même principe, mais pour un Secret. Kubernetes décodera automatiquement la valeur base64 avant de l'injecter.
:::

### Appliquer la modification

#### Méthode 1 : Via la console web (bouton +)

Cliquez sur le bouton **+** en haut à droite de la console, collez le contenu du fichier `welcome-app-updated.yaml` et cliquez sur **Create**.

![Bouton + pour importer du YAML dans la console OpenShift](/img/screenshots/console-add-button.png)

#### Méthode 2 : Via le terminal

```bash
oc apply -f welcome-app-updated.yaml
```

**Sortie attendue :**

```
deployment.apps/welcome-app configured
```

:::note "configured" et non "created"
La sortie indique `configured` car le Deployment existait déjà. La commande `oc apply` a mis à jour sa définition. OpenShift va automatiquement créer de nouveaux pods avec la nouvelle configuration.
:::

### Vérifier que les pods redémarrent

Attendez que les nouveaux pods soient prêts :

```bash
oc get pods -l app=welcome-app
```

**Sortie attendue :**

```
NAME                           READY   STATUS    RESTARTS   AGE
welcome-app-6d4f7b8c9a-abc12   1/1     Running   0          30s
welcome-app-6d4f7b8c9a-def34   1/1     Running   0          28s
```

:::tip Les noms de pods changent
Notez que les noms des pods ont changé (nouveau suffixe aléatoire). C'est normal : OpenShift a créé de nouveaux pods avec la configuration mise à jour et a supprimé les anciens.
:::

### Vérifier l'injection des variables d'environnement

Connectez-vous à un pod pour vérifier que les variables sont bien présentes :

```bash
oc exec deployment/welcome-app -- env | grep -E "WELCOME|APP_MODE|API_TOKEN"
```

**Sortie attendue :**

```
WELCOME_MESSAGE=Bienvenue sur notre site de démonstration !
APP_MODE=production
API_TOKEN=welcomeToken123
```

:::info Remarques importantes
- La variable `WELCOME_MESSAGE` contient la valeur définie dans le ConfigMap.
- La variable `APP_MODE` contient `production`, aussi depuis le ConfigMap.
- La variable `API_TOKEN` contient `welcomeToken123` (et non la valeur base64). Kubernetes a **automatiquement décodé** la valeur du Secret avant de l'injecter.
:::

### Vérification

:::tip Checklist de vérification
- [ ] Tous les pods sont en statut `Running` et `READY 1/1`
- [ ] La variable `WELCOME_MESSAGE` contient le bon message
- [ ] La variable `APP_MODE` vaut `production`
- [ ] La variable `API_TOKEN` contient `welcomeToken123` (en clair, pas en base64)
:::

---

## Etape 4 : Mettre à jour le ConfigMap et observer l'impact

### Pourquoi cette étape ?

L'un des grands avantages des ConfigMaps est de pouvoir **modifier la configuration sans toucher au code ni à l'image** de l'application. Mais attention : la mise à jour n'est pas toujours automatique. C'est un piège classique que nous allons explorer.

### Modifier le ConfigMap

Modifiez le fichier `welcome-config.yaml` pour changer le message et le mode :

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: welcome-config
data:
  welcome_message: "Bienvenue à notre nouvelle application déployée avec OpenShift !"
  app_mode: "development"
```

Appliquez la modification :

#### Méthode 1 : Via la console web (bouton +)

Cliquez sur le bouton **+** en haut à droite de la console, collez le contenu modifié du fichier `welcome-config.yaml` et cliquez sur **Create**.

![Bouton + pour importer du YAML dans la console OpenShift](/img/screenshots/console-add-button.png)

#### Méthode 2 : Via le terminal

```bash
oc apply -f welcome-config.yaml
```

**Sortie attendue :**

```
configmap/welcome-config configured
```

### Vérifier que le ConfigMap a bien été modifié

```bash
oc describe configmap welcome-config
```

**Sortie attendue :**

```
Name:         welcome-config
Namespace:    votre-namespace
Labels:       <none>
Annotations:  <none>

Data
====
app_mode:
----
development
welcome_message:
----
Bienvenue à notre nouvelle application déployée avec OpenShift !
```

### Vérifier l'état de l'application AVANT le redémarrage

Regardons si l'application a détecté les changements automatiquement :

```bash
oc exec deployment/welcome-app -- env | grep WELCOME_MESSAGE
```

**Sortie attendue :**

```
WELCOME_MESSAGE=Bienvenue sur notre site de démonstration !
```

:::warning L'ancien message est toujours affiché !
Les variables d'environnement ne se mettent **pas** à jour automatiquement quand un ConfigMap change. Les valeurs sont lues **une seule fois**, au démarrage du conteneur. Pour que les nouvelles valeurs soient prises en compte, il faut **redémarrer les pods**.

C'est une différence importante avec le montage en volume, qui lui peut se mettre à jour automatiquement (avec un délai).
:::

### Redémarrer les pods

Utilisez la commande `rollout restart` pour forcer le redémarrage des pods :

```bash
oc rollout restart deployment welcome-app
```

**Sortie attendue :**

```
deployment.apps/welcome-app restarted
```

Attendez que le rollout soit terminé :

```bash
oc rollout status deployment welcome-app
```

**Sortie attendue :**

```
deployment "welcome-app" successfully rolled out
```

### Vérifier la mise à jour APRÈS le redémarrage

```bash
oc exec deployment/welcome-app -- env | grep -E "WELCOME|APP_MODE"
```

**Sortie attendue :**

```
WELCOME_MESSAGE=Bienvenue à notre nouvelle application déployée avec OpenShift !
APP_MODE=development
```

Les nouvelles valeurs sont maintenant injectées dans l'application.

### Vérification

:::tip Checklist de vérification
- [ ] Le ConfigMap contient les nouvelles valeurs (`development` et le nouveau message)
- [ ] Avant le redémarrage, les pods affichaient encore l'ancien message
- [ ] Après le `rollout restart`, les pods affichent le nouveau message
- [ ] La variable `APP_MODE` vaut maintenant `development`
:::

---

## Etape 5 : Nettoyage

### Pourquoi cette étape ?

Il est important de nettoyer les ressources après un exercice pour ne pas encombrer le cluster et éviter les conflits lors d'exercices futurs.

Supprimez les ressources créées :

```bash
oc delete configmap welcome-config
```

**Sortie attendue :**

```
configmap "welcome-config" deleted
```

```bash
oc delete secret welcome-secret
```

**Sortie attendue :**

```
secret "welcome-secret" deleted
```

```bash
oc delete deployment welcome-app
```

**Sortie attendue :**

```
deployment.apps "welcome-app" deleted
```

Vérifiez que tout a été supprimé :

```bash
oc get configmap welcome-config 2>/dev/null; oc get secret welcome-secret 2>/dev/null; oc get deployment welcome-app 2>/dev/null
```

**Sortie attendue :**

```
Error from server (NotFound): configmaps "welcome-config" not found
Error from server (NotFound): secrets "welcome-secret" not found
Error from server (NotFound): deployments.apps "welcome-app" not found
```

### Vérification

:::tip Checklist de vérification
- [ ] Le ConfigMap `welcome-config` a été supprimé
- [ ] Le Secret `welcome-secret` a été supprimé
- [ ] Le Deployment `welcome-app` a été supprimé
:::

---

## Récapitulatif

| Concept | Objet Kubernetes | Usage | Encodage | Mise à jour auto (env vars) |
|---|---|---|---|---|
| Configuration non sensible | **ConfigMap** | Messages, modes, URLs, paramètres | Texte clair | Non - redémarrage nécessaire |
| Données sensibles | **Secret** | Mots de passe, tokens, certificats | Base64 | Non - redémarrage nécessaire |

| Commande | Description |
|---|---|
| `oc apply -f fichier.yaml` | Créer ou mettre à jour une ressource |
| `oc get configmap <nom> -o yaml` | Afficher le contenu d'un ConfigMap |
| `oc get secret <nom> -o yaml` | Afficher le contenu d'un Secret |
| `oc describe configmap <nom>` | Afficher les détails d'un ConfigMap |
| `oc exec deployment/<nom> -- env` | Voir les variables d'environnement d'un pod |
| `oc rollout restart deployment <nom>` | Redémarrer les pods d'un Deployment |
| `echo -n "valeur" \| base64` | Encoder une valeur en base64 |
| `echo "valeur" \| base64 -d` | Décoder une valeur base64 |

## Conclusion

:::note Ce qu'il faut retenir
1. **ConfigMap** = configuration non sensible, **Secret** = données sensibles.
2. On injecte ces objets dans les conteneurs via des **variables d'environnement** ou des **volumes**.
3. Quand on utilise des variables d'environnement, les changements de ConfigMap/Secret ne sont **pas automatiques** : il faut redémarrer les pods.
4. Les Secrets sont encodés en base64 mais **pas chiffrés** : la sécurité repose sur le RBAC.
5. Cette approche permet de **découpler la configuration du code**, une bonne pratique essentielle dans le monde des conteneurs.
:::
