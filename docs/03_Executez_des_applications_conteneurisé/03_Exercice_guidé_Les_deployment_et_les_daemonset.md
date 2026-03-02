# Exercice Guidé : Les déploiements et les daemonset dans OpenShift

Dans cet exercice, vous allez créer un déploiement dans OpenShift et tester une stratégie de déploiement en Rolling Updates. Suivez les étapes ci-dessous pour mettre en pratique les concepts théoriques que nous avons abordés.

#### Objectifs de l'Exercice

- Créer un déploiement dans OpenShift.
- Appliquer une stratégie de déploiement en Rolling Updates.
- Mettre à jour l'application et observer le processus de déploiement.
- Déclencher un rollback en cas de problème.

#### Prérequis

Assurez-vous d'avoir accès à un cluster OpenShift et les permissions nécessaires pour créer des déploiements. Vous devez également avoir la CLI `oc` installée sur votre machine.

### Étape 1 : Créer un Déploiement

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
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-container
        image: registry.access.redhat.com/ubi9/httpd-24:1-3
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
        env:
        - name: ENV_VAR
          value: "value"
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
```

Ce fichier YAML définit un déploiement nommé `my-deployment` avec 3 réplicas d'un conteneur Httpd. La stratégie de déploiement est configurée pour utiliser Rolling Updates.

Appliquez ce déploiement avec la commande suivante :

```bash
oc apply -f my-deployment.yaml
```

### Étape 2 : Vérifier le Déploiement

Vérifiez que le déploiement a été créé et que les pods sont en cours d'exécution :

```bash
oc get deployments
oc get pods
```

Vous devriez voir le déploiement `my-deployment` et trois pods en cours d'exécution.

### Étape 3 : Mettre à Jour l'Application et Observer le Rolling Update

Pour simuler une mise à jour de l'application, nous allons changer l'image utilisée par le conteneur.
Avant cela rendez vous dans la console dans la section Deployment et cliquez sur `my-deployment`.

![My-deployment section](./images/statefulset-ui.png)

Exécutez la commande suivante pour mettre à jour l'image du conteneur :

```bash
oc set image deployment/my-deployment my-container=registry.access.redhat.com/ubi9/httpd-24:1-325
```

Vous deriez alors pouvoir observer le rollout dans la console.



### Étape 4 : Déclencher un Rollback

Si quelque chose ne va pas avec la mise à jour, vous pouvez revenir à la version précédente du déploiement :

```bash
oc rollout undo deployment/my-deployment
```

Cette commande déclenchera un rollback, et les pods seront remplacés par ceux définis dans la configuration précédente.

### Étape 5 : Vérifier le Rollback

Pour vérifier que le rollback a bien fonctionné, nous allons récupérer l'image actuellement utilisée par les pods et vérifier qu'elle correspond bien à l'ancienne version. Utilisez les commandes suivantes :

1. **Vérifiez le statut du déploiement :**

   ```bash
   oc rollout status deployment/my-deployment
   ```

2. **Listez les pods pour vérifier qu'ils sont tous en cours d'exécution :**

   ```bash
   oc get pods
   ```

3. **Récupérez l'image actuellement utilisée par le déploiement :**

   ```bash
   oc get deployment my-deployment -o jsonpath='{.spec.template.spec.containers[0].image}'
   ```

Cette commande affichera l'image actuellement utilisée par le déploiement. Vérifiez que cette image correspond à l'ancienne version, qui est `registry.access.redhat.com/ubi9/httpd-24:1-331`.

### Conclusion

En suivant ces étapes, vous pouvez vous assurer que le rollback a bien fonctionné et que l'image du déploiement est revenue à l'ancienne version. Cela complète votre exercice sur la gestion des déploiements et des rollbacks dans OpenShift.
