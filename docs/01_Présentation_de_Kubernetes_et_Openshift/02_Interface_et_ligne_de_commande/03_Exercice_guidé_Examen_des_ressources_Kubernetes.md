# Exercice Guidé : Examen des Ressources Kubernetes

## Ce que vous allez apprendre

Dans cet exercice, vous allez découvrir comment **examiner**, **extraire** et **réutiliser** des ressources Kubernetes avec la commande `oc`. Vous partirez d'une application existante déployée par le formateur, vous récupérerez sa définition au format YAML, puis vous la modifierez pour créer votre propre copie dans votre namespace personnel. C'est une compétence fondamentale pour tout administrateur OpenShift.

## Objectifs

A la fin de cet exercice, vous serez capable de :

- [ ] Lister des pods et personnaliser l'affichage avec `-o custom-columns`
- [ ] Comprendre la structure d'un manifeste YAML Kubernetes
- [ ] Extraire un manifeste YAML depuis une ressource existante avec `-o yaml`
- [ ] Nettoyer un manifeste YAML pour le rendre réutilisable
- [ ] Modifier un manifeste pour l'adapter a un autre namespace
- [ ] Appliquer un manifeste avec `oc apply` et vérifier le résultat
- [ ] Supprimer des ressources avec `oc delete`

---

## Comprendre la structure YAML

Avant de commencer, prenez un moment pour comprendre comment un fichier YAML Kubernetes est organisé. Chaque ressource suit toujours la meme structure :

![Structure YAML](./images/yaml-structure.svg)

:::info Les 4 sections clés d'un manifeste YAML
Tout manifeste Kubernetes contient ces sections :
1. **`apiVersion`** : la version de l'API utilisée (ex: `apps/v1`)
2. **`kind`** : le type de ressource (ex: `Deployment`, `Pod`, `Service`)
3. **`metadata`** : les informations d'identification (nom, namespace, labels)
4. **`spec`** : la configuration souhaitée de la ressource

Il existe aussi un champ `status` que Kubernetes remplit automatiquement -- vous n'avez **jamais** besoin de le fournir vous-meme.
:::

---

## Contexte de l'exercice

| Element | Valeur |
|---|---|
| Namespace partagé (lecture seule) | `shared-workloads` |
| Application de démonstration | `shared-app` |
| Votre namespace personnel | `<CITY>-user-ns` (ex: `paris-user-ns`) |
| Votre déploiement | `<CITY>-demo-app` (ex: `paris-demo-app`) |

:::warning Remplacez les valeurs
Tout au long de cet exercice, remplacez **`<CITY>`** par le nom de votre ville (en minuscules, sans accents). Par exemple, si votre ville est Prague, utilisez `paris`.
:::

---

## Étape 1 : Afficher les pods de l'application de démonstration

### Pourquoi cette étape ?

Avant de manipuler une ressource, il faut d'abord savoir **ce qui tourne sur le cluster**. La commande `oc get pods` est la premiere commande que vous utiliserez au quotidien pour vérifier l'état de vos applications.

### Instructions

Affichez les pods dans le namespace partagé `shared-workloads` :

```bash
oc get pods -n shared-workloads
```

:::tip Le flag -n (namespace)
Le flag `-n` permet de spécifier dans quel namespace chercher. Sans ce flag, `oc` cherche dans votre namespace par défaut. Pensez a toujours vérifier dans quel namespace vous travaillez !
:::

**Sortie attendue :**
```
NAME                          READY   STATUS    RESTARTS   AGE
shared-app-75bb5d5698-c7dzj   1/1     Running   0          10m
```

:::note Comprendre la sortie
- **NAME** : le nom du pod (généré automatiquement a partir du déploiement)
- **READY** : `1/1` signifie que 1 conteneur sur 1 est pret
- **STATUS** : `Running` signifie que le pod fonctionne normalement
- **RESTARTS** : le nombre de redémarrages (0 = aucun probleme)
- **AGE** : depuis combien de temps le pod existe
:::

### Affichage personnalisé avec -o custom-columns

Parfois, la sortie par défaut contient trop d'informations. Vous pouvez créer votre propre vue avec `-o custom-columns` :

```bash
oc get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase -n shared-workloads
```

**Sortie attendue :**
```
NAME                          STATUS
shared-app-75bb5d5698-c7dzj   Running
```

:::tip Syntaxe des colonnes personnalisées
La syntaxe est : `-o custom-columns=TITRE_COLONNE:.chemin.vers.le.champ`

Le chemin utilise la notation **JSONPath**, qui suit la structure du YAML. Par exemple :
- `.metadata.name` correspond au champ `name` dans la section `metadata`
- `.status.phase` correspond au champ `phase` dans la section `status`

C'est tres utile pour créer des rapports concis ou des scripts d'automatisation.
:::

### Vérification

Avant de passer a l'étape suivante, vérifiez que :
- [ ] Vous voyez au moins un pod nommé `shared-app-...` dans le namespace `shared-workloads`
- [ ] Le pod est en status `Running`
- [ ] Vous comprenez la syntaxe `-o custom-columns`

---

## Étape 2 : Extraire le manifeste YAML du déploiement

### Pourquoi cette étape ?

Dans la vraie vie, on ne recrée pas tout de zéro. On **récupere la définition d'une ressource existante** et on l'adapte. Le flag `-o yaml` permet d'extraire le manifeste complet de n'importe quelle ressource Kubernetes.

### Instructions

Extrayez le manifeste du déploiement `shared-app` et sauvegardez-le dans un fichier :

```bash
oc get deployment shared-app -n shared-workloads -o yaml > deployment.yaml
```

:::info Que fait cette commande ?
- `oc get deployment shared-app` : récupere le déploiement nommé `shared-app`
- `-n shared-workloads` : dans le namespace `shared-workloads`
- `-o yaml` : formate la sortie en YAML (au lieu du tableau par défaut)
- `> deployment.yaml` : redirige la sortie dans un fichier local
:::

Affichez le contenu du fichier pour l'examiner :

```bash
cat deployment.yaml
```

**Sortie attendue (extrait simplifié) :**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: shared-app
    app.kubernetes.io/instance: shared-workloads
  name: shared-app
  namespace: shared-workloads
  resourceVersion: "12345678"
  uid: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  creationTimestamp: "2026-03-20T10:00:00Z"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: shared-app
  template:
    metadata:
      labels:
        app: shared-app
    spec:
      containers:
      - args:
        - -c
        - echo hello from neutron IT; while true; do sleep 10; done
        command:
        - /bin/bash
        image: registry.access.redhat.com/ubi8/ubi:latest
        name: quarkus-container
status:
  availableReplicas: 1
  readyReplicas: 1
  replicas: 1
  ...
```

:::warning Attention : ce fichier n'est pas directement réutilisable !
Le YAML exporté contient des champs **spécifiques a cette instance** (`resourceVersion`, `uid`, `creationTimestamp`, `status`). Si vous essayez de l'appliquer tel quel dans un autre namespace, cela échouera. Il faut d'abord le **nettoyer**, c'est l'objet de l'étape suivante.
:::

### Vérification

Avant de passer a l'étape suivante, vérifiez que :
- [ ] Le fichier `deployment.yaml` existe dans votre répertoire courant
- [ ] Vous pouvez identifier les 4 sections principales : `apiVersion`, `kind`, `metadata`, `spec`
- [ ] Vous repérez le bloc `status` en fin de fichier

---

## Étape 3 : Nettoyer et modifier le manifeste YAML

### Pourquoi cette étape ?

Le manifeste extrait appartient a l'application du formateur. Pour créer **votre propre copie**, vous devez :
1. **Supprimer** les champs générés automatiquement par Kubernetes
2. **Changer** le nom et le namespace pour correspondre a votre environnement

### Instructions

Ouvrez le fichier dans un éditeur de texte :

```bash
vi deployment.yaml
```

:::tip Alternatives a vi
Si vous n'etes pas a l'aise avec `vi`, vous pouvez utiliser `nano` :
```bash
nano deployment.yaml
```
:::

Effectuez les modifications suivantes, **dans cet ordre** :

#### 3.1 -- Supprimer le bloc `status`

Supprimez **tout** ce qui se trouve sous la ligne `status:` (y compris la ligne `status:` elle-meme).

**Pourquoi ?** Le champ `status` est **géré exclusivement par Kubernetes**. Il reflète l'état actuel de la ressource. Lors de la création d'une nouvelle ressource, Kubernetes le régénérera automatiquement.

#### 3.2 -- Nettoyer la section `metadata`

Dans la section `metadata`, gardez **uniquement** `name` et `namespace`. Supprimez tout le reste (`labels`, `annotations`, `creationTimestamp`, `resourceVersion`, `uid`, `generation`, `managedFields`, etc.).

**Pourquoi ?** Ces champs sont spécifiques a l'instance originale. Les conserver pourrait créer des conflits ou des erreurs.

#### 3.3 -- Changer le nom du déploiement

Remplacez :
```yaml
  name: shared-app
```
Par :
```yaml
  name: <CITY>-demo-app
```

#### 3.4 -- Changer le namespace

Remplacez :
```yaml
  namespace: shared-workloads
```
Par :
```yaml
  namespace: <CITY>-user-ns
```

### Résultat final

Votre fichier `deployment.yaml` doit ressembler a ceci (exemple pour la ville **paris**) :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: paris-demo-app
  namespace: paris-user-ns
spec:
  replicas: 1
  selector:
    matchLabels:
      app: shared-app
  template:
    metadata:
      labels:
        app: shared-app
    spec:
      containers:
      - args:
        - -c
        - echo hello from neutron IT; while true; do sleep 10; done
        command:
        - /bin/bash
        image: registry.access.redhat.com/ubi8/ubi:latest
        name: quarkus-container
```

:::info Bon a savoir : selector et labels du template
Remarquez que les `matchLabels` dans le `selector` et les `labels` dans le `template` doivent correspondre. C'est comme cela que le déploiement sait quels pods lui appartiennent. Ici, on les laisse inchangés car ils n'ont pas besoin d'etre uniques entre namespaces.
:::

### Vérification

Avant de passer a l'étape suivante, vérifiez que :
- [ ] Le bloc `status` a été completement supprimé
- [ ] La section `metadata` ne contient que `name` et `namespace`
- [ ] Le nom du déploiement contient le préfixe de votre ville
- [ ] Le namespace pointe vers votre namespace personnel (`<CITY>-user-ns`)
- [ ] Le fichier ne contient aucune erreur de syntaxe YAML (l'indentation est correcte)

---

## Étape 4 : Appliquer le manifeste modifié

### Pourquoi cette étape ?

C'est le moment clé : vous allez **créer votre propre déploiement** sur le cluster a partir du manifeste nettoyé. La commande `oc apply` envoie le fichier YAML au serveur Kubernetes qui va créer la ressource.

### Instructions

Appliquez le fichier modifié :

```bash
oc apply -f deployment.yaml
```

**Sortie attendue :**
```
deployment.apps/paris-demo-app created
```

:::tip apply vs create
- `oc apply -f` : crée la ressource si elle n'existe pas, ou la met a jour si elle existe déja. C'est la commande **recommandée**.
- `oc create -f` : crée la ressource mais échoue si elle existe déja.

Préférez toujours `oc apply` pour sa flexibilité.
:::

Vérifiez que le déploiement a bien été créé :

```bash
oc get deployment -n <CITY>-user-ns
```

**Sortie attendue :**
```
NAME                  READY   UP-TO-DATE   AVAILABLE   AGE
paris-demo-app       1/1     1            1           30s
```

Vérifiez que le pod associé tourne correctement :

```bash
oc get pods -n <CITY>-user-ns
```

**Sortie attendue :**
```
NAME                                 READY   STATUS    RESTARTS   AGE
paris-demo-app-75bb5d5698-x9kml     1/1     Running   0          45s
```

Voici a quoi ressemble un déploiement réussi dans la console web OpenShift :


:::warning Si le pod n'est pas en status Running
Si votre pod est en status `CrashLoopBackOff`, `Error` ou `Pending`, vérifiez :
1. Que votre fichier YAML ne contient pas d'erreur de syntaxe
2. Que le namespace `<CITY>-user-ns` existe bien
3. Utilisez `oc describe pod <nom-du-pod> -n <CITY>-user-ns` pour obtenir plus de détails sur l'erreur
:::

### Vérification

Avant de passer a l'étape suivante, vérifiez que :
- [ ] La commande `oc apply` a affiché `created` (et non une erreur)
- [ ] Le déploiement apparait dans `oc get deployment`
- [ ] Le pod est en status `Running` avec `READY 1/1`

---

## Étape 5 : Nettoyage des ressources

### Pourquoi cette étape ?

Il est important de **nettoyer apres chaque exercice** pour ne pas laisser de ressources inutiles sur le cluster partagé. La commande `oc delete` supprime les ressources définies dans un fichier YAML.

### Instructions

Supprimez le déploiement que vous avez créé :

```bash
oc delete -f deployment.yaml
```

**Sortie attendue :**
```
deployment.apps/paris-demo-app deleted
```

Vérifiez que le déploiement a bien été supprimé :

```bash
oc get deployment -n <CITY>-user-ns
```

**Sortie attendue :**
```
No resources found in paris-user-ns namespace.
```

:::tip Supprimer avec le fichier vs par le nom
- `oc delete -f deployment.yaml` : supprime toutes les ressources décrites dans le fichier
- `oc delete deployment paris-demo-app -n paris-user-ns` : supprime une ressource spécifique par son nom

Les deux méthodes fonctionnent, mais utiliser le fichier est pratique quand vous avez plusieurs ressources a supprimer en meme temps.
:::

### Vérification

- [ ] La commande `oc delete` a affiché `deleted`
- [ ] `oc get deployment` ne montre plus votre déploiement

---

## Récapitulatif

Voici un résumé de toutes les commandes utilisées dans cet exercice :

| Commande | Description | Quand l'utiliser |
|---|---|---|
| `oc get pods -n <ns>` | Lister les pods d'un namespace | Pour vérifier l'état des applications |
| `oc get pods -o custom-columns=...` | Affichage personnalisé | Pour créer des vues ciblées |
| `oc get deployment <nom> -o yaml` | Extraire le manifeste YAML | Pour récupérer la définition d'une ressource |
| `oc apply -f <fichier>` | Appliquer un manifeste | Pour créer ou mettre a jour une ressource |
| `oc delete -f <fichier>` | Supprimer via un manifeste | Pour supprimer les ressources décrites dans un fichier |
| `oc describe pod <nom>` | Détails d'un pod | Pour déboguer un pod qui ne démarre pas |

## Ce que vous avez appris

A la fin de cet exercice, vous savez désormais :

- **Lister et inspecter** des ressources avec `oc get` et ses options d'affichage
- **Extraire un manifeste YAML** depuis le cluster pour le réutiliser
- **Nettoyer un manifeste** en supprimant les champs auto-générés (`status`, `resourceVersion`, `uid`...)
- **Adapter un manifeste** en changeant le nom et le namespace
- **Appliquer et supprimer** des ressources de maniere déclarative avec des fichiers YAML

:::note Point clé a retenir
Le cycle **extraire -> nettoyer -> modifier -> appliquer** est un workflow fondamental dans Kubernetes. Vous l'utiliserez tres souvent en production pour dupliquer ou migrer des ressources entre environnements.
:::
