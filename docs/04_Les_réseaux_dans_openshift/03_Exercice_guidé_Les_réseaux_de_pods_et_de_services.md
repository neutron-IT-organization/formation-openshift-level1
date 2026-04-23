---
id: Exercice_guidé_Les_réseaux_de_pods_et_de_services

slug: /Les_réseaux_dans_openshift/Exercice_guidé_Les_réseaux_de_pods_et_de_services
---
# Exercice Guidé : Les Réseaux de Pods et de Services

## Ce que vous allez apprendre

Dans cet exercice, vous allez explorer les trois couches de connectivité dans OpenShift :
1.  **IP de Pod** : Communication directe entre conteneurs (instable).
2.  **ClusterIP** : IP de service stable à l'intérieur du cluster.
3.  **NodePort** : Accès par le noeud (IP du serveur).
4.  **Route HTTPS** : Exposition sécurisée sur Internet.

Vous apprendrez également à lever l'isolation réseau entre les namespaces via une **NetworkPolicy**.

---

:::tip Terminal web OpenShift
Toutes les commandes `oc` de cet exercice sont à exécuter dans le **terminal web OpenShift**. Cliquez sur l'icône de terminal en haut à droite de la console pour l'ouvrir.

![Icône du terminal web](/img/screenshots/web_terminal_icon.png)
:::

## Objectifs

- [ ] Déployer une application web
- [ ] Configurer une **NetworkPolicy** pour autoriser le trafic entre namespaces
- [ ] Tester la connectivité via **Pod IP**, **ClusterIP**, **NodePort** et **Route**

---

## Étape 1 : Déployer l'application

Créez le fichier `welcome-deployment.yaml` :

```bash
vi welcome-deployment.yaml
```

:::tip Vous préférez nano ?
```bash
nano welcome-deployment.yaml
```
Pour coller du contenu dans le terminal web : `Ctrl+Shift+V`. Pour sauvegarder : `Ctrl+O` puis `Entrée`. Pour quitter : `Ctrl+X`.
:::

Contenu du fichier :

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

```bash
oc apply -f welcome-deployment.yaml
```

**Sortie attendue :**

```
deployment.apps/welcome-app created
```

Vérifiez que le pod démarre correctement :

```bash
oc get pods -l app=welcome-app
```

---

## Étape 2 : Configurer la NetworkPolicy

Par défaut, dans l'environnement de formation, les namespaces sont isolés. Pour que vous puissiez effectuer des tests de communication (via `curl` depuis votre terminal web ou entre vos namespaces), il faut autoriser le trafic entrant vers votre application.

:::info Pourquoi une NetworkPolicy ?
Le terminal web OpenShift s'exécute dans le namespace `openshift-terminal`. Sans NetworkPolicy, il ne peut pas joindre votre pod par son IP ou par la ClusterIP du service. Cette politique lève l'isolation pour l'application `welcome-app`.
:::

Créez le fichier `welcome-policy.yaml` :

```bash
vi welcome-policy.yaml
```

:::tip Vous préférez nano ?
```bash
nano welcome-policy.yaml
```
:::

Contenu du fichier :

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-multi-namespace-ingress
  namespace: <CITY>-user-ns
spec:
  podSelector:
    matchLabels:
      app: welcome-app
  ingress:
  - from:
    - namespaceSelector: {} # Autorise le trafic provenant de TOUS les namespaces (utile pour le terminal web et les tests croisés)
  policyTypes:
  - Ingress
```

```bash
oc apply -f welcome-policy.yaml
```

**Sortie attendue :**

```
networkpolicy.networking.k8s.io/allow-multi-namespace-ingress created
```

---

## Étape 3 : Communication via l'IP du Pod (Interne)

### 3.1 Récupérer l'IP du Pod
```bash
oc get pods -l app=welcome-app -o wide
```
*Notez l'IP dans la colonne `IP`.*

### 3.2 Tester la connexion
Lancez un `curl` directement dans votre terminal web :
```bash
# Remplacez <POD_IP> par l'IP notée précédemment
curl -s <POD_IP>:8080 | grep "Bienvenue"
```

**Sortie attendue :**

```
<h1>Bienvenue sur notre site de démonstration !</h1>
```

:::warning IP instable
L'IP d'un pod change à chaque recréation. C'est pourquoi on utilise un **Service** pour accéder à l'application de manière stable.
:::

---

## Étape 4 : Créer et tester le Service ClusterIP (Stable)

### 4.1 Créer le service
Créez le fichier `welcome-clusterip.yaml` :

```bash
vi welcome-clusterip.yaml
```

:::tip Vous préférez nano ?
```bash
nano welcome-clusterip.yaml
```
:::

Contenu du fichier :

```yaml
apiVersion: v1
kind: Service
metadata:
  name: welcome-svc
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

**Sortie attendue :**

```
service/welcome-svc created
```

### 4.2 Tester via l'IP du Service
```bash
oc get svc welcome-svc
```
*Notez la `CLUSTER-IP`.*

```bash
# Remplacez <CLUSTER_IP> par l'IP du service
curl -s <CLUSTER_IP>:80 | grep "Bienvenue"
```

**Sortie attendue :**

```
 <h1>Bienvenue sur notre site de démonstration !</h1>
```

---
## Étape 5 : Communication entre Pods (Pod-à-Pod)

Dans cette étape, vous allez déployer un deuxième pod (un client **curl**) dans votre namespace, puis vérifier qu'il peut joindre **welcome-app** via le nom du Service **welcome-svc**, sans jamais utiliser son IP.

C'est le vrai cas d'usage du **ClusterIP** : la communication entre microservices à l'intérieur du cluster.



### 5.1 Déployer un pod client

Créez le fichier `client-deployment.yaml` :

```bash
vi client-deployment.yaml
```

:::tip Vous préférez nano ?
```bash
nano client-deployment.yaml
```
:::

Contenu du fichier :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: client-app
  namespace: <CITY>-user-ns
spec:
  replicas: 1
  selector:
    matchLabels:
      app: client-app
  template:
    metadata:
      labels:
        app: client-app
    spec:
      containers:
      - name: client
        image: curlimages/curl:latest
        command: ["sleep", "infinity"]
        resources:
          requests:
            cpu: "10m"
            memory: "32Mi"
          limits:
            cpu: "50m"
            memory: "64Mi"
```

Ce Deployment définit :

- Un pod unique (**replicas: 1**) étiqueté `app: client-app`.
- Une image légère **curlimages/curl** contenant l'utilitaire `curl`.
- Une commande `sleep infinity` pour garder le pod actif en permanence (sinon il s'arrêterait immédiatement).
- Des limites de ressources adaptées à un simple pod de test.

Appliquez le manifest :

```bash
oc apply -f client-deployment.yaml
```

**Sortie attendue :**

```
deployment.apps/client-app created
```

Vérifiez que le pod est prêt :

```bash
oc get pods -l app=client-app
```

---

### 5.2 Tester la communication via le nom du Service

Entrez dans le pod client :

```bash
oc exec -it deploy/client-app -- sh
```

À l'intérieur du pod, lancez :

```bash
curl -s welcome-svc | grep "Bienvenue"
```

**Sortie attendue :**

```html
<h1>Bienvenue sur notre site de démonstration !</h1>
```

Vous pouvez aussi vérifier la résolution DNS du nom du Service :

```bash
nslookup welcome-svc.paris-user-ns.svc.cluster.local
```

La commande retournera l'IP virtuelle (ClusterIP) du Service, démontrant que le cluster a bien résolu le nom.

Puis quittez le pod :

```bash
exit
```

:::info Pourquoi welcome-svc fonctionne ?
Le pod **client-app** et le Service **welcome-svc** sont dans le **même namespace**. Le cluster résout automatiquement le nom court vers l'IP du Service.

On utilise toujours **le nom** et jamais l'IP, car l'IP peut changer alors que le nom est stable.
:::

---

### 5.3 Test en une seule commande (sans shell interactif)

Pour faire le test rapidement sans ouvrir de shell dans le pod :

```bash
oc exec deploy/client-app -- curl -s welcome-svc | grep "Bienvenue"
```

**Sortie attendue :**

```html
<h1>Bienvenue sur notre site de démonstration !</h1>
```

---

### 5.4 Vérifier la résilience du Service

Pour démontrer la résilience, vous allez provoquer une recréation du pod **welcome-app**. Cela simule ce qui arrive en production lors :

- D'une **mise à jour** de l'application (rolling update).
- D'un **redémarrage** du nœud.
- D'un **scaling** (ajout ou suppression de répliques).
- D'un **crash** du pod.

Dans tous ces cas, un nouveau pod est créé avec **une nouvelle IP**, mais le Service reste stable.

Recréez le pod **welcome-app** pour lui donner une nouvelle IP :

```bash
oc scale deployment/welcome-app --replicas=0
oc scale deployment/welcome-app --replicas=1
```

Attendez qu'il redémarre :

```bash
oc get pods -l app=welcome-app -w
```

Appuyez sur **Ctrl+C** quand il affiche `1/1 Running`, puis relancez le test depuis le client :

```bash
oc exec deploy/client-app -- curl -s welcome-svc | grep "Bienvenue"
```

**Sortie attendue :**

```html
<h1>Bienvenue sur notre site de démonstration !</h1>
```

:::tip Résilience du Service
Le client continue de joindre welcome-app grâce à l'IP virtuelle stable (ClusterIP) du Service, qui reste inchangée même quand le pod est recréé avec une nouvelle IP.
:::

## Étape 6 : Créer et tester le Service NodePort

Le NodePort expose l'application sur un port fixe de votre serveur (le noeud).

### 6.1 Créer le service NodePort
Créez le fichier `welcome-nodeport.yaml` :

```bash
vi welcome-nodeport.yaml
```

:::tip Vous préférez nano ?
```bash
nano welcome-nodeport.yaml
```
:::

Contenu du fichier :

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
    nodePort: 30080
  type: NodePort
```

```bash
oc apply -f welcome-nodeport.yaml
```

**Sortie attendue :**

```
service/welcome-svc-nodeport created
```

### 6.2 Tester via l'IP du Noeud
Utilisez l'IP de votre serveur OpenShift (**192.168.0.251**) :
```bash
curl -s http://192.168.0.251:30080 | grep "Bienvenue"
```
**Sortie attendue :**

```
<h1>Bienvenue sur notre site de démonstration !</h1>
```

---

## Étape 7 : Créer la Route HTTPS (Exposition Publique)

### 7.1 Créer la Route Edge
Créez le fichier `welcome-route.yaml` :

```bash
vi welcome-route.yaml
```

:::tip Vous préférez nano ?
```bash
nano welcome-route.yaml
```
:::

Contenu du fichier :

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: welcome-route
  namespace: <CITY>-user-ns
spec:
  to:
    kind: Service
    name: welcome-svc
  port:
    targetPort: 8080
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

```bash
oc apply -f welcome-route.yaml
```

**Sortie attendue :**

```
route.route.openshift.io/welcome-route created
```

### 7.2 Tester dans le navigateur
```bash
oc get route welcome-route -o jsonpath='https://{.spec.host}{"\n"}'
```
Ouvrez l'URL générée dans votre navigateur.

---

## Récapitulatif

| Méthode | Portée | Stabilité | Usage principal |
|---|---|---|---|
| **Pod IP** | Interne | **Instable** | Debugging |
| **ClusterIP** | Interne | **Stable** | Inter-services |
| **NodePort** | Bureau local | **Stable** | Accès technique |
| **Route HTTPS** | **Internet (Public)** | **Stable** | Accès utilisateurs |

---

## Étape 6 : Nettoyage

```bash
oc delete deployment welcome-app client-app
oc delete svc welcome-svc welcome-svc-nodeport
oc delete route welcome-route
oc delete networkpolicy allow-multi-namespace-ingress
```
