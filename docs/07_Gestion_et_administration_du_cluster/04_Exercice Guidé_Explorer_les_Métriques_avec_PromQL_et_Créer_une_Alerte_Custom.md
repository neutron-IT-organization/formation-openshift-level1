---
id: Exercice_metrics_alerts_promql
slug: /Observability/Exercice_metrics_alerts_promql
---

# Exercice Guidé : Explorer les Métriques avec PromQL et Créer une Alerte Custom

## Ce que vous allez apprendre

Dans cet exercice, vous allez utiliser la page **Observe → Metrics** pour explorer les métriques de votre namespace avec **PromQL** (le langage de requête de Prometheus), puis créer une **alerte custom** via une **PrometheusRule** qui se déclenche automatiquement quand un pod approche sa limite mémoire.

L'objectif est de **passer du dashboard à l'analyse fine**, et d'**automatiser la surveillance** au lieu de regarder manuellement.

## Objectifs

- [ ] Naviguer dans **Observe → Metrics** et lancer des requêtes PromQL.
- [ ] Comprendre les **métriques principales** de cAdvisor (CPU, mémoire).
- [ ] Filtrer les résultats par **namespace** et par **pod**.
- [ ] Créer une **PrometheusRule** custom qui surveille la mémoire.
- [ ] Vérifier que l'alerte apparaît dans **Observe → Alerting**.

---

## Préparation

1. Connectez-vous à la console OpenShift.
2. En haut de la page, sélectionnez votre projet : **`paris-user-ns`**.
3. Dans le menu de gauche, cliquez sur **Observe → Metrics**.
4. Vous arrivez sur une page avec un champ de saisie de requête PromQL.

:::info Qu'est-ce que PromQL ?
**PromQL** (Prometheus Query Language) est le langage utilisé pour interroger les métriques stockées dans Prometheus. C'est ce qui alimente tous les graphiques que vous avez vus dans **Observe → Dashboards**.

Les métriques sont sous forme : `nom_metrique{label1="valeur", label2="valeur"} valeur_numérique`
:::

---

## Partie 1 — Premières requêtes PromQL

### Question 1.1

Dans le champ de requête, tapez :

```promql
up
```

Puis cliquez sur **Run queries**.

> **Q1** — Que vous renvoie cette requête dans votre namespace ?

<details>
<summary>Voir la réponse</summary>

La requête `up` peut afficher **"No datapoints found"** dans `paris-user-ns` car les exporters principaux tournent dans le namespace `openshift-monitoring` (Prometheus surveille des cibles globales du cluster, pas du namespace utilisateur).

C'est normal pour un namespace utilisateur. Pour voir les cibles `up` dans votre namespace, il faudrait avoir un ServiceMonitor configuré, ce qui n'est pas le cas par défaut.

Cette requête sert surtout sur le cluster global pour vérifier que les exporters Prometheus sont disponibles.
</details>

### Question 1.2

Effacez la requête et tapez :

```promql
kube_pod_info{namespace="paris-user-ns"}
```

> **Q2** — Combien de pods sont retournés par cette requête ?

<details>
<summary>Voir la réponse</summary>

**3 pods** :
- `postgres-5b59c7f5ff-scm4n`
- `todo-app-dd5dfc87-2hw4q`
- `monitoring-pod`

La métrique `kube_pod_info` retourne **une ligne par pod** dans le namespace, avec des labels comme `pod`, `namespace`, `node`, `pod_ip`, etc.

Toutes les lignes affichent `host_ip = 192.168.0.251` (IP du nœud) et `job = kube-state-metrics`.
</details>

### Question 1.3

Tapez :

```promql
container_memory_working_set_bytes{namespace="paris-user-ns", container!=""}
```

> **Q3** — Combien de résultats obtenez-vous et pourquoi le filtre `container!=""` est-il important ?

<details>
<summary>Voir la réponse</summary>

Vous obtenez **7 résultats**. La métrique `container_memory_working_set_bytes` retourne une ligne par conteneur (et par sandbox) :

- 3 lignes `POD` → ce sont les **pause containers** (sandboxes Kubernetes)
- 3 lignes pour les vrais conteneurs : `monitoring`, `postgres`, `todo-app`
- 1 ligne supplémentaire pour `monitoring` (peut-être un init container ou ancien)

Le filtre **`container!=""`** est crucial pour **exclure les pseudo-conteneurs** vides. Sans ce filtre, on aurait des doublons et des entrées non pertinentes.

**Valeurs principales observées (en octets)** :
- `monitoring-pod` → ~553k (≈ 540 KiB)
- `postgres-5b59c7f5ff-scm4n` → ~18,85M (≈ 18 MiB)
- `todo-app-dd5dfc87-2hw4q` → ~266,6M (≈ 254 MiB)
</details>

---

## Partie 2 — Requêtes de diagnostic mémoire

### Question 2.1

Tapez cette requête qui calcule l'**utilisation mémoire en pourcentage** par rapport aux limits :

```promql
sum(container_memory_working_set_bytes{namespace="paris-user-ns", container!=""}) by (pod)
/
sum(kube_pod_container_resource_limits{namespace="paris-user-ns", resource="memory"}) by (pod)
* 100
```

> **Q4** — Quelles sont les valeurs obtenues pour les 3 pods ?

<details>
<summary>Voir la réponse</summary>

| Pod | % Mémoire vs Limit |
|---|---|
| `monitoring-pod` | **0,824 %** |
| `postgres-5b59c7f5ff-scm4n` | **7,02 %** |
| `todo-app-dd5dfc87-2hw4q` | **99,33 %** 🚨 |

Ces valeurs sont **identiques** à celles affichées dans le dashboard `Memory Limits %` que vous avez vu précédemment. C'est cohérent : le dashboard utilise cette même requête PromQL en arrière-plan.

🚨 Le pod `todo-app` est très proche de sa limite mémoire et risque d'être OOMKilled.
</details>

### Question 2.2

Tapez :

```promql
sum(rate(container_cpu_usage_seconds_total{namespace="paris-user-ns", container!=""}[5m])) by (pod)
```

> **Q5** — Quelles sont les valeurs CPU obtenues pour les 3 pods ?

<details>
<summary>Voir la réponse</summary>

| Pod | CPU Usage (cores) |
|---|---|
| `monitoring-pod` | **0** |
| `postgres-5b59c7f5ff-scm4n` | **1,3e-4** (≈ 0,13 millicore) |
| `todo-app-dd5dfc87-2hw4q` | **5,2e-4** (≈ 0,52 millicore) |

Cette requête calcule le **taux d'utilisation CPU** (en cores) sur les **5 dernières minutes**, agrégé par pod.

`todo-app` consomme **4x plus de CPU** que `postgres` (5,2e-4 vs 1,3e-4). C'est cohérent avec le dashboard où il était à `CPU Requests % = 53,95 %`.

Le graphique montre ces valeurs **stables dans le temps** : la consommation CPU est régulière, sans pic.
</details>

### Question 2.3

Tapez :

```promql
container_memory_rss{namespace="paris-user-ns", container!="", pod=~"todo-app.*"}
```

> **Q6** — Combien de résultats obtenez-vous et que représente le filtre `pod=~"todo-app.*"` ?

<details>
<summary>Voir la réponse</summary>

Vous obtenez **2 résultats** :
- 1 ligne pour le pause container (`POD`)
- 1 ligne pour le vrai conteneur `todo-app`

Le filtre **`pod=~"todo-app.*"`** utilise une **regex** (notez l'opérateur `=~` au lieu de `=`) pour matcher tous les pods dont le nom **commence par** `todo-app`. C'est utile quand le nom complet du pod change à chaque redéploiement (suffixe aléatoire `dd5dfc87-2hw4q`).

**Opérateurs PromQL pour les labels** :
- `=` : égalité stricte
- `!=` : différent
- `=~` : regex match
- `!~` : regex no-match

Le RSS (Resident Set Size) du conteneur `todo-app` doit être proche de **263 555 648 octets** (≈ 251,4 MiB), comme vu dans le dashboard.
</details>

---

## Partie 3 — Créer une PrometheusRule custom

Maintenant que vous savez écrire des requêtes PromQL, vous allez créer une **alerte automatique** qui se déclenche quand un pod approche sa limite mémoire.

### Étape 1 — Créer le manifest

Créez le fichier `pod-memory-alert.yaml` :

```bash
vi pod-memory-alert.yaml
```

:::tip Vous préférez nano ?
```bash
nano pod-memory-alert.yaml
```
:::

Contenu du fichier :

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: pod-memory-alert
  namespace: paris-user-ns
  labels:
    role: alert-rules
spec:
  groups:
    - name: memory-alerts
      rules:
        - alert: PodMemoryNearLimit
          expr: |
            (
              sum(container_memory_working_set_bytes{namespace="paris-user-ns", container!=""}) by (pod)
              /
              sum(kube_pod_container_resource_limits{namespace="paris-user-ns", resource="memory"}) by (pod)
            ) > 0.85
          for: 2m
          labels:
            severity: warning
            namespace: paris-user-ns
          annotations:
            summary: "Le pod {{ $labels.pod }} approche sa limite mémoire"
            description: "Le pod {{ $labels.pod }} utilise plus de 85% de sa limite mémoire depuis 2 minutes."
```

Cette PrometheusRule définit :

- **`alert: PodMemoryNearLimit`** : le nom de l'alerte.
- **`expr`** : la requête PromQL qui déclenche l'alerte (mémoire > 85 % de la limit) — c'est exactement la requête testée à la Q4.
- **`for: 2m`** : l'alerte ne se déclenche que si la condition est vraie pendant **2 minutes** (évite les faux positifs).
- **`severity: warning`** : niveau de gravité.
- **`annotations`** : message affiché quand l'alerte est active.

### Étape 2 — Appliquer le manifest

```bash
oc apply -f pod-memory-alert.yaml
```

**Sortie attendue :**

```
prometheusrule.monitoring.coreos.com/pod-memory-alert created
```

### Étape 3 — Vérifier que la règle existe

```bash
oc get prometheusrule
```

**Sortie attendue :**

```
NAME                AGE
pod-memory-alert    10s
```

Votre PrometheusRule est bien enregistrée sur le cluster. Prometheus va automatiquement la prendre en compte au prochain reload (quelques secondes).

---

## Partie 4 — Vérifier que l'alerte apparaît dans la console

### Question 4.1

Dans le menu de gauche, cliquez sur **Observe → Alerting**.

> **Q7** — Dans quel onglet allez-vous chercher votre alerte ?

<details>
<summary>Voir la réponse</summary>

Trois onglets sont disponibles :

- **Alerts** : alertes actuellement actives (Firing/Pending).
- **Silences** : alertes que vous avez explicitement masquées.
- **Alerting Rules** : la liste de **toutes les règles** définies (qu'elles soient déclenchées ou non).

Pour voir votre nouvelle règle, allez dans **Alerting Rules**.
</details>

### Question 4.2

Dans **Alerting Rules**, cherchez `PodMemoryNearLimit` (vous pouvez utiliser le filtre).

> **Q8** — Dans quel état votre règle apparaît-elle après quelques minutes ?

<details>
<summary>Voir la réponse</summary>

L'alerte devrait apparaître en état **`Firing`** 🔥 parce que `todo-app` dépasse 85 % de sa limite mémoire (il est à **99,33 %**).

Si elle est encore en **`Pending`**, attendez 2 minutes (la durée définie par `for: 2m`).

Vous verrez aussi :
- Le **pod concerné** : `todo-app-dd5dfc87-2hw4q`
- La **valeur actuelle** : ~99,33 %
- Le **message** : "Le pod todo-app-dd5dfc87-2hw4q approche sa limite mémoire"
</details>

### Question 4.3

Cliquez sur l'alerte `PodMemoryNearLimit` pour voir ses détails.

> **Q9** — Quelles informations sont affichées sur la page de détail ?

<details>
<summary>Voir la réponse</summary>

La page de détail affiche :

- **Severity** : `warning`
- **Active since** : la date/heure depuis laquelle l'alerte est active
- **Description** : le message complet avec le nom du pod
- **Source** : un lien vers la requête PromQL qui a déclenché l'alerte
- **Graph** : un mini-graphique de la métrique sur la dernière période

Vous pouvez cliquer sur **"View in Metrics"** pour ouvrir la requête dans **Observe → Metrics**.
</details>

---

## Partie 5 — Silencer une alerte

### Question 5.1

Vous voulez **silencer temporairement** l'alerte (par exemple pendant une maintenance).

Dans la page de détail de l'alerte, cliquez sur **Silence Alert**.

> **Q10** — Quels champs faut-il remplir pour créer un silence ?

<details>
<summary>Voir la réponse</summary>

Un silence demande :

- **Duration** : durée du silence (1h, 2h, 1d, ou custom)
- **Comment** : raison du silence (par exemple "Maintenance todo-app en cours")
- **Created by** : votre nom (auto-rempli)
- **Matchers** : conditions pour matcher l'alerte (auto-remplies)

Cliquez sur **Silence** pour confirmer. L'alerte n'enverra plus de notification pendant la durée choisie, mais la condition sera toujours évaluée.
</details>

---

## Partie 6 — Nettoyage

Pour libérer les ressources et revenir à l'état initial, vous allez supprimer **tout ce qui a été créé** pendant cet exercice.

### Étape 1 — Supprimer le Silence (s'il y en a un)

Si vous avez créé un Silence à l'étape 5, allez dans **Observe → Alerting → Silences**, cliquez sur le Silence créé, puis sur **Expire Silence**.

### Étape 2 — Supprimer la PrometheusRule

```bash
oc delete prometheusrule pod-memory-alert
```

**Sortie attendue :**

```
prometheusrule.monitoring.coreos.com "pod-memory-alert" deleted
```

### Étape 3 — Supprimer le fichier YAML local

```bash
rm pod-memory-alert.yaml
```

### Étape 4 — Vérifier que tout est bien nettoyé

Vérifiez qu'il ne reste plus aucune PrometheusRule custom :

```bash
oc get prometheusrule
```

**Sortie attendue :**

```
No resources found in paris-user-ns namespace.
```

Vérifiez aussi dans la console **Observe → Alerting → Alerting Rules** que `PodMemoryNearLimit` a bien disparu de la liste (peut prendre quelques secondes après la suppression).

:::tip Bon réflexe
Toujours nettoyer les ressources de test sur un cluster partagé. Une PrometheusRule oubliée peut envoyer des notifications inutiles ou consommer des ressources de Prometheus.
:::

---

## Récapitulatif

À l'issue de cet exercice, vous savez :

- ✅ Naviguer dans **Observe → Metrics** et lancer des requêtes **PromQL**.
- ✅ Utiliser les métriques de base : `up`, `kube_pod_info`, `container_memory_working_set_bytes`, `container_memory_rss`.
- ✅ Filtrer par **namespace**, **pod** (avec regex `=~`), **container**.
- ✅ Calculer un **pourcentage** entre deux métriques (ex: utilisation vs limit).
- ✅ Créer une **PrometheusRule** custom avec une expression PromQL.
- ✅ Comprendre les états d'une alerte : **Pending** → **Firing**.
- ✅ Vérifier vos alertes dans **Observe → Alerting → Alerting Rules**.
- ✅ Créer un **Silence** pour suspendre temporairement une alerte.
- ✅ Nettoyer les ressources créées (`oc delete prometheusrule`).

:::tip Pour aller plus loin
Dans un prochain exercice, vous configurerez **Alertmanager** pour envoyer des notifications par **email**, **Slack** ou **PagerDuty** quand vos alertes se déclenchent. C'est ce qui transforme une alerte affichée dans la console en une vraie action opérationnelle.
:::