# Exercice Guidé : Les Réseaux de Pods et de Services

## Ce que vous allez apprendre

Dans cet exercice, vous allez explorer les trois couches de connectivité dans OpenShift :
1.  **IP de Pod** : Communication directe entre conteneurs (instable).
2.  **ClusterIP** : IP de service stable à l'intérieur du cluster.
3.  **NodePort** : Accès limité via l'IP du noeud (pour certains cas techniques).
4.  **Route HTTPS** : Exposition sécurisée sur Internet pour les utilisateurs finaux.

---

## Objectifs

- [ ] Déployer une application et tester la communication via son **IP de Pod**
- [ ] Créer et tester un service **ClusterIP**
- [ ] Créer et tester un service **NodePort**
- [ ] Exposer l'application via une **Route HTTPS** avec redirection automatique

---

## Étape 1 : Déployer l'application

Utilisons la **Welcome App** (port 8080).

Créez le fichier `welcome-deployment.yaml` :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: welcome-app
  namespace: <CITY>-user-ns
spec:
  replicas: 1
  selector:
    matchLabels:
      app: welcome-app
  template:
    metadata:
      labels:
        app: welcome-app
    spec:
      containers:
      - name: welcome-app
        image: quay.io/neutron-it/welcome-app:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "1m"
            memory: "64Mi"
          limits:
            cpu: "100m"
            memory: "128Mi"
```

Appliquez le déploiement :
```bash
oc apply -f welcome-deployment.yaml
```

---

## Étape 2 : Communication via l'IP du Pod (Interne)

Chaque pod a sa propre adresse IP, mais elle est **éphémère**. Si le pod meurt, l'IP change.

### 2.1 Récupérer l'IP du Pod
```bash
oc get pods -o wide
```
*Notez l'IP affichée dans la colonne `IP` (ex: `10.128.x.y`).*

### 2.2 Tester la connexion
Même sans service, vous pouvez joindre le pod directement depuis votre terminal web (car il est lui-même dans le cluster). Lancez un `curl` :

```bash
# Remplacez <POD_IP> par l'IP notée précédemment
curl -s <POD_IP>:8080 | grep "Bienvenue"
```

---

## Étape 3 : Créer et tester le Service ClusterIP (Stable)

Le **ClusterIP** fournit une IP virtuelle stable qui redirige vers vos pods. C'est le mode par défaut.

### 3.1 Créer le service
Créez le fichier `welcome-clusterip.yaml` :

```yaml
apiVersion: v1
kind: Service
metadata:
  name: welcome-svc-clusterip
  namespace: <CITY>-user-ns
spec:
  selector:
    app: welcome-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
```

```bash
oc apply -f welcome-clusterip.yaml
```

### 3.2 Tester via l'IP du Service
Récupérez l'IP stable du service :
```bash
oc get svc welcome-svc-clusterip
```
*Notez la `CLUSTER-IP` (ex: `172.30.x.y`).*

Testez la connexion (sur le port 80 cette fois) :
```bash
# Remplacez <CLUSTER_IP> par l'IP notée précédemment
curl -s <CLUSTER_IP>:80 | grep "Bienvenue"
```

---

## Étape 4 : Créer et tester le Service NodePort (Accès par le noeud)

Le **NodePort** expose l'application sur un port spécifique (généralement entre 30000 et 32767) sur **tous les noeuds** du cluster.

### 4.1 Créer le service NodePort
Créez le fichier `welcome-nodeport.yaml` :

```yaml
apiVersion: v1
kind: Service
metadata:
  name: welcome-svc-nodeport
  namespace: <CITY>-user-ns
spec:
  selector:
    app: welcome-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
    nodePort: 30080 # On choisit un port fixe pour l'exemple
  type: NodePort
```

```bash
oc apply -f welcome-nodeport.yaml
```

### 4.2 Autoriser le trafic (NetworkPolicy)
Par défaut, OpenShift peut bloquer le trafic entrant vers vos pods pour des raisons de sécurité. Pour que le NodePort fonctionne depuis l'extérieur, nous devons explicitement autoriser le trafic vers notre application.

Créez le fichier `welcome-policy.yaml` :

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-welcome
  namespace: <CITY>-user-ns
spec:
  podSelector:
    matchLabels:
      app: welcome-app
  ingress:
  - {} # Autorise tout le trafic entrant vers cette application
  policyTypes:
  - Ingress
```

```bash
oc apply -f welcome-policy.yaml
```

---

## Étape 5 : Tester via le navigateur (Mode NodePort)

Contrairement aux étapes précédentes, nous allons tester l'accès depuis **votre propre navigateur** (Chrome/Edge/Firefox) sur votre ordinateur.

1.  Assurez-vous d'être connecté au réseau de la formation (VPN ou réseau local).
2.  Dans votre barre d'adresse, entrez l'URL suivante :
    `http://192.168.0.251:30080`
3.  **Observation** : Vous accédez à l'application directement via l'adresse du serveur OpenShift, sans passer par la Route !

:::warning Attention au port
Si vous rafraîchissez trop vite ou si le réseau est saturé, cet accès peut être moins stable qu'une Route. Le NodePort est principalement utilisé pour des flux techniques.
:::

---

## Étape 6 : Créer la Route HTTPS (Exposition Publique)

C'est la méthode recommandée pour exposer des applications web.

### 5.1 Créer la Route Edge
Créez le fichier `welcome-route.yaml` :

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: welcome-route
  namespace: <CITY>-user-ns
spec:
  to:
    kind: Service
    name: welcome-svc-clusterip
  port:
    targetPort: 80
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

```bash
oc apply -f welcome-route.yaml
```

### 5.2 Tester dans le navigateur
```bash
oc get route welcome-route -o jsonpath='https://{.spec.host}{"\n"}'
```
Ouvrez l'URL en `https://`. Vous êtes maintenant sur le réseau public sécurisé.

---

## Récapitulatif

| Méthode | Portée | Stabilité | Usage principal |
|---|---|---|---|
| **Pod IP** | Interne uniquement | **Instable** | Debugging uniquement |
| **ClusterIP** | Interne uniquement | **Stable** | Communication entre micro-services |
| **NodePort** | Interne + Bureau local | **Stable** | Accès technique sans Router |
| **Route HTTPS** | **Internet (Public)** | **Stable** | Production, accès utilisateurs |

---

## Étape 7 : Nettoyage

```bash
oc delete deployment welcome-app
oc delete svc welcome-svc-clusterip welcome-svc-nodeport
oc delete route welcome-route
oc delete networkpolicy allow-ingress-welcome
```
