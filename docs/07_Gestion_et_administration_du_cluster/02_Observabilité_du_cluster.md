---
id: Exercice_dashboards_observe
slug: /Observability/Exercice_dashboards_observe
---

# Exercice Guidé : Lire les Dashboards dans OpenShift Observe

## Ce que vous allez apprendre

Dans cet exercice, vous allez **explorer les dashboards intégrés** d'OpenShift et **répondre à des questions** sur les **valeurs de configuration** affichées dans la console.

L'objectif est de **développer votre capacité à lire et naviguer** dans les différentes sections du dashboard pour identifier les ressources allouées à chaque pod d'un namespace.

## Objectifs

- [ ] Naviguer dans **Observe → Dashboards** et choisir le bon dashboard.
- [ ] Identifier les **3 pods** présents dans le namespace.
- [ ] Lire les **CPU Limits** configurées pour chaque pod.
- [ ] Lire les **CPU Requests** configurées pour chaque pod.
- [ ] Lire les **Memory Limits** configurées pour chaque pod.
- [ ] Lire les **valeurs RSS** (Resident Set Size) de chaque pod.

---

## Préparation

1. Connectez-vous à la console OpenShift.
2. En haut de la page, sélectionnez votre projet : **`<CITY>-user-ns`**.
3. Dans le menu de gauche, cliquez sur **Observe → Dashboards**.
4. Dans le menu déroulant **Dashboard**, sélectionnez :
   `Kubernetes / Compute Resources / Namespace (Pods)`
5. En haut à droite, vérifiez que :
   - **Time range** est sur `Last 30 minutes`
   - **Refresh interval** est sur `30 seconds`

:::info Contexte de la formation
Chaque namespace utilisateur (`paris-user-ns`, `rome-user-ns`, etc.) contient les **mêmes 3 pods de référence** déployés pour la formation :

- **`monitoring-pod`** : pod léger de surveillance
- **`postgres-5b59c7f5ff-scm4n`** : base de données PostgreSQL
- **`todo-app-dd5dfc87-2hw4q`** : application web

Quel que soit votre namespace, vous travaillez avec les **mêmes pods configurés de la même façon**. Les **valeurs de configuration** (Limits, Requests) sont **identiques pour tout le monde**.
:::

:::caution Pourquoi on ne demande pas les pourcentages de consommation
Les valeurs comme **CPU Usage %**, **Memory Usage %**, **Throughput** **changent en permanence** selon l'activité du cluster et l'utilisateur.

Cet exercice se concentre sur les **valeurs de configuration FIXES** qui sont les mêmes pour tous les utilisateurs : Limits, Requests, RSS, et le nombre de pods.
:::

---

## Notions clés à connaître

### 🔵 Requests vs Limits

| Concept | Définition |
|---|---|
| **Requests** | Ressources **garanties** au pod (réservées même si pas utilisées) |
| **Limits** | Ressources **maximales** que le pod peut utiliser (au-delà → throttle ou kill) |

### 🔵 Unités CPU

- `1` = 1 CPU complet (1000 millicores)
- `0,5` = 500 millicores (½ CPU)
- `0,2` = 200 millicores (⅕ CPU)
- `0,05` = 50 millicores (1/20 CPU) → pour pods très légers
- `0,001` = 1 millicore (le minimum)

### 🔵 Unités mémoire

- `1 KiB` = 1024 octets
- `1 MiB` = 1024 KiB ≈ 1 Mo
- `1 GiB` = 1024 MiB ≈ 1 Go

---

## Partie 1 — Identifier les pods du namespace

### Question 1

> **Q1** — Dans le tableau **CPU Quota**, combien de pods sont listés et quels sont leurs noms ?

<details>
<summary>Voir la réponse</summary>

**3 pods** sont listés :

- `monitoring-pod`
- `postgres-5b59c7f5ff-scm4n`
- `todo-app-dd5dfc87-2hw4q`

📖 **Définition — Pourquoi cette valeur est fixe** :
Ces 3 pods sont **déployés à l'identique** dans tous les namespaces utilisateur de la formation. C'est une valeur qui ne change **jamais** d'un utilisateur à l'autre.

**Note** : Si vous voyez d'autres pods (comme `welcome-app` ou `client-app`), c'est que vous avez fait les exercices réseau précédents qui ont déployé des pods supplémentaires. Concentrez-vous sur les **3 pods de référence** ci-dessus.
</details>

---

## Partie 2 — CPU Limits (valeurs configurées)

### Question 2

> **Q2** — Dans le tableau **CPU Quota**, quelle est la valeur **CPU Limits** configurée pour le pod `monitoring-pod` ?

<details>
<summary>Voir la réponse</summary>

**`0,05`** (soit 50 millicores)

📖 **Définition — CPU Limits** :
La **CPU maximale autorisée** pour le pod.

**Pourquoi cette valeur** : un pod de monitoring fait des opérations légères (collecte de métriques, healthchecks). 50 millicores (`0,05` CPU) est largement suffisant.

**Cette valeur est fixe** car elle est définie dans le YAML du Deployment :
```yaml
resources:
  limits:
    cpu: 50m
```
</details>

### Question 3

> **Q3** — Dans le tableau **CPU Quota**, quelle est la valeur **CPU Limits** configurée pour le pod `postgres-5b59c7f5ff-scm4n` ?

<details>
<summary>Voir la réponse</summary>

**`0,2`** (soit 200 millicores)

📖 **Définition — Pourquoi PostgreSQL a plus de CPU que monitoring** :
Une base de données comme PostgreSQL doit pouvoir gérer plusieurs requêtes simultanées, des transactions, et l'écriture des WAL (Write-Ahead Logs).

**200 millicores** (`0,2` CPU) est une valeur raisonnable pour une base de test/formation.

**Cette valeur est fixe** car elle est définie dans le YAML du Deployment :
```yaml
resources:
  limits:
    cpu: 200m
```
</details>

### Question 4

> **Q4** — Dans le tableau **CPU Quota**, quelle est la valeur **CPU Limits** configurée pour le pod `todo-app-dd5dfc87-2hw4q` ?

<details>
<summary>Voir la réponse</summary>

**`0,2`** (soit 200 millicores)

📖 **Définition — CPU Limits identiques entre postgres et todo-app** :
`todo-app` et `postgres` ont la **même CPU Limits** (`0,2`) car ce sont **deux applications** qui doivent gérer du trafic.

**Cette valeur est fixe** car elle est définie dans le YAML du Deployment :
```yaml
resources:
  limits:
    cpu: 200m
```
</details>

---

## Partie 3 — CPU Requests (valeurs configurées)

### Question 5

> **Q5** — Dans le tableau **CPU Quota**, quelle est la valeur **CPU Requests** configurée pour les 3 pods ?

<details>
<summary>Voir la réponse</summary>

Les **3 pods** ont la **même CPU Requests** : **`0,001`** (soit 1 millicore)

| Pod | CPU Requests |
|---|---|
| `monitoring-pod` | `0,001` |
| `postgres-5b59c7f5ff-scm4n` | `0,001` |
| `todo-app-dd5dfc87-2hw4q` | `0,001` |

📖 **Définition — Pourquoi des Requests si basses** :
**`0,001` CPU** = 1 millicore = le **minimum** Kubernetes.

C'est volontaire pour cette formation : les pods peuvent **démarrer sur n'importe quel nœud** sans bloquer le scheduling, même sur un cluster fortement sollicité.

⚠️ **En production**, on définit des Requests **plus élevées** et **proches de l'usage réel** pour que le scheduler place les pods sur des nœuds avec assez de ressources.

**Cette valeur est fixe** car elle est définie dans le YAML du Deployment :
```yaml
resources:
  requests:
    cpu: 1m
```
</details>

---

## Partie 4 — Memory (valeurs de configuration)

### Question 6

> **Q6** — Dans le tableau **Memory Usage (RSS)**, quelle est la valeur **RSS** affichée pour le pod `monitoring-pod` ?

<details>
<summary>Voir la réponse</summary>

**`212 KiB`** (soit environ 0,2 Mo)

📖 **Définition — RSS (Resident Set Size)** :
La mémoire **vraiment utilisée** par le processus du pod en RAM physique.

**Pourquoi cette valeur est stable** :
- `monitoring-pod` est un pod **idle** (en attente)
- Il ne fait rien d'autre que rester en vie (sleep infini)
- Sa consommation mémoire est **constante** : ~212 KiB

C'est un excellent exemple de pod **léger** : il consomme moins d'1 Mo de RAM.
</details>

### Question 7

> **Q7** — Dans le tableau **Memory Usage (RSS)**, quelle est la valeur **RSS** affichée pour le pod `postgres-5b59c7f5ff-scm4n` ?

<details>
<summary>Voir la réponse</summary>

**`3,68 MiB`**

📖 **Définition — RSS d'une base de données idle** :
Quand PostgreSQL **n'a aucune requête à traiter** (idle), il garde quand même un **footprint mémoire minimal** pour :
- Le processus principal (postmaster)
- Les processus auxiliaires (autovacuum, stats collector)
- Les buffers internes

**3,68 MiB** est la valeur **stable** d'un PostgreSQL idle dans cette formation.

⚠️ Cette valeur peut **augmenter** si la base reçoit du trafic, mais dans la formation, **personne ne se connecte** à postgres, donc la valeur reste fixe à 3,68 MiB.
</details>

### Question 8

> **Q8** — Dans le tableau **Memory Usage (RSS)**, quelle est la valeur **RSS** affichée pour le pod `todo-app-dd5dfc87-2hw4q` ?

<details>
<summary>Voir la réponse</summary>

**`251,4 MiB`**

📖 **Définition — Pourquoi todo-app consomme autant de mémoire** :
`todo-app` est l'application web avec un **problème de fuite mémoire** intentionnel pour la formation.

Elle alloue progressivement de la mémoire et la **garde sans la libérer**, jusqu'à atteindre une valeur **stable autour de 251 MiB**.

🚨 Cette valeur est **très proche** de la **Memory Limit** configurée du pod (~256 MiB), ce qui explique pourquoi `todo-app` est **à risque** d'OOMKill.

C'est volontaire pour vous apprendre à **détecter une saturation mémoire** dans les exercices suivants (PromQL + alertes).
</details>

---

## Récapitulatif des valeurs FIXES de la formation

À l'issue de cet exercice, vous connaissez les **valeurs de configuration et baseline** des 3 pods :

| Pod | CPU Requests | CPU Limits | RSS (baseline) |
|---|---|---|---|
| `monitoring-pod` | `0,001` | `0,05` | `212 KiB` |
| `postgres-5b59c7f5ff-scm4n` | `0,001` | `0,2` | `3,68 MiB` |
| `todo-app-dd5dfc87-2hw4q` | `0,001` | `0,2` | `251,4 MiB` |

**Ces valeurs sont identiques pour tous les utilisateurs de la formation.** ✅

---

## Récapitulatif

À l'issue de cet exercice, vous savez :

- ✅ Naviguer vers **Observe → Dashboards** et sélectionner le bon dashboard
- ✅ Identifier les **3 pods de référence** d'un namespace utilisateur
- ✅ Lire les **CPU Limits** configurées dans le tableau CPU Quota
- ✅ Lire les **CPU Requests** configurées
- ✅ Lire les **valeurs RSS** (Resident Set Size) de chaque pod
- ✅ Comprendre la différence entre **Requests** et **Limits**
- ✅ Identifier le pod qui consomme le plus de mémoire (`todo-app`)

:::tip Pour aller plus loin
Dans le prochain exercice, vous apprendrez à **explorer les métriques avec PromQL** (page **Observe → Metrics**), puis à **créer une alerte custom** qui se déclenche automatiquement quand `todo-app` approche sa limite mémoire.
:::