# Exercice Guidé sur les PVC, PV et Storage Class

### Objectif

L'objectif de cet exercice est de démontrer comment utiliser des Persistent Volume Claims (PVC) et Persistent Volumes (PV) avec une Storage Class pour assurer la persistance des données d'une application, même après la suppression de pods.

### Étapes de l'Exercice

#### Étape 1 : Déployer PostgreSQL avec un stockage éphémère

1. **Créez le déploiement PostgreSQL en utilisant `emptyDir`.**

Créez un fichier YAML nommé `postgres-emptydir-deployment.yaml` contenant le manifeste suivant :

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
          emptyDir: {} # Utilisation de emptyDir pour le stockage temporaire
      containers:
        - name: postgres
          image: registry.redhat.io/rhel8/postgresql-12:latest
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
            - name: POSTGRESQL_PORT
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_PORT
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/pgsql/data
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  selector:
    app: postgres
  ports:
    - name: postgres
      port: 5432
      targetPort: 5432
  type: ClusterIP
---
apiVersion: v1
data:
  POSTGRES_DB: dGFzaw==
  POSTGRES_PASSWORD: bXlzZWNyZXRwYXNzd29yZA==
  POSTGRES_PORT: NTQzMg==
  POSTGRES_USER: dGFzay11c2Vy
kind: Secret
metadata:
  name: postgres-credentials
type: Opaque
```

2. **Appliquez le déploiement :**

```bash
oc apply -f postgres-emptydir-deployment.yaml
```

#### Étape 2 : Déployer l'Application Todo

1. **Créez le déploiement pour l'application Todo.**

Créez un fichier YAML nommé `todo-app.yaml` :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-app
  labels:
    app: todo-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: todo-app
  template:
    metadata:
      labels:
        app: todo-app
    spec:
      containers:
        - name: todo-app
          image: quay.io/neutron-it/todoapp:v4
          ports:
            - containerPort: 8080
          env:
            - name: NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
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
            - name: POSTGRESQL_PORT
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_PORT
---
apiVersion: v1
kind: Service
metadata:
  name: todo-app-service
spec:
  selector:
    app: todo-app
  ports:
    - name: todo-app
      port: 8080
      targetPort: 8080
  type: ClusterIP
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: todo-route
spec:
  to:
    kind: Service
    name: todo-app-service
    weight: 100
  port:
    targetPort: 8080
  tls:
    termination: edge
```

2. **Appliquez le déploiement :**

```bash
oc apply -f todo-app.yaml
```

3. **Récupérez la route pour accéder à l'application Todo :**

Utilisez la commande suivante :

```bash
oc get route
```

Notez l'URL fournie et accédez-y depuis votre navigateur. Ajoutez quelques tâches à votre liste de tâches.

![task ephemere](./images/task-ephemere.png)

#### Étape 3 : Tester la Persistance des Données

1. **Redémarrez le déploiement PostgreSQL.**

Supprimez le pod PostgreSQL pour observer le comportement du stockage éphémère :

```bash
oc delete pod -l app=postgres
```

Kubernetes recréera le pod automatiquement grâce au déploiement.

2. **Vérifiez l'Application Todo.**

Rendez-vous à nouveau sur l'interface de votre application Todo et faite un refresh de la page. Vous devriez voir que les tâches que vous avez ajoutées précédemment ont disparu, car les données étaient stockées dans un volume éphémère (`emptyDir`), qui est supprimé avec le pod.

![task ephemere](./images/task-ephemere-remove.png)

### Transition vers un Stockage Persistant

Pour éviter que le contenu persistant disparaisse lorsque vous modifiez l'image de votre pod, nous allons ajouter du stockage persistant avec des PV et des PVC.

1. **Modifiez le manifeste du déploiement PostgreSQL pour utiliser un PVC.**

Voici le manifeste mis à jour pour le déploiement PostgreSQL :

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
          persistentVolumeClaim:
            claimName: postgres-pvc
      containers:
        - name: postgres
          image: registry.redhat.io/rhel8/postgresql-12:latest
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
            - name: POSTGRESQL_PORT
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_PORT
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/pgsql/data
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

2. **Appliquez les modifications.**

Appliquez le nouveau déploiement :

```bash
oc apply -f postgres-pvc-deployment.yaml
oc delete pod -l app=todo-app
```

#### Test de Création de Tâches avec Stockage Persistant

1. **Vérifiez l'Application Todo.**

Accédez à l'interface de l'application Todo via l'URL que vous avez récupérée précédemment. Ajoutez de nouvelles tâches à votre liste.

![task permanente](./images/task-permanente.png)

2. **Testez le comportement après le redémarrage du pod.**

Après avoir ajouté quelques tâches, répétez le processus de redémarrage du pod PostgreSQL :

```bash
oc delete pod -l app=postgres
```

Kubernetes va recréer le pod automatiquement.

3. **Vérifiez à nouveau l'interface de l'application Todo.**

Vous devriez maintenant constater que les tâches que vous avez ajoutées précédemment sont toujours présentes avec votre refresh de la page. Cela s'explique par le fait que les données sont maintenant stockées dans un volume persistant via un Persistent Volume Claim (PVC), ce qui permet de préserver les données même après la suppression des pods.

### Conclusion

Dans cette section, nous avons réalisé un exercice pratique sur l'utilisation des Persistent Volume Claims (PVC), des Persistent Volumes (PV) et des Storage Classes dans Kubernetes.
