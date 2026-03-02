# Examen des Ressources Kubernetes

Dans cette section, nous allons apprendre comment examiner les différentes ressources disponibles dans un cluster Kubernetes à l'aide de la ligne de commande `oc`. Comprendre ces ressources est essentiel pour gérer efficacement un environnement Kubernetes et OpenShift.

### Objectifs de la Section

Dans cette section, nous avons pour objectifs de :

1. Comprendre la structure des objets Kubernetes, en particulier les champs **spec** et **status**.

2. Identifier et décrire les autres champs courants des ressources Kubernetes.

3. Illustrer la configuration d'un objet Kubernetes à l'aide d'un exemple de manifest de déploiement.

4. Apprendre à utiliser les options de sortie YAML et JSON pour analyser et écrire des scripts.

5. Maîtriser l'utilisation du format de sortie personnalisé pour extraire des données spécifiques de manière tabulaire.

### Spécification et statut des objets Kubernetes

Les objets Kubernetes contiennent deux champs qui régissent la configuration de l’objet : le champ **spec** et le champ **status**.

- **spec** : décrit l’état prévu de la ressource. Vous spécifiez la section **spec** de la ressource lors de la création de l’objet.
- **status** : décrit l’état actuel de la ressource. Les contrôleurs Kubernetes mettent à jour en continu le **status** de l’objet pendant toute sa durée de vie.

Le plan de contrôle Kubernetes gère continuellement et activement l’état réel de chaque objet pour qu’il corresponde à l’état souhaité que vous avez indiqué.

### Formats de sortie YAML 

Pour analyser et écrire des scripts, Kubernetes fournit des options de sortie aux formats YAML et JSON. La commande `oc` permet  d'extraire ces informations.

#### Exemple avec `-o yaml`

La commande suivante extrait les informations d'un déploiement au format YAML :

```bash
oc get deployment example-deployment -o yaml
```

##### Exemple d'output YAML :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-deployment
  namespace: default
  labels:
    app: example
spec:
  replicas: 3
  selector:
    matchLabels:
      app: example
  template:
    metadata:
      labels:
        app: example
    spec:
      containers:
      - name: example-container
        image: nginx:1.14.2
        ports:
        - containerPort: 80
status:
  replicas: 3
  updatedReplicas: 3
  readyReplicas: 3
  availableReplicas: 3
  conditions:
  - type: Available
    status: "True"
    lastUpdateTime: "2024-07-21T12:34:56Z"
    lastTransitionTime: "2024-07-21T12:34:56Z"
    reason: MinimumReplicasAvailable
    message: Deployment has minimum availability.
```

### Détails des Champs

#### Champs

| Champ                | Description                                                                           |
|----------------------|---------------------------------------------------------------------------------------|
| **apiVersion**       | Indique la version de l’API utilisée (ici, `apps/v1`).                                 |
| **kind**             | Type de ressource (ici, `Deployment`).                                                 |
| **metadata**         |                                                                                       |
| - **name**           | Nom de l’objet (`example-deployment`).                                                 |
| - **namespace**      | Namespace où se trouve l'objet (`default`).                                            |
| - **labels**         | Étiquettes associées à l’objet (`app: example`).

#### Spécification (`spec`)

| Champ                | Description                                                                           |
|----------------------|---------------------------------------------------------------------------------------|
| **replicas**         | Nombre de réplicas désiré (ici, `3`).                                                  |
| **selector**         | Sélecteur pour choisir les pods contrôlés par ce déploiement.                          |
|   - **matchLabels**  | Critères de sélection des pods (`app: example`).                                       |
| **template**         |                                                                                       |
|   - **metadata**     |                                                                                       |
|     - **labels**     | Étiquettes appliquées aux pods (`app: example`).                                       |
|   - **spec**         |                                                                                       |
|     - **containers** | Liste des conteneurs déployés par ce manifest.                                         |
|       - **name**     | Nom du conteneur (`example-container`).                                                |
|       - **image**    | Image Docker utilisée (`nginx:1.14.2`).                                                |
|       - **ports**    | Ports exposés par le conteneur.                                                        |
|         - **containerPort** | Port utilisé par le conteneur (`80`).                                           |

#### Statut (`status`)

| Champ                | Description                                                                           |
|----------------------|---------------------------------------------------------------------------------------|
| **replicas**         | Nombre de réplicas observés (`3`).                                                     |
| **updatedReplicas**  | Nombre de réplicas mis à jour (`3`).                                                   |
| **readyReplicas**    | Nombre de réplicas prêts (`3`).                                                        |
| **availableReplicas** | Nombre de réplicas disponibles (`3`).                                                 |
| **conditions**       | Conditions actuelles du déploiement.                                                   |
|   - **type**         | Type de condition (`Available`).                                                       |
|   - **status**       | Statut de la condition (`True`).                                                       |
|   - **lastUpdateTime** | Dernière mise à jour (`2024-07-21T12:34:56Z`).                                       |
|   - **lastTransitionTime** | Dernière transition (`2024-07-21T12:34:56Z`).                                   |
|   - **reason**       | Raison de la condition (`MinimumReplicasAvailable`).                                   |
|   - **message**      | Message décrivant la condition (`Deployment has minimum availability`).                |                                      |

### Format de sortie personnalisé

Pour extraire des données spécifiques de manière tabulaire, Kubernetes offre un format de sortie personnalisé. Utilisez l’option `-o custom-columns` avec des paires `<column name>: <jq query string>` séparées par des virgules.

#### Exemple :

La commande suivante affiche les noms et statuts des pods :

```bash
oc get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase
```

##### Exemple d'output personnalisé :

```
NAME                STATUS
example-pod-1       Running
example-pod-2       Pending
example-pod-3       Running
```

### Création et Mise à jour des Ressources

Pour créer ou mettre à jour des ressources dans Kubernetes, utilisez les commandes `oc create -f` et `oc apply -f`. Ces commandes vous permettent de déployer ou de mettre à jour des objets en fournissant un fichier de définition YAML ou JSON.

#### Création d'une Ressource

Pour créer une ressource, utilisez la commande `oc create -f` suivie du chemin vers le fichier de définition. Par exemple :

```bash
oc create -f deployment.yaml
```

Cette commande lit le fichier `deployment.yaml` et crée le déploiement décrit dans le fichier.

#### Mise à jour d'une Ressource

Pour mettre à jour une ressource existante, utilisez la commande `oc apply -f` suivie du chemin vers le fichier de définition. Par exemple :

```bash
oc apply -f deployment.yaml
```

Cette commande applique les modifications décrites dans le fichier `deployment.yaml` à la ressource existante. Si la ressource n'existe pas encore, elle sera créée.

### Conclusion

Dans cette section, nous avons exploré la structure des objets Kubernetes, en mettant l'accent sur les champs **spec** et **status**, ainsi que sur d'autres champs courants. Nous avons illustré ces concepts avec un exemple de manifest de déploiement et avons appris à utiliser les options de sortie YAML et JSON pour faciliter l'analyse et l'écriture de scripts. Enfin, nous avons découvert comment utiliser le format de sortie personnalisé pour extraire des données spécifiques de manière efficace. Ces compétences sont essentielles pour gérer et interroger efficacement les ressources Kubernetes dans OpenShift.
