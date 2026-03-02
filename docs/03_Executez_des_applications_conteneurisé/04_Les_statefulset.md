# Les statefulSets



## Objectifs de la Section

À la fin de cette section, vous serez capable de :
1. Comprendre ce qu'est un StatefulSet et comment il diffère des autres types de contrôleurs Kubernetes tels que les Deployments.
2. Identifier les cas d'utilisation appropriés pour les StatefulSets.
3. Déployer et gérer des applications stateful à l'aide de StatefulSets.
4. Comprendre les concepts clés associés aux StatefulSets, tels que les noms stables, l'ordonnancement et les Persistent Volume Claims (PVC).

## StatefulSets

### Qu'est-ce qu'un StatefulSet ?

Un StatefulSet est un contrôleur Kubernetes utilisé pour déployer et gérer des applications stateful. Contrairement à un Deployment, qui gère des applications stateless en créant et en supprimant des pods de manière indifférente, un StatefulSet assure que les pods conservent une identité stable et une persistance des données.

![statefulset](./images/statefulset.svg)

### Caractéristiques Clés des StatefulSets

1. **Noms Stables** :
   - Chaque pod dans un StatefulSet a un nom stable basé sur l'index de son ordinal. Par exemple, dans un StatefulSet nommé `web`, les pods seront nommés `web-0`, `web-1`, etc.
   - Cette stabilité permet aux applications de conserver une identité fixe, essentielle pour les applications stateful.

2. **Ordonnancement et Déploiement Séquenciel** :
   - Les pods d'un StatefulSet sont créés et supprimés de manière ordonnée, c'est-à-dire un par un, et dans un ordre déterminé. Cela permet de gérer les dépendances entre les instances de l'application.

3. **Persistent Volume Claims (PVCs)** :
   - Chaque pod d'un StatefulSet peut avoir son propre PVC, ce qui garantit que chaque instance de l'application conserve son propre stockage persistant.
   - Cela permet de gérer les données de manière isolée et indépendante pour chaque instance de l'application.

### Cas d'Utilisation des StatefulSets

1. **Bases de Données Distribuées** :
   - Les bases de données comme Cassandra, MongoDB, et autres bases de données NoSQL nécessitent souvent une persistance des données et une identité stable pour chaque nœud.

2. **Clusters de Bases de Données Relationnelles** :
   - PostgreSQL, MySQL en mode cluster ou tout autre système de bases de données relationnelles nécessitant une réplication et une persistance des données peut bénéficier de l'utilisation de StatefulSets.

3. **Applications avec Réplication de Données** :
   - Toute application nécessitant une réplication de données entre ses instances, comme Elasticsearch ou Redis en mode cluster, bénéficiera des garanties fournies par les StatefulSets.

### Exemple de Déploiement avec StatefulSet

#### Fichier de Configuration pour un StatefulSet Cassandra

```yaml
apiVersion: v1
kind: Service
metadata:
  name: cassandra
  labels:
    app: cassandra
spec:
  ports:
  - port: 9042
  clusterIP: None
  selector:
    app: cassandra
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: cassandra
spec:
  serviceName: "cassandra"
  replicas: 3
  selector:
    matchLabels:
      app: cassandra
  template:
    metadata:
      labels:
        app: cassandra
    spec:
      containers:
      - name: cassandra
        image: cassandra:3.11
        ports:
        - containerPort: 9042
        env:
        - name: CASSANDRA_SEEDS
          value: "cassandra-0.cassandra.default.svc.cluster.local"
        - name: MAX_HEAP_SIZE
          value: "512M"
        - name: HEAP_NEWSIZE
          value: "100M"
        volumeMounts:
        - name: cassandra-data
          mountPath: /var/lib/cassandra
  volumeClaimTemplates:
  - metadata:
      name: cassandra-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

### Analyse et Avantages des StatefulSets

1. **Identité Stable** :
   - Les pods conservent des noms stables, ce qui facilite le suivi et la gestion des instances.

2. **Persistance des Données** :
   - Chaque pod a son propre PVC, garantissant que les données sont conservées indépendamment du cycle de vie des pods.

3. **Ordonnancement Contrôlé** :
   - Les pods sont créés et supprimés de manière ordonnée, ce qui est crucial pour les applications avec des dépendances inter-instances.

## Conclusion

Les StatefulSets sont essentiels pour le déploiement et la gestion des applications stateful dans Kubernetes. Ils offrent des garanties et des fonctionnalités spéciales pour gérer des identités stables, une persistance des données et un ordonnancement séquentiel, rendant possible le déploiement de bases de données distribuées et d'autres applications nécessitant une gestion fine de l'état. En comprenant et en utilisant les StatefulSets, vous pouvez déployer des applications stateful de manière fiable et efficace dans votre cluster Kubernetes.
