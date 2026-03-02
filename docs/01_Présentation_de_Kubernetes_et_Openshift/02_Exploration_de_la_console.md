# Exploration de la console OpenShift

## Objectif

Dans cette section, nous allons explorer la console web d'OpenShift. La console web offre une interface graphique intuitive pour gérer les ressources de votre cluster, déployer des applications, surveiller les performances et configurer les paramètres.

### Introduction à la Console Web Red Hat OpenShift

La console Web Red Hat OpenShift propose une interface graphique qui simplifie de nombreuses tâches administratives pour la gestion d'un cluster. En exploitant les API Kubernetes ainsi que les API d'extension OpenShift, cette console offre un environnement graphique performant. Bien que les menus, les tâches et les fonctionnalités de la console Web soient également accessibles via l'interface en ligne de commande, cette console rend plus aisées les tâches complexes inhérentes à l'administration du cluster.

Kubernetes dispose d'un tableau de bord Web qui n'est pas activé par défaut dans un cluster. Ce tableau de bord offre des permissions de sécurité minimales et ne prend en charge que l'authentification par tokens. De plus, il nécessite une configuration de proxy, limitant l'accès à la console Web au terminal système ayant créé le proxy. Contrairement à ces contraintes, la console Web d'OpenShift offre une expérience beaucoup plus complète.

La console Web d'OpenShift est indépendante du tableau de bord Kubernetes et constitue un outil distinct dédié à la gestion des clusters OpenShift. En outre, les opérateurs ont la possibilité d'étendre les fonctionnalités de cette console en ajoutant des menus, des vues et des formulaires supplémentaires pour simplifier encore davantage l'administration du cluster.

## Connexion a la console

Pour accéder à la console OpenShift, commencez par ouvrir votre navigateur web et rendez-vous à l'adresse suivante : [https://console-openshift-console.apps.neutron-sno-office.intraneutron.fr/](https://console-openshift-console.apps.neutron-sno-office.intraneutron.fr/). Une fois cette URL entrée, vous serez automatiquement redirigé vers la page de connexion d'OpenShift à l'adresse [https://oauth-openshift.apps.neutron-sno-office.intraneutron.fr](https://oauth-openshift.apps.neutron-sno-office.intraneutron.fr).

![Console](./images/console.png)

Cette redirection est normale et vous amène vers l'interface d'authentification sécurisée où vous pourrez vous connecter à la console OpenShift.

Sur la page de connexion, vous verrez plusieurs options de fournisseurs d'identité (Identity Providers). Dans le cadre de cette formation, vous devez utiliser "Neutron Guest Identity Management" pour vous connecter. Sélectionnez cette option, puis entrez le nom d'utilisateur et le mot de passe qui vous ont été fournis par votre formateur. Ces identifiants vous permettront d'accéder à la console et de commencer à utiliser OpenShift. Assurez-vous de garder ces informations à portée de main pour toute la durée de votre formation, car elles seront nécessaires pour toutes les sessions d'accès à la console.

![First login](./images/first_login.png)

### Différentes Perspectives de la Console Web

La console Web OpenShift propose deux modes principaux : Administrator et Developer. La disposition des menus et les fonctionnalités disponibles varient en fonction du mode sélectionné. En haut du menu latéral, un sélecteur de perspective permet de naviguer facilement entre les modes Administrator et Developer.

![First login](./images/view.png)

Chaque mode offre des pages et des catégories de menus spécifiquement conçues pour répondre aux besoins de l'utilisateur. Le mode Administrator est orienté vers la configuration, la gestion du cluster, les déploiements, et les opérations courantes. En revanche, le mode Developer se concentre sur la conception et le déploiement d'applications.

### Vue Administrateur

![Admin view](./images/admin_view.png)

Dans la console OpenShift en mode administrateur, vous avez accès à une gamme complète d'outils pour gérer et superviser efficacement votre infrastructure. Voici un aperçu des principales fonctionnalités disponibles :

* **Accueil (Home)** :
    * Tableau de bord global avec des informations sur les alertes, l'utilisation des ressources et la santé du cluster.

* **Operators** :
    * Gestion des opérateurs installés, ajout via l'OperatorHub et surveillance des mises à jour.

* **Workloads** :
    * Gestion des pods, déploiements, réplicasets, daemonsets, jobs et cron jobs.
    * Configuration des StatefulSets pour les applications d'état.

* **Networking** :
    * Configuration des routes pour les applications.
    * Gestion des services, des endpoints, des ingress et des politiques réseau.

* **Storage** :
    * Gestion des volumes persistants, des claims et des classes de stockage.
    * Surveillance de l'utilisation du stockage.

* **Builds** :
    * Surveillance et gestion des builds.
    * Configuration des stratégies de build et gestion des pipelines CI/CD.

* **Observe** :
    * Accès aux journaux des pods.
    * Surveillance des métriques et des alertes.
    * Configuration des sources de journaux.

* **Compute** :
    * Gestion des nœuds du cluster.
    * Surveillance de l'utilisation des ressources des nœuds.
    * Configuration des machines et des pools de machines.

* **User Management** :
    * Création et gestion des utilisateurs et des groupes.
    * Attribution des rôles et des permissions.
    * Configuration des fournisseurs d'identité.

* **Administration** :
    * Configuration des paramètres globaux du cluster.
    * Gestion des mises à jour du cluster.
    * Configuration des politiques de sécurité et des quotas.

### Vue Développeur

![Dev view](./images/dev_view.png)

La vue développeur de la console OpenShift est conçue pour optimiser le développement et le déploiement d'applications. Voici ce que vous pouvez faire dans cette vue :

* **Topology (Topologie)** :
    * Visualisation graphique des applications et des services.
    * Gestion des ressources et des relations entre les composants.

* **Observe** :
    * Accès aux journaux des applications.
    * Surveillance des métriques spécifiques aux projets.
    * Configuration des sources de journaux pour le débogage.

* **Search (Recherche)** :
    * Recherche de ressources spécifiques dans les projets.
    * Filtrage par type de ressource et par étiquette.
    * Accès rapide aux détails des ressources trouvées.

* **Builds** :
    * Gestion et surveillance des builds de projet.
    * Configuration des stratégies de build spécifiques au projet.
    * Visualisation des pipelines CI/CD.

* **Environments (Environnements)** :
    * Gestion des configurations d'environnement pour les applications.
    * Définition des variables d'environnement.
    * Surveillance des configurations d'environnement.

* **Helm** :
    * Accès à Helm Charts pour déployer des applications.
    * Gestion des releases Helm.
    * Surveillance des applications déployées via Helm.

* **Project (Projet)** :
    * Vue d'ensemble des ressources du projet.
    * Gestion des quotas et des limites de ressources.
    * Surveillance de l'utilisation des ressources au niveau du projet.

* **Config Maps** :
    * Création et gestion des ConfigMaps.
    * Utilisation des ConfigMaps pour stocker des configurations de données.
    * Intégration des ConfigMaps dans les applications.

* **Secrets** :
    * Création et gestion des secrets.
    * Utilisation des secrets pour stocker des informations sensibles.
    * Intégration des secrets dans les applications.

## Conclusion

La console web d'OpenShift est un outil puissant et intuitif pour gérer vos projets, déployer des applications et surveiller l'état de votre cluster. Familiarisez-vous avec ses fonctionnalités pour tirer le meilleur parti de votre environnement OpenShift. Dans la prochaine section, nous réaliserons un exercice guidé pour explorer la console en détail et effectuer des tâches courantes.
