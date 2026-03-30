# Services et Routes dans OpenShift

Dans OpenShift, exposer une application de façon fiable et sécurisée nécessite de maîtriser deux abstractions fondamentales : les **Services** et les **Routes**. Les Services assurent l'équilibrage de charge interne entre les pods, tandis que les Routes (ou Ingress) permettent d'accéder aux applications depuis l'extérieur du cluster. Cette section détaille leur fonctionnement, leurs types, et les bonnes pratiques de configuration.

![Relation entre Services et Routes dans OpenShift](./images/service-route-diagram.svg)

*Vue d'ensemble : un Service regroupe les pods par labels, une Route expose le Service vers l'extérieur via l'Ingress Controller*

---

## Objectifs de la section

À la fin de cette section, vous serez capable de :

1. Expliquer le rôle et le fonctionnement des Services dans OpenShift.
2. Distinguer les types de Services (ClusterIP, NodePort, LoadBalancer) et choisir le type adapté à chaque situation.
3. Comprendre le rôle de l'Ingress Controller et son articulation avec les Routes.
4. Configurer une Route OpenShift avec les différents modes de terminaison TLS.
5. Naviguer dans la console OpenShift pour inspecter Services et Routes.

---

## 1. Les Services dans OpenShift

### 1.1 Pourquoi les Services sont indispensables

Les pods sont des entités **éphémères** : ils peuvent être recréés, redémarrés, ou migrés sur un autre nœud à tout moment. À chaque recréation, le pod obtient une nouvelle adresse IP. Si une application frontend communiquait directement avec l'IP d'un pod backend, elle perdrait sa connexion à chaque redémarrage du backend.

Les Services résolvent ce problème en fournissant :

- Une **adresse IP virtuelle stable** (ClusterIP) qui ne change pas tant que le Service existe.
- Un **nom DNS stable** (`<nom-service>.<namespace>.svc.cluster.local`) résolu automatiquement par CoreDNS.
- Un mécanisme d'**équilibrage de charge** vers tous les pods sains associés.

### 1.2 Mécanisme de sélection des pods

Un Service sélectionne ses pods cibles grâce à un **selector** basé sur les labels des pods. Lorsqu'un pod correspondant aux labels est créé ou supprimé, le Service met à jour automatiquement sa liste d'**Endpoints**.

```yaml
# Le Service sélectionne les pods avec ces labels
spec:
  selector:
    app: backend
    version: v2
```

```bash
# Inspecter les endpoints d'un service
oc get endpoints mon-service -n mon-namespace
```

:::info Endpoints et EndpointSlices
Kubernetes maintient un objet `Endpoints` (ou `EndpointSlice` depuis Kubernetes 1.21) qui liste les IP:port de tous les pods sains sélectionnés par le Service. C'est cet objet que kube-proxy (ou OVN-Kubernetes) utilise pour programmer les règles de routage.
:::

---

## 2. Types de Services

![Comparaison ClusterIP, NodePort, LoadBalancer](./images/slide-service-types.png)

*Les trois types de Services Kubernetes et leurs périmètres d'accessibilité*

### Tableau de synthèse

| Type | Accessible depuis | Adresse IP | Cas d'usage principal |
|---|---|---|---|
| **ClusterIP** | Intérieur du cluster uniquement | IP virtuelle interne | Communication inter-services |
| **NodePort** | Extérieur via IP du nœud + port | IP du nœud + port 30000-32767 | Tests, accès direct sans LB |
| **LoadBalancer** | Extérieur via IP publique dédiée | IP externe provisionnée par le cloud | Production sur cloud public |
| **ExternalName** | Alias DNS vers un FQDN externe | Aucune IP (CNAME DNS) | Intégration de services externes |

---

### 2.1 ClusterIP

#### Description

Le type **ClusterIP** est le type par défaut. Il attribue au Service une adresse IP virtuelle accessible uniquement depuis l'intérieur du cluster. Aucun trafic externe ne peut atteindre directement cette IP.

#### Résolution DNS

Depuis n'importe quel pod du cluster :

```
mon-service.mon-namespace.svc.cluster.local → 172.30.X.X
```

Depuis le même namespace, le nom court suffit :

```
mon-service → 172.30.X.X
```

#### Exemple de configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-api
  namespace: production
  labels:
    app: backend
spec:
  selector:
    app: backend
  ports:
    - name: http
      protocol: TCP
      port: 80          # Port exposé par le Service
      targetPort: 8080  # Port écouté par le conteneur
  type: ClusterIP       # Valeur par défaut (peut être omise)
```

#### Vérification

```bash
# Créer le service
oc apply -f backend-api-service.yaml

# Vérifier
oc get service backend-api -n production
# NAME          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
# backend-api   ClusterIP   172.30.47.182   <none>        80/TCP    5m

# Tester depuis un pod
oc exec -it frontend-pod -- curl http://backend-api/health
```

:::tip Quand utiliser ClusterIP
Utilisez ClusterIP pour **tout service interne** : bases de données, APIs backend, caches, services de messaging. C'est le type le plus simple et le plus sécurisé car il n'expose rien à l'extérieur du cluster.
:::

---

### 2.2 NodePort

#### Description

Le type **NodePort** étend ClusterIP en ouvrant un port sur **chaque nœud** du cluster (dans la plage 30000-32767). Le trafic arrivant sur `<IP-nœud>:<nodePort>` est redirigé vers le Service, puis réparti entre les pods.

```
Client externe → IP nœud 1:30007 ─┐
                                    ├─→ Service ClusterIP → Pods
Client externe → IP nœud 2:30007 ─┘
```

#### Exemple de configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: webapp-nodeport
  namespace: development
spec:
  selector:
    app: webapp
  ports:
    - protocol: TCP
      port: 80          # Port interne du Service
      targetPort: 8080  # Port du conteneur
      nodePort: 30080   # Port ouvert sur les nœuds (optionnel, assigné auto si omis)
  type: NodePort
```

#### Vérification

```bash
oc get service webapp-nodeport -n development
# NAME              TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
# webapp-nodeport   NodePort   172.30.88.14    <none>        80:30080/TCP   2m

# Accès depuis l'extérieur (remplacer par l'IP d'un nœud worker)
curl http://192.168.1.101:30080/
```

:::warning Limites du NodePort en production
- Le port exposé n'est **pas standard** (30000-32767), ce qui nécessite de le préciser dans les URLs ou de configurer un proxy devant.
- Si un nœud tombe, les clients pointant vers cet IP perdent la connexion jusqu'à redirection.
- Évitez NodePort en production. Préférez LoadBalancer (cloud) ou une Route OpenShift (tous environnements).
:::

---

### 2.3 LoadBalancer

#### Description

Le type **LoadBalancer** demande au fournisseur d'infrastructure (cloud ou solution bare-metal) de provisionner un load balancer externe qui obtient sa propre adresse IP publique. Le trafic est distribué depuis cette IP vers les nœuds du cluster, puis vers les pods via le mécanisme NodePort sous-jacent.

```
Internet → IP publique LB → Nœuds du cluster (NodePort) → Pods
```

#### Exemple de configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: webapp-public
  namespace: production
  annotations:
    # Annotations spécifiques au cloud provider (exemple AWS)
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  selector:
    app: webapp
  ports:
    - protocol: TCP
      port: 443
      targetPort: 8443
  type: LoadBalancer
```

#### Résultat après provisionnement

```bash
oc get service webapp-public -n production
# NAME           TYPE           CLUSTER-IP      EXTERNAL-IP                        PORT(S)         AGE
# webapp-public  LoadBalancer   172.30.15.90    a1b2c3.eu-west-1.elb.amazonaws.com 443:31205/TCP   3m
```

#### MetalLB pour les environnements on-premise

Dans les environnements sans cloud provider (bare-metal, on-premise), **MetalLB** permet d'utiliser le type LoadBalancer. MetalLB alloue des adresses IP depuis un pool configuré et les annonce via ARP (couche 2) ou BGP (couche 3).

```yaml
# Exemple de configuration MetalLB - IPAddressPool
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: production-pool
  namespace: metallb-system
spec:
  addresses:
    - 192.168.10.100-192.168.10.120
```

:::tip Quand utiliser LoadBalancer
Utilisez LoadBalancer pour exposer directement un service TCP/UDP (non HTTP) en production sur un cloud public. Pour les applications web HTTP/HTTPS, préférez les **Routes OpenShift** ou un **Ingress** qui offrent plus de contrôle sur le routage et le TLS, pour un coût infrastructure moindre.
:::

---

## 3. Visualiser les Services dans la console OpenShift

La console OpenShift Administrator permet d'inspecter et de gérer les Services directement depuis l'interface graphique, sans avoir besoin de la CLI.

![Vue console OpenShift : Services et Routes](./images/console-services-routes.svg)

*Console OpenShift — perspective Administrator > Networking > Services : liste des services avec leur type, ClusterIP, et ports associés*

### Navigation

1. Connectez-vous à la console OpenShift en mode **Administrator**.
2. Dans le menu latéral, cliquez sur **Networking** pour déplier la section.
3. Sélectionnez **Services** pour voir la liste des Services du projet courant.
4. Cliquez sur un Service pour voir ses détails : Endpoints, labels, YAML, événements.

### Informations disponibles

Depuis la vue détaillée d'un Service, vous pouvez consulter :

- La **ClusterIP** attribuée et les ports exposés.
- La liste des **Endpoints** (pods sains actuellement ciblés).
- Le **Selector** utilisé pour sélectionner les pods.
- Le YAML complet pour modification directe.

---

## 4. Les Routes dans OpenShift

### 4.1 Routes vs Ingress Kubernetes : quelle différence ?

OpenShift propose deux mécanismes pour exposer des services HTTP/HTTPS vers l'extérieur du cluster :

| Critère | Route OpenShift | Ingress Kubernetes |
|---|---|---|
| Origine | Spécifique à OpenShift | Standard Kubernetes |
| API | `route.openshift.io/v1` | `networking.k8s.io/v1` |
| Portabilité | OpenShift uniquement | Tous clusters Kubernetes |
| TLS termination | 3 modes natifs (edge, reencrypt, passthrough) | Dépend du contrôleur |
| Annotations | Riches (timeout, rate limiting, etc.) | Dépend du contrôleur |
| Wildcard | Supporté nativement | Partiel |
| Recommandé pour | Déploiements OpenShift standard | Portabilité multi-cluster |

:::info Ingress et Routes dans OpenShift
OpenShift traduit automatiquement les objets `Ingress` Kubernetes en objets `Route`. Vous pouvez donc utiliser les deux syntaxes. Cependant, pour tirer parti des fonctionnalités avancées d'OpenShift (TLS passthrough, annotations de routage), les Routes sont préférées.
:::

### 4.2 L'Ingress Controller (HAProxy Router)

L'**Ingress Controller** d'OpenShift est un pod HAProxy déployé dans le namespace `openshift-ingress`. Il :

1. Surveille en permanence les objets Route et Ingress via l'API Kubernetes.
2. Génère dynamiquement la configuration HAProxy correspondante.
3. Reçoit les connexions HTTPS/HTTP entrantes sur les ports 443 et 80.
4. Route le trafic vers le Service approprié selon le `Host` HTTP.

```bash
# Voir les pods de l'Ingress Controller
oc get pods -n openshift-ingress

# Voir la configuration de l'IngressController
oc get ingresscontroller default -n openshift-ingress-operator -o yaml
```

### 4.3 Structure d'une Route simple (HTTP)

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: webapp-route
  namespace: production
spec:
  host: webapp.apps.cluster.example.com   # Nom de domaine (optionnel, auto-généré sinon)
  to:
    kind: Service
    name: webapp-service                   # Service cible
    weight: 100
  port:
    targetPort: http                       # Port nommé du Service (ou numéro de port)
  wildcardPolicy: None
```

```bash
# Créer la route
oc apply -f webapp-route.yaml

# Voir l'URL assignée
oc get route webapp-route -n production
# NAME           HOST/PORT                                  PATH   SERVICES         PORT   TERMINATION   WILDCARD
# webapp-route   webapp.apps.cluster.example.com                  webapp-service   http   <none>        None
```

---

## 5. Modes de terminaison TLS

Lorsqu'une application doit être exposée en HTTPS, OpenShift propose trois modes de terminaison TLS, chacun répondant à des besoins de sécurité différents.

![Modes de terminaison TLS dans OpenShift](./images/slide-tls-routes.png)

*Les trois modes de terminaison TLS : Edge (déchiffrement au router), Re-encrypt (re-chiffrement vers le pod), Passthrough (TLS de bout en bout)*

### Tableau comparatif des modes TLS

| Mode | TLS client→Ingress | TLS Ingress→Pod | Certificat pod requis | Niveau de sécurité |
|---|---|---|---|---|
| **Edge** | Oui (HTTPS) | Non (HTTP en clair) | Non | Standard |
| **Re-encrypt** | Oui (HTTPS) | Oui (HTTPS) | Oui | Elevé |
| **Passthrough** | Oui (HTTPS) | Oui (HTTPS, non déchiffré) | Oui | Maximum |

---

### 5.1 Edge Termination

#### Principe

Dans le mode **Edge**, l'Ingress Controller **termine la connexion TLS** : il déchiffre le trafic HTTPS entrant, puis le retransmet **en HTTP clair** vers les pods. Le certificat TLS est géré par l'Ingress Controller.

```
Client --[HTTPS]--> Ingress Controller --[HTTP]--> Pod
                   (déchiffrement ici)
```

#### Cas d'usage

- Applications web classiques où le trafic interne au cluster est considéré comme de confiance.
- Simplification : aucun certificat à configurer côté application.
- Bonne performance (déchiffrement centralisé, une seule fois).

#### Exemple de configuration

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: webapp-edge
  namespace: production
spec:
  host: webapp.apps.cluster.example.com
  to:
    kind: Service
    name: webapp-service
  port:
    targetPort: 8080
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect  # Redirige HTTP vers HTTPS
    # Certificat personnalisé (optionnel, sinon certificat wildcard du cluster)
    certificate: |
      -----BEGIN CERTIFICATE-----
      MIIDazCCAlOgAwIBAgIU...
      -----END CERTIFICATE-----
    key: |
      -----BEGIN RSA PRIVATE KEY-----
      MIIEowIBAAKCAQEA...
      -----END RSA PRIVATE KEY-----
```

:::tip Redirection HTTP → HTTPS
Ajoutez toujours `insecureEdgeTerminationPolicy: Redirect` pour que les requêtes HTTP soient automatiquement redirigées en HTTPS. La valeur `None` laisse le HTTP fonctionner (non recommandé), et `Allow` l'accepte explicitement.
:::

---

### 5.2 Re-encrypt Termination

#### Principe

Dans le mode **Re-encrypt**, l'Ingress Controller termine la connexion TLS entrante, puis établit une **nouvelle connexion TLS chiffrée** vers les pods. Le trafic est donc chiffré sur l'ensemble du parcours, y compris à l'intérieur du cluster.

```
Client --[HTTPS]--> Ingress Controller --[HTTPS]--> Pod
                   (déchiffrement + rechiffrement)
```

#### Cas d'usage

- Environnements à conformité stricte (PCI-DSS, HIPAA, HDS) exigeant le chiffrement de bout en bout.
- Microservices exposant leurs propres certificats (mTLS).
- Lorsque le réseau interne du cluster n'est pas considéré comme de confiance.

#### Exemple de configuration

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: api-reencrypt
  namespace: production
spec:
  host: api.apps.cluster.example.com
  to:
    kind: Service
    name: api-service
  port:
    targetPort: 8443
  tls:
    termination: reencrypt
    insecureEdgeTerminationPolicy: Redirect
    # CA certificate du backend (pour valider le certificat du pod)
    destinationCACertificate: |
      -----BEGIN CERTIFICATE-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
      -----END CERTIFICATE-----
```

:::warning Certificat côté pod obligatoire
En mode Re-encrypt, le pod doit exposer une connexion HTTPS (port 8443 en général) avec un certificat valide. L'Ingress Controller vérifie ce certificat contre le `destinationCACertificate` fourni dans la Route. Sans cette CA, la connexion sera refusée.
:::

---

### 5.3 Passthrough Termination

#### Principe

Dans le mode **Passthrough**, l'Ingress Controller **ne déchiffre pas** le trafic TLS. Il transfère les flux TCP bruts directement vers le pod cible. Le pod est entièrement responsable de la gestion du TLS.

```
Client --[HTTPS]--> Ingress Controller --[HTTPS (opaque)]--> Pod
                   (aucun déchiffrement)
```

#### Cas d'usage

- Applications avec **mutual TLS (mTLS)** où les certificats clients doivent être traités par l'application elle-même.
- Protocoles non-HTTP encapsulés dans TLS (gRPC, MQTT over TLS).
- Applications gérant leur propre PKI sans vouloir l'exposer au cluster.

#### Exemple de configuration

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: grpc-passthrough
  namespace: production
spec:
  host: grpc.apps.cluster.example.com
  to:
    kind: Service
    name: grpc-service
  port:
    targetPort: 8443
  tls:
    termination: passthrough
  wildcardPolicy: None
```

:::info Passthrough et inspection
En mode Passthrough, l'Ingress Controller ne peut pas inspecter les en-têtes HTTP, appliquer des règles de routage basées sur le chemin (path-based routing), ni modifier les en-têtes. Il ne peut router que sur le nom d'hôte (SNI TLS).
:::

---

## 6. Fonctionnalités avancées des Routes

### 6.1 Routage basé sur le chemin (Path-based routing)

Plusieurs Routes peuvent partager le même domaine mais router vers des services différents selon le chemin :

```yaml
# Route pour /api
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: api-route
  namespace: production
spec:
  host: app.example.com
  path: /api
  to:
    kind: Service
    name: api-service
  tls:
    termination: edge
---
# Route pour /
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: frontend-route
  namespace: production
spec:
  host: app.example.com
  path: /
  to:
    kind: Service
    name: frontend-service
  tls:
    termination: edge
```

### 6.2 Annotations utiles

```yaml
metadata:
  annotations:
    # Timeout de connexion au backend (défaut : 30s)
    haproxy.router.openshift.io/timeout: 60s
    # Activer les sessions collantes (sticky sessions)
    haproxy.router.openshift.io/balance: source
    # Taille maximale du body (upload)
    haproxy.router.openshift.io/proxy-body-size: 100m
    # Forcer HSTS
    haproxy.router.openshift.io/hsts_header: "max-age=31536000;includeSubDomains;preload"
```

### 6.3 Partage de charge entre deux services (A/B testing)

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ab-test-route
  namespace: production
spec:
  host: webapp.apps.cluster.example.com
  to:
    kind: Service
    name: webapp-v1
    weight: 80        # 80% du trafic vers v1
  alternateBackends:
    - kind: Service
      name: webapp-v2
      weight: 20      # 20% du trafic vers v2
  tls:
    termination: edge
```

---

## 7. Gestion des Services et Routes depuis la CLI

### Commandes Services

```bash
# Créer un service à partir d'un déploiement existant
oc expose deployment webapp --port=80 --target-port=8080

# Lister les services d'un namespace
oc get services -n production

# Détail complet d'un service
oc describe service backend-api -n production

# Voir les endpoints (pods ciblés)
oc get endpoints backend-api -n production

# Supprimer un service
oc delete service backend-api -n production
```

### Commandes Routes

```bash
# Créer une route depuis un service (HTTP simple)
oc expose service webapp-service --hostname=webapp.apps.cluster.example.com

# Créer une route TLS edge
oc create route edge webapp-https \
  --service=webapp-service \
  --hostname=webapp.apps.cluster.example.com \
  --insecure-policy=Redirect

# Lister les routes
oc get routes -n production

# Voir l'URL d'une route
oc get route webapp-https -n production -o jsonpath='{.spec.host}'

# Tester la route depuis la CLI
curl -v https://webapp.apps.cluster.example.com/health
```

:::tip Créer une route TLS avec un certificat personnalisé
```bash
oc create route edge webapp-custom-tls \
  --service=webapp-service \
  --hostname=webapp.example.com \
  --cert=tls.crt \
  --key=tls.key \
  --ca-cert=ca.crt \
  --insecure-policy=Redirect
```
:::

---

## Résumé

| Concept | Points clés à retenir |
|---|---|
| **Service ClusterIP** | Accès interne uniquement, DNS stable, load balancing entre pods |
| **Service NodePort** | Accès externe via port haut (30000-32767), adapté aux tests |
| **Service LoadBalancer** | IP publique dédiée, adapté au cloud ou MetalLB on-premise |
| **Route HTTP** | Exposition externe HTTP simple, nom de domaine automatique |
| **Route TLS Edge** | HTTPS terminé par l'Ingress, pod reçoit HTTP — cas le plus courant |
| **Route TLS Re-encrypt** | Chiffrement bout en bout, conformité réglementaire |
| **Route TLS Passthrough** | Chiffrement géré par le pod, mTLS, protocoles non-HTTP |

:::info Prochaine étape
La section suivante traite de la **sécurisation des accès** dans OpenShift : RBAC, SCC (Security Context Constraints), et les bonnes pratiques pour durcir vos déploiements.
:::
