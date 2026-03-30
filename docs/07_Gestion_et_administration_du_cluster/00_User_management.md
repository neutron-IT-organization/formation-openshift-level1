# Gestion des Utilisateurs et des Autorisations avec RBAC

## Introduction

La gestion des accès est l'un des piliers de la sécurité d'un cluster OpenShift. Sans un contrôle rigoureux des droits, n'importe quel utilisateur pourrait modifier, supprimer ou créer des ressources critiques. OpenShift implémente le **contrôle d'accès basé sur les rôles** (RBAC — Role-Based Access Control), hérité de Kubernetes et enrichi de fonctionnalités propres à la plateforme.

Ce chapitre couvre :
- les concepts fondamentaux du RBAC (règles, rôles, bindings),
- les types d'utilisateurs et les fournisseurs d'identité,
- la gestion des utilisateurs via la console et la CLI,
- les cas d'usage courants avec des exemples YAML.

---

## Fournisseurs d'Identité (Identity Providers)

Avant de pouvoir attribuer des rôles, il faut que les utilisateurs puissent s'authentifier. OpenShift délègue l'authentification à des **fournisseurs d'identité** (Identity Providers ou IdP). Par défaut, un cluster fraîchement installé ne dispose d'aucun utilisateur standard — seul le compte `kubeadmin` temporaire est présent.

### Le fournisseur htpasswd

Le fournisseur **htpasswd** est le plus simple à configurer. Il repose sur un fichier contenant des paires `nom:mot_de_passe_haché` au format Apache htpasswd.

**Etape 1 — Créer le fichier htpasswd :**

```bash
# Créer le fichier avec un premier utilisateur
htpasswd -c -B -b /tmp/htpasswd paris-user MonMotDePasse!

# Ajouter d'autres utilisateurs
htpasswd -B -b /tmp/htpasswd prague-user AutreMotDePasse!
htpasswd -B -b /tmp/htpasswd admin AdminPassword!
```

**Etape 2 — Créer un Secret OpenShift à partir de ce fichier :**

```bash
oc create secret generic htpasswd-secret \
  --from-file=htpasswd=/tmp/htpasswd \
  -n openshift-config
```

**Etape 3 — Configurer l'OAuth du cluster pour utiliser ce Secret :**

```yaml
apiVersion: config.openshift.io/v1
kind: OAuth
metadata:
  name: cluster
spec:
  identityProviders:
    - name: htpasswd_provider
      mappingMethod: claim
      type: HTPasswd
      htpasswd:
        fileData:
          name: htpasswd-secret
```

```bash
oc apply -f oauth-htpasswd.yaml
```

:::info Redémarrage des pods OAuth
Après application de la configuration OAuth, les pods du namespace `openshift-authentication` redémarrent automatiquement. Attendez environ 1 à 2 minutes avant de tester la connexion.
:::

:::tip Autres fournisseurs supportés
OpenShift supporte également LDAP, Active Directory, GitHub, GitLab, Google OAuth et OpenID Connect. Le fournisseur htpasswd est recommandé pour les environnements de formation et de développement.
:::

---

## Types d'Utilisateurs dans OpenShift

OpenShift distingue trois grandes catégories d'utilisateurs :

| Type | Description | Exemple |
|------|-------------|---------|
| **Utilisateurs standard** | Personnes physiques qui interagissent avec le cluster | `paris-user`, `admin` |
| **Utilisateurs système** | Comptes internes créés automatiquement par OpenShift | `system:admin`, `system:node:worker-1` |
| **Comptes de service** | Identités utilisées par les applications et les pods | `system:serviceaccount:myapp:default` |

:::note Compte kubeadmin
Le compte `kubeadmin` est un compte d'administration temporaire créé lors de l'installation. Il est recommandé de le supprimer après avoir configuré un fournisseur d'identité et attribué le rôle `cluster-admin` à un utilisateur permanent.
```bash
oc delete secret kubeadmin -n kube-system
```
:::

---

## Le Contrôle d'Accès Basé sur les Rôles (RBAC)

### Concepts fondamentaux

Le RBAC repose sur trois concepts imbriqués :

1. **Les règles (Rules)** : définissent quelles actions (`verbs`) sont autorisées sur quelles ressources (`resources`) dans quels groupes d'API (`apiGroups`).
2. **Les rôles (Roles / ClusterRoles)** : regroupent un ensemble de règles en une unité cohérente.
3. **Les bindings (RoleBindings / ClusterRoleBindings)** : associent un rôle à un ou plusieurs sujets (utilisateurs, groupes, comptes de service).

![Diagramme RBAC dans OpenShift](./images/slide-rbac.png)

*Vue d'ensemble de l'architecture RBAC dans OpenShift : les sujets (utilisateurs, groupes, service accounts) obtiennent des permissions via des bindings qui les associent à des rôles.*

### Les quatre objets RBAC

| Objet | Portée | Description |
|-------|--------|-------------|
| **Role** | Namespace | Définit des permissions limitées à un namespace donné |
| **ClusterRole** | Cluster entier | Définit des permissions valables dans tous les namespaces (ou sur des ressources globales) |
| **RoleBinding** | Namespace | Associe un Role ou un ClusterRole à un sujet dans un namespace donné |
| **ClusterRoleBinding** | Cluster entier | Associe un ClusterRole à un sujet sur l'ensemble du cluster |

![Concepts RBAC — Roles et Bindings](./images/rbac-diagram.svg)

*Schéma conceptuel : la différence entre Role/RoleBinding (portée namespace) et ClusterRole/ClusterRoleBinding (portée cluster).*

:::info Règle de priorité
Un `ClusterRoleBinding` confère des permissions sur l'intégralité du cluster. Un `RoleBinding` qui référence un `ClusterRole` ne confère ces permissions que dans le namespace où le binding est créé. C'est une façon d'utiliser un rôle commun tout en limitant sa portée.
:::

---

## Rôles Intégrés dans OpenShift

OpenShift fournit un ensemble de rôles préconfigurés couvrant les besoins les plus courants.

### Rôles de projet (namespace-scoped)

| Rôle | Description | Cas d'usage |
|------|-------------|-------------|
| `admin` | Gestion complète des ressources du projet, y compris les droits d'accès | Chef de projet, lead technique |
| `edit` | Création, modification et suppression des ressources applicatives (Deployments, Services, etc.) | Développeur |
| `view` | Lecture seule sur toutes les ressources du projet | Auditeur, observateur |
| `basic-user` | Accès minimal en lecture à quelques ressources | Utilisateur découverte |

### Rôles de cluster (cluster-scoped)

| Rôle | Description | Cas d'usage |
|------|-------------|-------------|
| `cluster-admin` | Superadministrateur — accès total à toutes les ressources | Administrateur plateforme |
| `cluster-reader` | Lecture seule sur toutes les ressources du cluster | Auditeur de sécurité |
| `self-provisioner` | Permet à l'utilisateur de créer ses propres projets | Développeurs en mode autonome |

:::warning Utilisation de cluster-admin
Le rôle `cluster-admin` doit être attribué avec la plus grande parcimonie. Un utilisateur `cluster-admin` peut modifier ou supprimer n'importe quelle ressource du cluster, y compris les composants système critiques.
:::

---

## Gestion des Rôles via la Console Web

La console OpenShift permet de gérer les utilisateurs, groupes et bindings de manière visuelle. L'interface se trouve dans la section **User Management** du menu latéral.

![Console OpenShift — User Management > Users](./images/console-user-management.svg)

*Vue "Users" dans la console OpenShift : liste des utilisateurs avec leur fournisseur d'identité et leur date de création. Le bouton "Create User" permet d'ajouter de nouveaux comptes.*

Depuis cette interface, il est possible de :
- consulter la liste des utilisateurs et leur fournisseur d'identité,
- accéder aux **Role Bindings** d'un utilisateur spécifique,
- créer ou supprimer des **Role Bindings** et **Cluster Role Bindings** via un formulaire graphique.

---

## Gestion des Rôles via la CLI (`oc`)

### Ajouter un rôle de cluster à un utilisateur

```bash
# Syntaxe générale
oc adm policy add-cluster-role-to-user <cluster-role> <username>

# Exemple : attribuer cluster-admin à l'utilisateur "admin"
oc adm policy add-cluster-role-to-user cluster-admin admin
```

### Révoquer un rôle de cluster

```bash
# Syntaxe générale
oc adm policy remove-cluster-role-from-user <cluster-role> <username>

# Exemple : révoquer cluster-admin
oc adm policy remove-cluster-role-from-user cluster-admin admin
```

### Ajouter un rôle local dans un projet

```bash
# Syntaxe générale
oc policy add-role-to-user <role> <username> -n <namespace>

# Exemple : donner le rôle "edit" à prague-user dans le projet "webapp"
oc policy add-role-to-user edit prague-user -n webapp
```

### Vérifier qui peut effectuer une action

```bash
# Qui peut supprimer des utilisateurs ?
oc adm policy who-can delete user

# Qui peut créer des deployments dans le namespace "webapp" ?
oc adm policy who-can create deployments -n webapp
```

### Vérifier les droits de l'utilisateur courant

```bash
# Lister toutes les actions autorisées pour l'utilisateur connecté
oc auth can-i --list

# Vérifier une action spécifique
oc auth can-i create pods -n webapp
```

---

## Créer un RoleBinding manuellement (YAML)

Plutôt que d'utiliser les commandes `oc policy`, il est possible de déclarer les bindings sous forme de manifestes YAML, ce qui est recommandé pour une gestion via GitOps.

### RoleBinding dans un namespace

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: paris-user-edit-webapp
  namespace: webapp
subjects:
  - kind: User
    name: paris-user
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role        # ou ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

```bash
oc apply -f rolebinding-paris-user.yaml
```

### ClusterRoleBinding pour un accès global

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-reader-prague-user
subjects:
  - kind: User
    name: prague-user
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-reader
  apiGroup: rbac.authorization.k8s.io
```

### Binding pour un groupe d'utilisateurs

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-team-edit
  namespace: webapp
subjects:
  - kind: Group
    name: dev-team
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

:::tip Groupes et LDAP
Lorsque l'authentification est basée sur LDAP ou Active Directory, les utilisateurs héritent automatiquement des groupes LDAP, et les bindings créés sur ces groupes s'appliquent sans intervention manuelle.
:::

---

## Créer un Rôle Personnalisé

Lorsque les rôles intégrés ne correspondent pas exactement aux besoins (trop permissifs ou trop restrictifs), il est possible de créer un rôle sur mesure.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: webapp
rules:
  - apiGroups: [""]          # "" désigne l'API core
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list"]
```

Les `verbs` disponibles dans Kubernetes/OpenShift sont :

| Verb | Action |
|------|--------|
| `get` | Lire une ressource par son nom |
| `list` | Lister toutes les ressources d'un type |
| `watch` | Observer les changements en temps réel |
| `create` | Créer une nouvelle ressource |
| `update` | Modifier une ressource existante |
| `patch` | Appliquer un patch partiel |
| `delete` | Supprimer une ressource |
| `deletecollection` | Supprimer un ensemble de ressources |

---

## Bonnes Pratiques RBAC

1. **Principe du moindre privilège** : n'attribuez que les permissions strictement nécessaires. Commencez par `view` ou `edit`, et escaladez seulement si nécessaire.
2. **Préférez les groupes aux utilisateurs individuels** : un binding sur un groupe est plus facile à maintenir qu'une dizaine de bindings individuels.
3. **Auditez régulièrement** : utilisez `oc get rolebindings,clusterrolebindings --all-namespaces` pour lister tous les bindings et détecter des accès excessifs.
4. **Utilisez des manifestes YAML versionnés** : gérez vos bindings dans un dépôt Git pour garder une traçabilité complète des changements.
5. **Supprimez kubeadmin** : une fois votre IdP configuré et votre premier `cluster-admin` créé, supprimez le compte `kubeadmin` temporaire.

:::warning Ne pas confondre "admin" et "cluster-admin"
Le rôle `admin` est un rôle de projet : il donne un contrôle total sur un namespace, mais rien en dehors. Le rôle `cluster-admin` donne un accès total à l'intégralité du cluster. Ne les confondez pas lors de l'attribution.
:::
