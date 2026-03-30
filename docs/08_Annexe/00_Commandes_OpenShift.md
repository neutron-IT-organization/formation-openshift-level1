# Référence rapide — Commandes OpenShift & Kubernetes

Toutes les commandes utiles pour naviguer dans le cluster tout au long de la formation.

---

## Connexion et contexte

```bash
# Se connecter au cluster
oc login https://<api-url>:6443 -u <user> -p <password>

# Voir l'utilisateur courant
oc whoami

# Voir le projet (namespace) actif
oc project

# Changer de projet
oc project <nom-du-projet>

# Lister tous les projets accessibles
oc get projects

# Créer un projet
oc new-project <nom>

# Afficher les infos du cluster
oc cluster-info
```

---

## Pods

```bash
# Lister les pods du projet courant
oc get pods

# Lister avec plus de détails (nœud, IP, age)
oc get pods -o wide

# Suivre les logs d'un pod
oc logs <pod-name>

# Suivre en temps réel
oc logs -f <pod-name>

# Logs d'un conteneur spécifique (pod multi-conteneurs)
oc logs <pod-name> -c <container-name>

# Ouvrir un shell dans un pod
oc exec -it <pod-name> -- /bin/bash
oc exec -it <pod-name> -- /bin/sh

# Exécuter une commande sans shell interactif
oc exec <pod-name> -- env

# Décrire un pod (events, state, conditions)
oc describe pod <pod-name>

# Supprimer un pod (le Deployment en recrée un)
oc delete pod <pod-name>

# Supprimer tous les pods d'un label
oc delete pods -l app=<label>

# Voir les events du namespace
oc get events --sort-by='.lastTimestamp'
```

---

## Deployments

```bash
# Lister les deployments
oc get deployments
oc get deploy

# Détails d'un deployment
oc describe deployment <name>

# Créer depuis un fichier YAML
oc apply -f deployment.yaml

# Modifier un deployment
oc edit deployment <name>

# Scaler (changer le nombre de réplicas)
oc scale deployment <name> --replicas=3

# Voir le statut du rollout
oc rollout status deployment/<name>

# Historique des révisions
oc rollout history deployment/<name>

# Rollback vers la révision précédente
oc rollout undo deployment/<name>

# Rollback vers une révision spécifique
oc rollout undo deployment/<name> --to-revision=2

# Mettre à jour l'image d'un conteneur
oc set image deployment/<name> <container>=<new-image>

# Redémarrer tous les pods d'un deployment
oc rollout restart deployment/<name>

# Supprimer un deployment
oc delete deployment <name>
```

---

## Services

```bash
# Lister les services
oc get services
oc get svc

# Détails d'un service
oc describe service <name>

# Créer un service depuis un fichier YAML
oc apply -f service.yaml

# Exposer un deployment en service ClusterIP
oc expose deployment <name> --port=<port>

# Supprimer un service
oc delete service <name>
```

---

## Routes (OpenShift)

```bash
# Lister les routes
oc get routes

# Créer une route HTTP depuis un service
oc expose service <service-name>

# Voir l'URL d'une route
oc get route <name> -o jsonpath='{.spec.host}'

# Créer une route HTTPS edge
oc create route edge <name> --service=<service-name> --port=<port>

# Détails d'une route
oc describe route <name>

# Supprimer une route
oc delete route <name>
```

---

## StatefulSets

```bash
# Lister les statefulsets
oc get statefulsets
oc get sts

# Scaler un StatefulSet
oc scale statefulset <name> --replicas=3

# Détails
oc describe statefulset <name>
```

---

## DaemonSets

```bash
# Lister les daemonsets
oc get daemonsets
oc get ds

# Détails
oc describe daemonset <name>
```

---

## ConfigMaps

```bash
# Lister les configmaps
oc get configmaps
oc get cm

# Voir le contenu d'un configmap
oc get configmap <name> -o yaml

# Créer un configmap depuis un fichier
oc create configmap <name> --from-file=<fichier>

# Créer un configmap depuis des valeurs littérales
oc create configmap <name> --from-literal=cle=valeur

# Modifier
oc edit configmap <name>

# Supprimer
oc delete configmap <name>
```

---

## Secrets

```bash
# Lister les secrets
oc get secrets

# Voir un secret (encodé en base64)
oc get secret <name> -o yaml

# Décoder une valeur
oc get secret <name> -o jsonpath='{.data.<cle>}' | base64 -d

# Créer un secret générique
oc create secret generic <name> --from-literal=user=admin --from-literal=password=secret

# Créer depuis un fichier
oc create secret generic <name> --from-file=<fichier>

# Supprimer
oc delete secret <name>
```

---

## Stockage (PV / PVC)

```bash
# Lister les PersistentVolumeClaims
oc get pvc

# Détails d'un PVC
oc describe pvc <name>

# Lister les PersistentVolumes (ressource cluster)
oc get pv

# Lister les StorageClasses
oc get storageclass
oc get sc

# Créer un PVC depuis un fichier
oc apply -f pvc.yaml

# Supprimer un PVC (attention : supprime les données si ReclaimPolicy=Delete)
oc delete pvc <name>
```

---

## Ressources et Quotas

```bash
# Voir les ResourceQuotas du namespace
oc get resourcequota
oc describe resourcequota

# Voir les LimitRanges
oc get limitrange
oc describe limitrange

# Voir la consommation CPU/mémoire des pods
oc adm top pods

# Voir la consommation des nœuds
oc adm top nodes
```

---

## HorizontalPodAutoscaler (HPA)

```bash
# Créer un HPA
oc autoscale deployment <name> --min=2 --max=10 --cpu-percent=70

# Lister les HPA
oc get hpa

# Voir le détail (métriques actuelles vs cibles)
oc describe hpa <name>

# Supprimer
oc delete hpa <name>
```

---

## RBAC — Utilisateurs et Permissions

```bash
# Lister les utilisateurs (admin seulement)
oc get users

# Voir les groupes
oc get groups

# Ajouter un rôle à un utilisateur dans un namespace
oc adm policy add-role-to-user <role> <user> -n <namespace>

# Exemples de rôles : admin, edit, view
oc adm policy add-role-to-user admin paris-user -n paris-user-ns
oc adm policy add-role-to-user view paris-user -n shared-workloads

# Supprimer un rôle
oc adm policy remove-role-from-user <role> <user> -n <namespace>

# Lister les RoleBindings d'un namespace
oc get rolebindings -n <namespace>

# Ajouter un ClusterRole à un utilisateur
oc adm policy add-cluster-role-to-user <cluster-role> <user>

# Voir les droits d'un utilisateur
oc auth can-i get pods --as=<user> -n <namespace>
```

---

## Nœuds (Nodes)

```bash
# Lister les nœuds
oc get nodes

# Voir les détails d'un nœud (taints, labels, conditions)
oc describe node <name>

# Voir les pods sur un nœud
oc adm drain <node> --ignore-daemonsets --delete-emptydir-data

# Marquer un nœud comme non schedulable (maintenance)
oc adm cordon <node>

# Remettre un nœud en service
oc adm uncordon <node>

# Ajouter un label à un nœud
oc label node <node> <key>=<value>

# Ajouter un taint à un nœud
oc adm taint node <node> <key>=<value>:NoSchedule
```

---

## Namespaces / Projets

```bash
# Lister les namespaces
oc get namespaces
oc get ns

# Créer un namespace
oc create namespace <name>

# Supprimer un namespace (supprime TOUT ce qu'il contient)
oc delete namespace <name>

# Voir les ressources de tous les namespaces
oc get pods --all-namespaces
oc get pods -A
```

---

## Débogage

```bash
# Lancer un pod de débogage sur un nœud
oc debug node/<node-name>

# Lancer un pod de débogage depuis une image
oc debug -t deployment/<name>

# Voir les events récents (erreurs, scheduling...)
oc get events -n <namespace> --sort-by='.lastTimestamp' | tail -20

# Voir les conditions d'un pod
oc get pod <name> -o jsonpath='{.status.conditions}'

# Décrire toutes les ressources d'un namespace
oc get all -n <namespace>

# Vérifier la config réseau d'un pod
oc exec <pod> -- cat /etc/resolv.conf
oc exec <pod> -- curl -v http://<service-name>:<port>
```

---

## Requêtes avancées (jsonpath / output)

```bash
# Sortie YAML complète
oc get deployment <name> -o yaml

# Sortie JSON
oc get pod <name> -o json

# Extraire un champ précis (jsonpath)
oc get pod <name> -o jsonpath='{.status.podIP}'
oc get pods -o jsonpath='{.items[*].metadata.name}'

# Format tableau personnalisé
oc get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName

# Filtrer par label
oc get pods -l app=welcome-app
oc get pods -l app=welcome-app,env=prod
```

---

## Monitoring et Métriques

```bash
# Voir l'état des cluster operators
oc get clusteroperators
oc get co

# Voir la version du cluster
oc get clusterversion

# Voir les alertes actives
oc get prometheusrule -n openshift-monitoring

# Accéder à la console Prometheus
oc get route -n openshift-monitoring | grep prometheus

# Accéder à Alertmanager
oc get route -n openshift-monitoring | grep alertmanager
```

---

## Mises à jour du cluster

```bash
# Voir la version courante et les mises à jour disponibles
oc get clusterversion

# Voir le canal actif
oc get clusterversion -o jsonpath='{.items[0].spec.channel}'

# Changer de canal
oc patch clusterversion version --type=merge -p '{"spec":{"channel":"stable-4.14"}}'

# Déclencher une mise à jour
oc adm upgrade --to=<version>

# Voir le statut de la mise à jour en cours
oc get clusterversion
oc get clusteroperators | grep -v True

# Voir les nœuds en cours de mise à jour
oc get nodes
oc get machineconfigpool
```

---

## MachineSets et Machines

```bash
# Lister les MachineSets
oc get machinesets -n openshift-machine-api

# Voir les Machines
oc get machines -n openshift-machine-api

# Scaler un MachineSet (ajouter/retirer des workers)
oc scale machineset <name> --replicas=3 -n openshift-machine-api

# Voir les MachineConfigs
oc get machineconfig

# Voir les MachineConfigPools (état de rollout de la config)
oc get machineconfigpool
```

---

## Commandes utiles au quotidien

```bash
# Voir toutes les ressources disponibles dans l'API
oc api-resources

# Voir la définition d'une ressource
oc explain deployment
oc explain deployment.spec.template.spec.containers

# Appliquer un fichier YAML (créer ou mettre à jour)
oc apply -f fichier.yaml

# Appliquer tout un dossier
oc apply -f ./manifests/

# Tester un apply sans l'exécuter (dry-run)
oc apply -f fichier.yaml --dry-run=client

# Comparer l'état actuel vs le fichier (diff)
oc diff -f fichier.yaml

# Supprimer les ressources définies dans un fichier
oc delete -f fichier.yaml

# Attendre qu'un deployment soit ready
oc rollout status deployment/<name> --timeout=120s

# Copier des fichiers vers/depuis un pod
oc cp fichier.txt <pod>:/tmp/
oc cp <pod>:/tmp/fichier.txt ./local/
```
