# Exploration de la console OpenShift

## Objectif

La console web d'OpenShift est l'interface graphique principale pour interagir avec votre cluster. Elle permet de gérer les ressources, déployer des applications, surveiller les performances et configurer l'infrastructure — le tout sans quitter votre navigateur. Cette section vous guide à travers les différentes zones de la console et vous prépare à naviguer efficacement dans votre environnement de travail.

:::info Console web vs ligne de commande
Toutes les actions réalisables dans la console sont également disponibles via `oc` en ligne de commande. Dans cette formation, nous utiliserons les deux. La console est idéale pour visualiser et explorer ; la ligne de commande est plus efficace pour automatiser et scripter.
:::

---

## Connexion à la console

### Accéder à l'interface

Ouvrez votre navigateur et rendez-vous à l'adresse suivante :

**[https://console-openshift-console.apps.neutron-sno-office.neutron-it.fr/](https://console-openshift-console.apps.neutron-sno-office.neutron-it.fr/)**

Vous serez automatiquement redirigé vers la page d'authentification OAuth d'OpenShift. Cette redirection est normale et sécurisée.

![Page de connexion de la console OpenShift](/img/screenshots/login_selector.png)

*Page de connexion OpenShift : sélectionnez votre fournisseur d'identité pour vous authentifier.*

### Choisir le fournisseur d'identité

Sur la page de connexion, plusieurs fournisseurs d'identité (Identity Providers) peuvent être proposés. Pour cette formation, sélectionnez **"Neutron Guest Identity Management"**, puis entrez :

- **Nom d'utilisateur** : le nom de votre ville suivi de `-user` (ex: `paris-user`)
- **Mot de passe** : fourni par le formateur

:::tip Conservation des identifiants
Notez vos identifiants quelque part d'accessible. Vous en aurez besoin à chaque fois que votre session expire, ainsi que pour la connexion via `oc` en ligne de commande.
:::

:::warning Session et expiration
Les sessions OpenShift expirent après un certain délai d'inactivité. Si vous êtes redirigé vers la page de connexion en cours d'exercice, reconnectez-vous simplement avec vos identifiants.
:::

---

## Vue d'ensemble de la console

Une fois connecté, vous arrivez sur le tableau de bord principal de la console OpenShift.

![Vue d'ensemble de la console OpenShift](/img/screenshots/dashboard.png)

*Tableau de bord principal : accès rapide aux ressources, alertes et état du cluster.*

La console est organisée en deux grandes zones :

| Zone | Description |
|------|-------------|
| **Barre de navigation latérale gauche** | Accès à toutes les sections de la console selon la perspective active |
| **Zone de contenu principale** | Affichage des ressources, formulaires et tableaux de bord |
| **Barre supérieure** | Sélecteur de perspective, notifications, accès au terminal web, profil utilisateur |

:::info Sélecteur de perspective
En haut du menu latéral gauche se trouve un sélecteur de **perspective**. Ce sélecteur permet de basculer entre la vue **Administrator** et la vue **Developer**. La disposition des menus change complètement selon la perspective choisie.
:::

---

## Les deux perspectives de la console

### Basculer entre les perspectives

La console OpenShift propose deux modes principaux, accessibles via le sélecteur en haut du menu latéral :

| Perspective | Public cible | Orientation |
|------------|--------------|-------------|
| **Administrator** | Administrateurs cluster, ops | Gestion de l'infrastructure, des nœuds, de la sécurité |
| **Developer** | Développeurs, DevOps | Déploiement et suivi des applications |

---

## Perspective Administrateur

La perspective Administrateur donne accès à l'ensemble des ressources du cluster. Voici les sections principales :

### Accueil (Home)

Le tableau de bord global affiche :
- L'état de santé du cluster (alertes actives, erreurs)
- L'utilisation globale des ressources CPU et mémoire
- Les événements récents sur le cluster
- Les liens rapides vers les sections fréquemment utilisées

### Workloads

Section centrale pour la gestion des charges de travail applicatives :

| Ressource | Description |
|-----------|-------------|
| Pods | Unités d'exécution de base, chaque pod contient un ou plusieurs conteneurs |
| Deployments | Gestion déclarative du déploiement et du cycle de vie des pods |
| ReplicaSets | Garantie qu'un nombre défini de pods est en cours d'exécution |
| StatefulSets | Pour les applications stateful nécessitant des identités stables |
| DaemonSets | Un pod par nœud (agents de monitoring, collecteurs de logs) |
| Jobs / CronJobs | Tâches ponctuelles ou planifiées |

### Networking

Configuration de la connectivité réseau des applications :

- **Services** : point d'accès stable vers un ensemble de pods
- **Routes** : exposition des services vers l'extérieur du cluster avec URL publique
- **Ingress** : alternative standard Kubernetes pour l'exposition HTTP
- **NetworkPolicies** : règles de pare-feu entre namespaces et pods

### Storage

Gestion du stockage persistant :

- **PersistentVolumes (PV)** : volumes de stockage disponibles sur le cluster
- **PersistentVolumeClaims (PVC)** : demandes de stockage par les applications
- **StorageClasses** : définition des types de stockage disponibles (SSD, HDD, NFS…)

### Observe

Observabilité et supervision :

- **Metrics** : graphiques de consommation CPU, mémoire, réseau
- **Alerts** : règles d'alerte Prometheus et alertes actives
- **Logs** : accès aux journaux des pods directement depuis la console

### Compute

Gestion des nœuds d'infrastructure :

- **Nodes** : liste et état des nœuds du cluster
- **MachineSets** : groupes de machines permettant le scaling de l'infrastructure
- **Machines** : représentation individuelle des machines du cluster

### User Management

Gestion des identités et des permissions :

- **Users / Groups** : création et gestion des utilisateurs et groupes
- **RoleBindings** : attribution de rôles à des utilisateurs ou groupes
- **ServiceAccounts** : comptes de service pour les applications

### Operators

Gestion des opérateurs Kubernetes :

- **OperatorHub** : catalogue d'opérateurs certifiés disponibles à l'installation
- **Installed Operators** : opérateurs actuellement déployés sur le cluster
- **Operator conditions** : état de santé des opérateurs installés

### Administration

Configuration globale du cluster :

- **Cluster Settings** : version du cluster, canal de mise à jour
- **Namespaces** : liste et gestion de tous les namespaces
- **Resource Quotas** : limites de ressources par namespace
- **Limit Ranges** : limites par pod et par conteneur
- **CustomResourceDefinitions (CRD)** : types de ressources personnalisés

---

## Perspective Développeur

La perspective Developer est conçue pour les développeurs qui déploient et surveillent des applications. Elle est plus simple et plus visuelle que la perspective administrateur.

![Vue Développeur — Topology](/img/screenshots/topology_active.png)

*Vue Topology en perspective Developer : visualisation graphique des applications et de leurs relations.*

### Topology (Topologie)

La vue Topology est la fonctionnalité phare de la perspective Developer. Elle affiche une représentation graphique de toutes les ressources déployées dans un projet :

- Chaque application est représentée par un nœud visuel
- Les relations entre services sont matérialisées par des liens
- Le statut de chaque déploiement (running, failed, building) est indiqué visuellement
- Un clic sur un nœud ouvre un panneau latéral avec les détails et les actions disponibles

:::tip Déploiement depuis la Topology
Depuis la vue Topology, il est possible d'ajouter de nouvelles applications directement en cliquant sur le bouton **"+ Add"**. OpenShift propose plusieurs méthodes : depuis Git, depuis une image existante, depuis le catalogue, ou via un fichier YAML.
:::

### Observe (Développeur)

Version allégée de l'observabilité, centrée sur le projet courant :

- Métriques CPU et mémoire des pods du projet
- Logs des conteneurs en temps réel
- Événements du namespace

### Builds

Gestion des builds spécifiques au projet :

- Suivi des builds en cours et de leur historique
- Configuration des BuildConfigs (source, stratégie, déclencheurs)
- Visualisation des pipelines Tekton

### Helm

Déploiement d'applications via Helm Charts :

- Accès au catalogue de charts disponibles
- Installation et configuration de releases Helm
- Suivi et mise à jour des applications déployées via Helm

### Project

Vue de gestion du projet courant :

- Quotas et limites de ressources
- Membres du projet et leurs rôles
- Labels et annotations du namespace

---

## Navigation rapide

Voici un récapitulatif des sections les plus utiles selon votre rôle :

| Action | Perspective | Chemin dans la console |
|--------|------------|------------------------|
| Voir tous les pods | Administrator | Workloads > Pods |
| Créer un déploiement | Developer | +Add > Import from Git |
| Visualiser l'architecture | Developer | Topology |
| Voir les logs d'un pod | Administrator ou Developer | Workloads > Pods > [pod] > Logs |
| Exposer une application | Administrator | Networking > Routes |
| Créer un PVC | Administrator | Storage > PersistentVolumeClaims |
| Voir les métriques | Administrator | Observe > Metrics |
| Gérer les utilisateurs | Administrator | User Management > Users |
| Accéder au terminal d'un pod | Administrator | Workloads > Pods > [pod] > Terminal |
| Voir les événements | Administrator | Home > Events |

:::info Raccourci clavier
La console OpenShift intègre une barre de recherche globale accessible avec le raccourci **Ctrl+K** (ou **Cmd+K** sur Mac). Elle permet de rechercher n'importe quelle ressource par nom, type ou namespace sans naviguer dans les menus.
:::

---

## Conclusion

La console web d'OpenShift est un outil puissant qui centralise la gestion du cluster, le déploiement des applications et la supervision des ressources. La distinction entre perspective Administrator et perspective Developer vous permet de toujours avoir une interface adaptée à votre contexte de travail. Dans la prochaine section, vous réaliserez un exercice guidé pour explorer la console en autonomie.
