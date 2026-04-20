---
id: Exploration_de_la_console

slug: /Présentation_de_Kubernetes_et_Openshift/Exploration_de_la_console
---
# Exploration de la console OpenShift

## Objectif

La console web d'OpenShift est l'interface graphique principale pour interagir avec votre cluster. Elle permet de gérer les ressources, déployer des applications, surveiller les performances et configurer l'infrastructure - le tout sans quitter votre navigateur. Cette section vous guide à travers les différentes zones de la console et vous prépare à naviguer efficacement dans votre environnement de travail.

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

:::info Depuis OpenShift 4.17, la console ne propose plus qu'une seule perspective unifiée : **Administrator**. L'ancienne perspective Developer a été supprimée.
:::

La console est organisée en deux grandes zones :

| Zone | Description |
|------|-------------|
| **Barre de navigation latérale gauche** | Accès à toutes les sections de la console |
| **Zone de contenu principale** | Affichage des ressources, formulaires et tableaux de bord |
| **Barre supérieure** | Notifications, accès au terminal web, profil utilisateur |

---

## La perspective Administrator

Depuis OpenShift 4.17, la console ne dispose plus que d'une seule perspective : **Administrator**. Cette perspective unifiée couvre à la fois les besoins des administrateurs de cluster et ceux des développeurs qui déploient et gèrent des applications.

| Perspective | Description |
|------------|-------------|
| **Administrator** | Interface unifiée pour la gestion de l'infrastructure, le déploiement d'applications, la sécurité et l'observabilité |

La perspective Administrator donne accès à l'ensemble des ressources du cluster. Voici les sections principales :

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

## Navigation rapide

Voici un récapitulatif des sections les plus utiles dans la console Administrator :

| Action | Chemin dans la console |
|--------|------------------------|
| Voir tous les pods | Workloads > Pods |
| Créer un déploiement | Workloads > Deployments > Create Deployment |
| Voir les logs d'un pod | Workloads > Pods > [pod] > Logs |
| Exposer une application | Networking > Routes |
| Créer un PVC | Storage > PersistentVolumeClaims |
| Voir les métriques | Observe > Metrics |
| Gérer les utilisateurs | User Management > Users |
| Accéder au terminal d'un pod | Workloads > Pods > [pod] > Terminal |
| Voir les événements | Home > Events |
| Gérer les namespaces | Administration > Namespaces |

:::info Raccourci clavier
La console OpenShift intègre une barre de recherche globale accessible avec le raccourci **Ctrl+K** (ou **Cmd+K** sur Mac). Elle permet de rechercher n'importe quelle ressource par nom, type ou namespace sans naviguer dans les menus.
:::

---

## Conclusion

La console web d'OpenShift est un outil puissant qui centralise la gestion du cluster, le déploiement des applications et la supervision des ressources. Depuis OpenShift 4.17, la perspective unique **Administrator** offre une interface unifiée adaptée à tous les profils, des administrateurs cluster aux développeurs. Dans la prochaine section, vous réaliserez un exercice guidé pour explorer la console en autonomie.
