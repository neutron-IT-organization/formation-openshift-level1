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
- [ ] **Silencer** temporairement une alerte, puis l'expirer.

---

## Préparation

1. Connectez-vous à la console OpenShift.
2. En haut de la page, sélectionnez votre projet : **`<CITY>-user-ns`**.
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
kube_pod_info{namespace="<CITY>-user-ns"}
```

Puis cliquez sur **Run queries**.

> **Q1** — Combien de résultats sont retournés par cette requête ?

<details>
<summary>Voir la réponse</summary>

**3 résultats** correspondant aux 3 pods de votre namespace.

Dans la console, chaque ligne affiche plusieurs colonnes :

- **Name** : `kube_pod_info` (le nom de la métrique)
- **container** : nom du container associé
- **created_by_kind** : type de contrôleur (ex: `ReplicaSet`)
- **created_by_name** : ⭐ c'est ici que vous voyez les **noms des pods** :
  - `postgres-5b59c7f5ff`
  - `todo-app-dd5dfc87`
- **endpoint** : endpoint de scraping (ex: `https-main`)
- **job** : `kube-state-metrics`

C'est la métrique idéale pour vérifier **quels pods existent** dans un namespace.
</details>

### Question 1.2

Effacez la requête et tapez :

```promql
container_memory_working_set_bytes{namespace="<CITY>-user-ns", container!=""}
```

> **Q2** — Combien de résultats obtenez-vous et pourquoi le filtre `container!=""` est-il important ?

<details>
<summary>Voir la réponse</summary>

Vous obtenez **6 résultats**. La métrique `container_memory_working_set_bytes` retourne une ligne par conteneur (et par sandbox) :

- **3 lignes `POD`** → ce sont les **pause containers** (sandboxes Kubernetes)
- **3 lignes pour les vrais conteneurs** :
  - `monitoring`
  - `postgres`
  - `todo-app`

Le filtre **`container!=""`** est crucial pour **exclure les pseudo-conteneurs** vides. Sans ce filtre, on aurait des doublons et des entrées non pertinentes.

Chaque ligne affiche son `endpoint` (`https-metrics`) et son `id` qui correspond au chemin cgroup du conteneur.
</details>

---

## Partie 2 — Requêtes de diagnostic mémoire

### Question 2.1

Tapez cette requête qui calcule l'**utilisation mémoire en pourcentage** par rapport aux limits :

```promql
sum(container_memory_working_set_bytes{namespace="<CITY>-user-ns", container!=""}) by (pod)
/
sum(kube_pod_container_resource_limits{namespace="<CITY>-user-ns", resource="memory"}) by (pod)
* 100
```

> **Q3** — Quelles sont les valeurs obtenues pour les 3 pods ?

<details>
<summary>Voir la réponse</summary>

| Pod | % Mémoire vs Limit |
|---|---|
| `monitoring-pod` | **0,818** |
| `postgres-5b59c7f5ff-scm4n` | **7** |
| `todo-app-dd5dfc87-2hw4q` | **élevé** (proche ou au-dessus du seuil de l'alerte) 🚨 |

Ces valeurs sont **identiques** à celles affichées dans le dashboard `Memory Limits %` que vous avez vu précédemment. C'est cohérent : le dashboard utilise cette même requête PromQL en arrière-plan.

🚨 Le pod `todo-app` est celui qui consomme le plus de mémoire par rapport à sa limite.
</details>

### Question 2.2

Tapez :

```promql
sum(rate(container_cpu_usage_seconds_total{namespace="<CITY>-user-ns", container!=""}[5m])) by (pod)
```

> **Q4** — Quelles sont les valeurs CPU obtenues pour les 3 pods ?

<details>
<summary>Voir la réponse</summary>

| Pod | CPU Usage (cores) |
|---|---|
| `monitoring-pod` | **0** |
| `postgres-5b59c7f5ff-scm4n` | **1,3e-4** (≈ 0,13 millicore) |
| `todo-app-dd5dfc87-2hw4q` | **5,4e-4** (≈ 0,54 millicore) |

Cette requête calcule le **taux d'utilisation CPU** (en cores) sur les **5 dernières minutes**, agrégé par pod.

`todo-app` consomme **4x plus de CPU** que `postgres` (5,4e-4 vs 1,3e-4). C'est cohérent avec le dashboard où il avait une consommation CPU plus élevée.

Le graphique montre ces valeurs **stables dans le temps** : la consommation CPU est régulière, sans pic.
</details>

### Question 2.3

Tapez :

```promql
container_memory_rss{namespace="<CITY>-user-ns", container!="", pod=~"todo-app.*"}
```

> **Q5** — Combien de résultats obtenez-vous et que représente le filtre `pod=~"todo-app.*"` ?

<details>
<summary>Voir la réponse</summary>

Vous obtenez **1 résultat** : la ligne du pause container (`POD`) du pod todo-app.

Le filtre **`pod=~"todo-app.*"`** utilise une **regex** (notez l'opérateur `=~` au lieu de `=`) pour matcher tous les pods dont le nom **commence par** `todo-app`. C'est utile quand le nom complet du pod change à chaque redéploiement (suffixe aléatoire `dd5dfc87-2hw4q`).

**Opérateurs PromQL pour les labels** :
- `=` : égalité stricte
- `!=` : différent
- `=~` : regex match
- `!~` : regex no-match

Pour voir aussi le vrai conteneur `todo-app` (pas seulement le POD pause), vous pouvez modifier la requête en enlevant `container!=""` ou en filtrant sur `container="todo-app"` :

```promql
container_memory_rss{namespace="<CITY>-user-ns", container="todo-app"}
```
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
  namespace: <CITY>-user-ns
  labels:
    role: alert-rules
spec:
  groups:
    - name: memory-alerts
      rules:
        - alert: PodMemoryNearLimit
          expr: |
            (
              sum(container_memory_working_set_bytes{namespace="<CITY>-user-ns", container!=""}) by (pod)
              /
              sum(kube_pod_container_resource_limits{namespace="<CITY>-user-ns", resource="memory"}) by (pod)
            ) > 0.50
          for: 2m
          labels:
            severity: warning
            namespace: <CITY>-user-ns
          annotations:
            summary: "Le pod {{ $labels.pod }} approche sa limite mémoire"
            description: "Le pod {{ $labels.pod }} utilise plus de 50% de sa limite mémoire depuis 2 minutes."
```

Cette PrometheusRule définit :

- **`alert: PodMemoryNearLimit`** : le nom de l'alerte.
- **`expr`** : la requête PromQL qui déclenche l'alerte (mémoire > 50 % de la limit) — c'est la requête testée à la Q3.
- **`for: 2m`** : l'alerte ne se déclenche que si la condition est vraie pendant **2 minutes** (évite les faux positifs).
- **`severity: warning`** : niveau de gravité.
- **`annotations`** : message affiché quand l'alerte est active.

:::tip Pourquoi le seuil 0.50 ?
Le seuil `> 0.50` (50 %) est choisi pour que l'alerte se **déclenche à coup sûr** pendant la formation, car `todo-app` dépasse ce seuil. En production, on utilise plutôt un seuil haut (0.85 ou 0.90) pour alerter seulement en cas de vraie pression mémoire.
:::

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

> **Q6** — Dans quel onglet allez-vous chercher votre alerte ?

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

> **Q7** — Dans quel état votre règle apparaît-elle après quelques minutes ?

<details>
<summary>Voir la réponse</summary>

L'alerte devrait apparaître en état **`Firing`** 🔥 parce que `todo-app` dépasse 50 % de sa limite mémoire.

Si elle est encore en **`Pending`**, attendez 2 minutes (la durée définie par `for: 2m`).

Vous verrez aussi :
- Le **pod concerné** : `todo-app-dd5dfc87-2hw4q`
- La **valeur actuelle** de la mémoire
- Le **message** : "Le pod todo-app-dd5dfc87-2hw4q approche sa limite mémoire"
</details>

### Question 4.3

Cliquez sur l'alerte `PodMemoryNearLimit` pour voir ses détails.

> **Q8** — Quelles informations sont affichées sur la page de détail ?

<details>
<summary>Voir la réponse</summary>

La page de détail affiche :

- **Severity** : `warning`
- **Active since** : la date/heure depuis laquelle l'alerte est active
- **Description** : le message complet avec le nom du pod
- **Source** : un lien vers la requête PromQL qui a déclenché l'alerte
- **Graph** : un mini-graphique de la métrique sur la dernière période

Vous pouvez cliquer sur **"Inspect"** (en haut à droite du graphique) pour ouvrir la requête PromQL dans **Observe → Metrics**.
</details>

---

## Partie 5 — Silencer une alerte

Imaginez que vous savez qu'un pod va consommer beaucoup de mémoire pendant une **maintenance prévue**. Vous ne voulez pas être spammé d'alertes pendant ce temps. La solution : **créer un Silence** qui suspend temporairement les notifications.

:::info Qu'est-ce qu'un Silence ?
Un **Silence** est comme un bouton **MUTE** sur une alerte 🔇. La règle continue d'être évaluée par Prometheus, mais **aucune notification n'est envoyée** pendant la durée définie. À la fin du silence, l'alerte redevient active **automatiquement**.
:::

### Étape 1 — Aller dans l'onglet Silences

Dans la console OpenShift :

1. Menu de gauche : **Observe → Alerting**
2. Cliquez sur l'onglet **`Silences`**
3. Au début, vous voyez **"No silences found"** (normal)
4. Cliquez sur le bouton bleu **`Create silence`** en haut à gauche

### Étape 2 — Remplir le formulaire de Silence

Le formulaire est divisé en 3 sections : **Duration**, **Alert labels** et **Info**.

#### Section 1 : Duration (durée du silence)

| Champ | Valeur à choisir |
|---|---|
| **Silence alert from** | `Now` (déjà rempli) |
| **For** | **`30m`** (30 minutes) |
| **Until** | Auto-rempli en fonction de "For" |
| ☑️ **Start immediately** | Cochez (déjà coché par défaut) |

:::tip Astuce
Si la valeur `30m` n'est pas dans le menu déroulant, choisissez **Custom** et tapez `30m` dans le champ.
:::

#### Section 2 : Alert labels (matchers)

C'est ici que vous **ciblez l'alerte** à silencer. Le label `namespace` est déjà prérempli :

| Label name | Label value |
|---|---|
| `namespace` | `<CITY>-user-ns` |

**Ajoutez** un deuxième matcher pour cibler **votre alerte spécifique** :

| Label name | Label value |
|---|---|
| `alertname` | `PodMemoryNearLimit` |

#### Section 3 : Info

| Champ | Valeur |
|---|---|
| **Creator** | `<CITY>-user` (auto-rempli) |
| **Comment** ⭐ | `Test du silence pendant la formation` |

:::caution Le commentaire est obligatoire
Le champ **Comment** est marqué d'une étoile rouge `*`, donc il est **obligatoire**. Sans commentaire, le bouton `Silence` reste désactivé.
:::

### Étape 3 — Cliquer sur `Silence`

Le bouton bleu **`Silence`** en bas du formulaire. Vous serez redirigé vers la liste des Silences.

### Question 5.1

> **Q9** — Quels champs faut-il remplir pour créer un silence ?

<details>
<summary>Voir la réponse</summary>

Un silence demande :

- **Duration (For)** : durée du silence (**`30m`** dans notre cas).
- **Alert labels (matchers)** : conditions pour cibler l'alerte. Le `namespace` est auto-rempli, on ajoute généralement `alertname=PodMemoryNearLimit`.
- **Comment** : raison du silence (obligatoire, par exemple "Maintenance todo-app en cours").
- **Creator** : votre nom (auto-rempli).

Cliquez sur **`Silence`** pour confirmer. L'alerte n'enverra plus de notification pendant la durée choisie, mais la condition sera toujours évaluée.
</details>

### Question 5.2

Après avoir créé le silence, allez dans l'onglet **`Silences`**.

> **Q10** — Quel est l'état de votre Silence et que voyez-vous ?

<details>
<summary>Voir la réponse</summary>

Vous voyez votre Silence avec ces informations :

```
Name                  State    Created by    Expires
PodMemoryNearLimit    Active   <CITY>-user   in 30m
```

- **State : Active** 🟢 → le silence est en cours
- **Expires** → indique quand le silence se terminera automatiquement (30 min)
- **Firing alerts** → vous montre quelles alertes sont actuellement silencées par ce silence
</details>

### Question 5.3

Retournez dans l'onglet **`Alerts`**.

> **Q11** — Que constatez-vous concernant l'alerte `PodMemoryNearLimit` ?

<details>
<summary>Voir la réponse</summary>

L'alerte n'apparaît **plus** dans l'onglet `Alerts` (ou apparaît avec un état **Silenced** 🔇).

C'est exactement le but du Silence : faire **disparaître l'alerte de l'écran** sans supprimer la règle. La condition continue d'être évaluée par Prometheus, mais aucune notification n'est envoyée pendant la durée du silence.

⚠️ **Important** : la PrometheusRule existe toujours (`oc get prometheusrule`), seule la **notification** est suspendue.
</details>

---

## Partie 6 — Mettre fin au Silence : 2 méthodes

Un Silence peut prendre fin de **deux façons**. À vous de choisir celle qui correspond à votre besoin.

:::info Les 2 façons de terminer un Silence
- **Méthode 1 — Automatique** : on ne fait rien, le Silence s'arrête tout seul à la fin de la durée (30 min).
- **Méthode 2 — Manuelle** : on clique sur **Expire Silence** pour l'arrêter immédiatement, sans attendre.
:::

### Méthode 1 — Laisser le Silence expirer automatiquement ⏱️

C'est la méthode la plus simple : **vous ne faites rien**, le Silence s'arrête tout seul.

1. Allez dans **Observe → Alerting → Silences**
2. Regardez la colonne **"Expires"** : elle décompte le temps restant
3. Au bout de 30 min, le Silence passe en état **"Expired"** 🔵 **automatiquement**
4. L'alerte redevient `Firing` 🔥 dans l'onglet `Alerts`

→ Idéal quand vous savez à l'avance combien de temps doit durer la maintenance.

### Méthode 2 — Expirer le Silence manuellement 🖱️

Si vous voulez **arrêter le Silence avant la fin** (par exemple : la maintenance est finie plus tôt que prévu), vous pouvez l'expirer manuellement.

1. Allez dans **Observe → Alerting → Silences**
2. Cliquez sur votre Silence `PodMemoryNearLimit`
3. En haut à droite, cliquez sur le bouton **`Expire Silence`**
4. Confirmez en cliquant à nouveau sur **`Expire silence`** dans la fenêtre de confirmation
5. ✅ Le Silence **disparaît immédiatement** de la liste (vous voyez "No Silences found")
6. L'alerte **réapparaît aussitôt** en `Firing` 🔥 dans l'onglet `Alerts`

→ Idéal quand la raison du Silence n'existe plus et que vous voulez **réactiver les alertes tout de suite**.

### Question 6.1

> **Q12** — Quelle est la différence entre laisser un Silence expirer et l'expirer manuellement ?

<details>
<summary>Voir la réponse</summary>

- **Expiration automatique** : le Silence se termine **tout seul** à la fin de la durée prévue (ici 30 min). Vous n'avez **rien à faire**. C'est utile quand vous connaissez la durée exacte de la maintenance.

- **Expiration manuelle** (bouton `Expire Silence`) : vous **forcez** la fin du Silence **immédiatement**, sans attendre la fin de la durée. C'est utile quand la maintenance est terminée plus tôt que prévu et que vous voulez **réactiver les alertes tout de suite**.

Dans les deux cas, le résultat final est identique : le Silence se termine et l'alerte redevient `Firing` si la condition est toujours vraie.
</details>

:::tip Cas d'usage des Silences en production
Les Silences sont très utiles pour :
- **Maintenance prévue** : "Je vais redémarrer todo-app pendant 1h"
- **Bug connu** : "On sait qu'il y a un problème, on travaille dessus"
- **Heures non ouvrables** : "On veut pas être réveillé la nuit"
- **Ajustement d'alerte** : "On modifie le seuil, on silence pour 24h"
:::

---

## Partie 7 — Nettoyage

Pour libérer les ressources et revenir à l'état initial, vous allez supprimer **la PrometheusRule** créée pendant cet exercice.

:::info Le Silence
Si vous l'avez expiré manuellement (Méthode 2), il est déjà terminé. Sinon, il s'expirera **tout seul** au bout des 30 minutes. Dans les deux cas, **rien à supprimer** côté Silence.
:::

### Étape 1 — Supprimer la PrometheusRule

```bash
oc delete prometheusrule pod-memory-alert
```

**Sortie attendue :**

```
prometheusrule.monitoring.coreos.com "pod-memory-alert" deleted
```

### Étape 2 — Supprimer le fichier YAML local

```bash
rm pod-memory-alert.yaml
```

### Étape 3 — Vérifier que tout est bien nettoyé

Vérifiez qu'il ne reste plus aucune PrometheusRule custom :

```bash
oc get prometheusrule
```

**Sortie attendue :**

```
No resources found in <CITY>-user-ns namespace.
```

Vérifiez aussi dans la console **Observe → Alerting → Alerting Rules** que `PodMemoryNearLimit` a bien disparu de la liste (peut prendre quelques secondes après la suppression).

:::tip Bon réflexe
Toujours nettoyer les ressources de test sur un cluster partagé. Une PrometheusRule oubliée peut envoyer des notifications inutiles ou consommer des ressources de Prometheus.
:::

---

## Récapitulatif

À l'issue de cet exercice, vous savez :

- ✅ Naviguer dans **Observe → Metrics** et lancer des requêtes **PromQL**.
- ✅ Utiliser les métriques de base : `kube_pod_info`, `container_memory_working_set_bytes`, `container_memory_rss`, `container_cpu_usage_seconds_total`.
- ✅ Filtrer par **namespace**, **pod** (avec regex `=~`), **container**.
- ✅ Calculer un **pourcentage** entre deux métriques (ex: utilisation vs limit).
- ✅ Créer une **PrometheusRule** custom avec une expression PromQL.
- ✅ Comprendre les états d'une alerte : **Pending** → **Firing**.
- ✅ Vérifier vos alertes dans **Observe → Alerting → Alerting Rules**.
- ✅ **Créer un Silence** pour suspendre temporairement une alerte (avec matchers, durée et commentaire).
- ✅ Terminer un Silence de **2 façons** : automatiquement (à la fin de la durée) ou manuellement (bouton **Expire Silence**).
- ✅ Nettoyer les ressources créées (`oc delete prometheusrule`).