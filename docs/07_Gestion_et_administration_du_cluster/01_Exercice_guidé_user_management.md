---
slug: /Gestion_et_administration_du_cluster/Exercice_guidé_user_management
---
# Exercice Guidé : RBAC et Service Accounts

## Ce que vous allez apprendre

Dans cet exercice, vous allez explorer le système de contrôle d'accès d'OpenShift depuis l'intérieur de votre namespace :
1. **Inspecter vos propres droits** RBAC avec `oc auth can-i`
2. **Créer un Role** personnalisé qui limite les permissions
3. **Créer un Service Account** — une identité pour une application
4. **Associer le Role au Service Account** via un RoleBinding
5. **Vérifier** que le Service Account a exactement les permissions attendues

---

:::tip Terminal web OpenShift
Toutes les commandes `oc` de cet exercice sont à exécuter dans le **terminal web OpenShift**. Cliquez sur l'icône de terminal en haut à droite de la console pour l'ouvrir.

![Icône du terminal web](/img/screenshots/web_terminal_icon.png)
:::

## Objectifs

- [ ] Inspecter ses propres droits RBAC dans le namespace
- [ ] Créer un **Role** personnalisé avec des permissions limitées
- [ ] Créer un **Service Account** dédié à une application
- [ ] Créer un **RoleBinding** pour associer le Role au Service Account
- [ ] Vérifier les permissions du Service Account avec `oc auth can-i`
- [ ] Lancer un pod utilisant ce Service Account et tester ses accès

---

## Étape 1 : Inspecter vos droits actuels

### 1.1 — Qui êtes-vous ?

```bash
oc whoami
```

**Sortie attendue :**

```
istanbul-user
```

### 1.2 — Dans quel namespace travaillez-vous ?

```bash
oc project
```

**Sortie attendue :**

```
Using project "istanbul-user-ns" on server ...
```

### 1.3 — Que pouvez-vous faire dans votre namespace ?

```bash
oc auth can-i --list -n <CITY>-user-ns | head -30
```

Cette commande affiche toutes les actions que votre utilisateur est autorisé à effectuer dans le namespace.

```bash
# Quelques vérifications ciblées
oc auth can-i create deployments -n <CITY>-user-ns
oc auth can-i delete pods -n <CITY>-user-ns
oc auth can-i create rolebindings -n <CITY>-user-ns
oc auth can-i create clusterroles
```

**Sortie attendue :**

```
yes
yes
yes
no
```

:::info Interprétation
- Vous avez le rôle `admin` sur votre namespace — vous pouvez créer des deployments, pods, rolebindings.
- Vous n'avez **pas** de droits cluster-scoped — `create clusterroles` est interdit. C'est normal et intentionnel !
:::

---

## Étape 2 : Créer un Role personnalisé

Nous allons créer un rôle qui autorise uniquement la **lecture des pods** — ni plus, ni moins.

Créez le fichier `pod-reader-role.yaml` :

```bash
vi pod-reader-role.yaml
```

:::tip Vous préférez nano ?
```bash
nano pod-reader-role.yaml
```
Pour coller : `Ctrl+Shift+V`. Sauvegarder : `Ctrl+O` puis `Entrée`. Quitter : `Ctrl+X`.
:::

Contenu du fichier :

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: <CITY>-user-ns
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
```

```bash
oc apply -f pod-reader-role.yaml
```

**Sortie attendue :**

```
role.rbac.authorization.k8s.io/pod-reader created
```

Inspectez le détail du rôle :

```bash
oc describe role pod-reader -n <CITY>-user-ns
```

**Sortie attendue :**

```
Name:         pod-reader
Labels:       <none>
PolicyRule:
  Resources   Non-Resource URLs   Resource Names   Verbs
  ---------   -----------------   --------------   -----
  pods/log    []                  []               [get list watch]
  pods        []                  []               [get list watch]
```

:::info Lecture du PolicyRule
- **Resources** : les types de ressources concernées
- **Verbs** : les actions autorisées (lecture seule ici)
- Ce rôle ne permet **pas** de créer, modifier ou supprimer des pods
:::

---

## Étape 3 : Créer un Service Account

Un Service Account est une identité pour une application (pas un humain). Créons un SA pour une application fictive de monitoring.

Créez le fichier `monitoring-sa.yaml` :

```bash
vi monitoring-sa.yaml
```

Contenu du fichier :

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: monitoring-sa
  namespace: <CITY>-user-ns
```

```bash
oc apply -f monitoring-sa.yaml
```

**Sortie attendue :**

```
serviceaccount/monitoring-sa created
```

Vérifiez que le SA est créé :

```bash
oc get serviceaccount monitoring-sa -n <CITY>-user-ns
```

**Sortie attendue :**

```
NAME           SECRETS   AGE
monitoring-sa  1         5s
```

:::info Secret associé automatiquement
OpenShift crée automatiquement un Secret contenant un token JWT pour chaque Service Account. Ce token sera monté dans les pods qui utilisent ce SA, permettant leur authentification auprès de l'API.
:::

---

## Étape 4 : Créer un RoleBinding

Le RoleBinding associe le rôle `pod-reader` au Service Account `monitoring-sa`. Sans ce binding, le SA n'a aucun droit.

Créez le fichier `monitoring-rolebinding.yaml` :

```bash
vi monitoring-rolebinding.yaml
```

Contenu du fichier :

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: monitoring-sa-pod-reader
  namespace: <CITY>-user-ns
subjects:
  - kind: ServiceAccount
    name: monitoring-sa
    namespace: <CITY>-user-ns
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

```bash
oc apply -f monitoring-rolebinding.yaml
```

**Sortie attendue :**

```
rolebinding.rbac.authorization.k8s.io/monitoring-sa-pod-reader created
```

Visualisez le RoleBinding dans la console :

Naviguez vers **User Management** dans la console OpenShift. Vous devriez voir `monitoring-sa-pod-reader` lier le rôle `pod-reader` au sujet `monitoring-sa`.

---

## Étape 5 : Vérifier les permissions du Service Account

La commande `oc auth can-i` accepte l'option `--as` pour simuler les droits d'un Service Account.

```bash
# Le SA peut-il lister les pods ?
oc auth can-i list pods \
  --as=system:serviceaccount:<CITY>-user-ns:monitoring-sa \
  -n <CITY>-user-ns
```

**Sortie attendue :**

```
yes
```

```bash
# Le SA peut-il créer des pods ?
oc auth can-i create pods \
  --as=system:serviceaccount:<CITY>-user-ns:monitoring-sa \
  -n <CITY>-user-ns
```

**Sortie attendue :**

```
no
```

```bash
# Le SA peut-il créer des deployments ?
oc auth can-i create deployments \
  --as=system:serviceaccount:<CITY>-user-ns:monitoring-sa \
  -n <CITY>-user-ns
```

**Sortie attendue :**

```
no
```

:::tip Principe du moindre privilège en action
Le SA `monitoring-sa` peut uniquement **lire** les pods. Il ne peut pas créer, modifier ni supprimer de ressources. C'est exactement le principe du moindre privilège.
:::

---

## Étape 6 : Lancer un pod avec ce Service Account

Créez un pod de test qui utilise le Service Account `monitoring-sa`.

Créez le fichier `monitoring-pod.yaml` :

```bash
vi monitoring-pod.yaml
```

Contenu du fichier :

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: monitoring-pod
  namespace: <CITY>-user-ns
spec:
  serviceAccountName: monitoring-sa
  containers:
    - name: monitoring
      image: registry.access.redhat.com/ubi8/ubi:latest
      command: ["sleep", "3600"]
      resources:
        requests:
          cpu: "1m"
          memory: "32Mi"
        limits:
          cpu: "50m"
          memory: "64Mi"
```

```bash
oc apply -f monitoring-pod.yaml
```

**Sortie attendue :**

```
pod/monitoring-pod created
```

Attendez que le pod soit Running :

```bash
oc get pod monitoring-pod -n <CITY>-user-ns
```

**Sortie attendue :**

```
NAME             READY   STATUS    RESTARTS   AGE
monitoring-pod   1/1     Running   0          15s
```

### 6.1 — Tester l'accès à l'API depuis l'intérieur du pod

Entrez dans le pod :

```bash
oc exec -it monitoring-pod -- bash
```

Depuis l'intérieur, testez l'accès à l'API en utilisant le token monté automatiquement :

```bash
# Récupérer le token et le namespace
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

# Lister les pods via l'API (doit fonctionner)
curl -sk -H "Authorization: Bearer $TOKEN" \
  https://kubernetes.default.svc/api/v1/namespaces/$NAMESPACE/pods \
  | grep '"name"' | head -5
```

**Sortie attendue :** vous voyez les noms des pods de votre namespace.

```bash
# Essayer de créer un pod (doit être refusé)
curl -sk -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  https://kubernetes.default.svc/api/v1/namespaces/$NAMESPACE/pods \
  -d '{"apiVersion":"v1","kind":"Pod","metadata":{"name":"test"},"spec":{"containers":[{"name":"c","image":"nginx"}]}}' \
  | grep '"reason"'
```

**Sortie attendue :**

```
"reason": "Forbidden",
```

Quittez le pod :

```bash
exit
```

:::info Ce qui se passe dans les coulisses
Le token JWT monté dans `/var/run/secrets/kubernetes.io/serviceaccount/token` est utilisé pour s'authentifier. L'API Server vérifie ce token, identifie le SA, puis consulte les RoleBindings pour déterminer ce qu'il peut faire.
:::

---

## Récapitulatif

| Ressource créée | Description |
|---|---|
| `Role/pod-reader` | Autorise uniquement get/list/watch sur les pods |
| `ServiceAccount/monitoring-sa` | Identité dédiée à l'application de monitoring |
| `RoleBinding/monitoring-sa-pod-reader` | Lie le rôle au Service Account |
| `Pod/monitoring-pod` | Pod utilisant le SA, avec token monté automatiquement |

```
ServiceAccount (monitoring-sa)
        ↕ subjects
RoleBinding (monitoring-sa-pod-reader)
        ↕ roleRef
Role (pod-reader)
        ↕ rules
Verbs: get, list, watch sur pods, pods/log
```

---

## Étape 7 : Nettoyage

```bash
oc delete pod monitoring-pod -n <CITY>-user-ns
oc delete rolebinding monitoring-sa-pod-reader -n <CITY>-user-ns
oc delete serviceaccount monitoring-sa -n <CITY>-user-ns
oc delete role pod-reader -n <CITY>-user-ns
```

**Sortie attendue :**

```
pod "monitoring-pod" deleted
rolebinding.rbac.authorization.k8s.io "monitoring-sa-pod-reader" deleted
serviceaccount "monitoring-sa" deleted
role.rbac.authorization.k8s.io "pod-reader" deleted
```
