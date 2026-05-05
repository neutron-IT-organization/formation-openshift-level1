---
id: Exercice_dashboards_observe
slug: /Observability/Exercice_dashboards_observe
---

# Exercice Guidé : Lire les Dashboards dans OpenShift Observe

## Ce que vous allez apprendre

Dans cet exercice, vous allez **explorer les dashboards intégrés** d'OpenShift et **répondre à des questions** sur les métriques affichées dans la console.

L'objectif est de **développer votre capacité à lire et naviguer** dans les différentes sections du dashboard pour diagnostiquer un namespace.

## Objectifs

- [ ] Naviguer dans **Observe → Dashboards** et choisir le bon dashboard.
- [ ] Lire les métriques **CPU** d'un namespace.
- [ ] Lire les métriques **Memory** (RSS, Cache, Limits).
- [ ] Lire les métriques **Network** (Bandwidth, Packets).
- [ ] Lire les métriques **Storage IO** (IOPS, Throughput).
- [ ] Identifier le pod qui pose problème dans un namespace.

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
- **`postgres-5b59c7f5ff-scm4n`** : base de données PostgreSQL (en attente d'activité)
- **`todo-app-dd5dfc87-2hw4q`** : application web avec un problème de mémoire

Les valeurs présentées dans cet exercice correspondent à l'état stable de ces 3 pods. Quel que soit votre namespace, vous devriez observer des valeurs très similaires.
:::

---

## Tableau de référence — Valeurs fixes du namespace

### Cartes principales (haut du dashboard)

| Métrique | Valeur |
|---|---|
| CPU Utilisation (from requests) | **21,97 %** |
| CPU Utilisation (from limits) | **0,15 %** |
| Memory Utilisation (from requests) | **94,70 %** |
| Memory Utilisation (from limits) | **47,35 %** |

### Tableau CPU Quota

| Pod | CPU Usage | CPU Requests | CPU Requests % | CPU Limits | CPU Limits % |
|---|---|---|---|---|---|
| `monitoring-pod` | 0 | 0,001 | 0,00 % | 0,05 | 0,00 % |
| `postgres-5b59c7f5ff-scm4n` | 0 | 0,001 | **13,53 %** | 0,2 | 0,07 % |
| `todo-app-dd5dfc87-2hw4q` | 0,001 | 0,001 | **52,37 %** | 0,2 | 0,26 % |

### Tableau Memory Quota

| Pod | Memory Usage | Memory Requests % | Memory Limits % | RSS | Cache |
|---|---|---|---|---|---|
| `monitoring-pod` | 540 KiB | 1,65 % | 0,82 % | 212 KiB | 0 B |
| `postgres-5b59c7f5ff-scm4n` | 17,91 MiB | 14,00 % | 7,00 % | 3,68 MiB | **10,46 MiB** |
| `todo-app-dd5dfc87-2hw4q` | 254,3 MiB | **198,68 %** | **99,34 %** | **251,4 MiB** | 32 KiB |

### Tableau Current Storage IO

| Pod | IOPS Writes | Throughput Write |
|---|---|---|
| `monitoring-pod` | 0 | 0 Bps |
| `postgres-5b59c7f5ff-scm4n` | **0,069** | **352,7 Bps** |
| `todo-app-dd5dfc87-2hw4q` | **0,393** | **2,41 KBps** |

---

## Partie 1 — CPU

### Question 1.1

> **Q1** — Quelle est la valeur affichée pour **CPU Utilisation (from requests)** dans la première carte en haut du dashboard ?

<details>
<summary>Voir la réponse</summary>

**21,97 %**

Cette métrique indique que les pods de votre namespace consomment **21,97 % de la CPU qu'ils ont réservée** (`requests`). C'est une utilisation modérée.
</details>

### Question 1.2

> **Q2** — Quelle est la valeur affichée pour **CPU Utilisation (from limits)** dans la deuxième carte ?

<details>
<summary>Voir la réponse</summary>

**0,15 %**

Cette valeur est très basse car les `limits` (le maximum autorisé) sont beaucoup plus élevées que les `requests`. Les pods ont donc beaucoup de marge avant d'être limités.
</details>

### Question 1.3

> **Q3** — Combien de pods sont listés dans le tableau **CPU Quota** ?

<details>
<summary>Voir la réponse</summary>

**3 pods** :
- `monitoring-pod`
- `postgres-5b59c7f5ff-scm4n`
- `todo-app-dd5dfc87-2hw4q`
</details>

### Question 1.4

> **Q4** — Dans le tableau **CPU Quota**, quel pod a la valeur **CPU Requests %** la plus élevée ?

<details>
<summary>Voir la réponse</summary>

**`todo-app-dd5dfc87-2hw4q`** avec **52,37 %**.

Voici le classement :
- `todo-app-dd5dfc87-2hw4q` → **52,37 %**
- `postgres-5b59c7f5ff-scm4n` → 13,53 %
- `monitoring-pod` → 0,00 %
</details>

### Question 1.5

> **Q5** — Dans le tableau **CPU Quota**, quelle est la valeur **CPU Limits** du pod `monitoring-pod` ?

<details>
<summary>Voir la réponse</summary>

**0,05** (soit 50 millicores)

Cette valeur est plus basse que celle de `postgres` et `todo-app` (qui ont chacun 0,2). C'est cohérent avec un pod de monitoring léger qui n'a pas besoin de beaucoup de CPU.
</details>

---

## Partie 2 — Memory

### Question 2.1

> **Q6** — Quelle est la valeur affichée pour **Memory Utilisation (from requests)** dans la troisième carte en haut du dashboard ?

<details>
<summary>Voir la réponse</summary>

**94,70 %**

⚠️ Cette valeur est très élevée ! Les pods consomment **presque toute la mémoire qu'ils ont réservée**. C'est un signal d'alerte qu'il faut investiguer.
</details>

### Question 2.2

> **Q7** — Quelle est la valeur affichée pour **Memory Utilisation (from limits)** dans la quatrième carte ?

<details>
<summary>Voir la réponse</summary>

**47,35 %**

Cette valeur indique qu'il reste de la marge avant d'atteindre le maximum autorisé (les `limits`).
</details>

### Question 2.3

> **Q8** — Dans le tableau **Memory Quota**, quelle est la valeur **Memory Limits %** du pod `todo-app-dd5dfc87-2hw4q` ?

<details>
<summary>Voir la réponse</summary>

**99,34 %**

🚨 **C'est dangereux !** Le pod utilise **presque 100 % de sa limite mémoire**. S'il dépasse, il sera **OOMKilled** (Out Of Memory) par Kubernetes.
</details>

### Question 2.4

> **Q9** — Dans le tableau **Memory Quota**, quelle est la valeur **Memory Requests %** du pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**198,68 %**

Cette valeur dépasse 100 %, ce qui signifie que `todo-app` utilise **presque le double de ce qu'il a demandé**. Les `requests` ont été sous-estimées.
</details>

### Question 2.5

> **Q10** — Pour le pod `postgres-5b59c7f5ff-scm4n`, quelle est la valeur **Memory Usage (RSS)** ?

<details>
<summary>Voir la réponse</summary>

**3,68 MiB**

Le **RSS** est la mémoire **vraiment utilisée** par le processus. C'est la métrique critique pour évaluer la pression mémoire réelle.
</details>

### Question 2.6

> **Q11** — Pour le pod `postgres-5b59c7f5ff-scm4n`, quelle est la valeur **Memory Usage (Cache)** ?

<details>
<summary>Voir la réponse</summary>

**10,46 MiB**

Le cache peut être **libéré par le système** si nécessaire. Il ne représente pas une "vraie" pression mémoire.
</details>

### Question 2.7

> **Q12** — Quel pod a la valeur **Memory Usage (RSS)** la plus élevée ?

<details>
<summary>Voir la réponse</summary>

**`todo-app-dd5dfc87-2hw4q`** avec **251,4 MiB** de RSS.

Voici le classement :
- `todo-app-dd5dfc87-2hw4q` → **251,4 MiB**
- `postgres-5b59c7f5ff-scm4n` → 3,68 MiB
- `monitoring-pod` → 212 KiB
</details>

---

## Partie 3 — Network

### Question 3.1

> **Q13** — Dans la section **Current Network Usage**, quelle est la valeur **Current Receive Bandwidth** du pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**0 Bps**

Cela signifie qu'à l'instant T, **aucun trafic n'arrive** vers `todo-app`. C'est normal s'il n'y a pas d'utilisateur actif.
</details>

### Question 3.2

> **Q14** — Dans la section **Current Network Usage**, quelle est la valeur **Rate of Received Packets** du pod `monitoring-pod` ?

<details>
<summary>Voir la réponse</summary>

**0 pps**

Aucun paquet reçu à l'instant T pour `monitoring-pod`.
</details>

### Question 3.3

> **Q15** — Dans la section **Bandwidth**, regardez le graphique **Receive Bandwidth**. Quelle est la valeur du pic le plus élevé observé ?

<details>
<summary>Voir la réponse</summary>

Le pic le plus élevé atteint environ **3 Bps** vers **11:15 AM**.

C'est probablement dû à un test `curl` effectué pendant les exercices précédents (par exemple lors de la communication Pod-à-Pod).
</details>

### Question 3.4

> **Q16** — Dans la section **Rate of Packets**, regardez le graphique **Rate of Received Packets**. Quelle est la valeur du pic le plus élevé ?

<details>
<summary>Voir la réponse</summary>

Le pic le plus élevé atteint environ **0,04 pps** vers **11:15 AM**.

Cela représente environ 0,04 paquets par seconde, ce qui est très faible. Cela correspond à quelques requêtes `curl` ponctuelles, et non à un trafic continu.
</details>
---

## Partie 4 — Storage IO

### Question 4.1

> **Q17** — Dans le tableau **Current Storage IO**, quelle est la valeur **IOPS(Writes)** du pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**0,393**

Le pod fait environ 0,4 opérations d'écriture par seconde sur le disque.
</details>

### Question 4.2

> **Q18** — Dans le tableau **Current Storage IO**, quelle est la valeur **Throughput(Write)** du pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**2,41 KBps**

`todo-app` écrit environ **2,4 Ko de données par seconde** sur le disque.
</details>

### Question 4.3

> **Q19** — Dans le tableau **Current Storage IO**, quelle est la valeur **Throughput(Write)** du pod `postgres` ?

<details>
<summary>Voir la réponse</summary>

**352,7 Bps**

`postgres` écrit environ 353 octets par seconde, ce qui est très faible. C'est cohérent avec un PostgreSQL en attente d'activité (idle).
</details>

### Question 4.4

> **Q20** — Quel pod a la valeur **Throughput(Write)** la plus élevée ?

<details>
<summary>Voir la réponse</summary>

**`todo-app-dd5dfc87-2hw4q`** avec **2,41 KBps**.

Voici le classement :
- `todo-app-dd5dfc87-2hw4q` → **2,41 KBps**
- `postgres-5b59c7f5ff-scm4n` → 352,7 Bps
- `monitoring-pod` → 0 Bps
</details>

---

## Partie 5 — Synthèse

### Question 5.1

> **Q21** — En vous basant sur **toutes** les valeurs lues précédemment, quel pod nécessite votre attention en **priorité** dans ce namespace ?

<details>
<summary>Voir la réponse</summary>

**`todo-app-dd5dfc87-2hw4q`** nécessite votre attention.

**Cumul de signaux d'alerte** :
- 🚨 **Memory Limits % = 99,34 %** → risque imminent d'OOMKill
- ⚠️ **Memory Requests % = 198,68 %** → les requests sont sous-estimées
- ⚠️ **CPU Requests % = 52,37 %** → consommation soutenue
- 📊 **Throughput(Write) = 2,41 KBps** → c'est aussi le pod le plus actif en écriture
- 📊 **Memory RSS = 251,4 MiB** → le pod qui consomme le plus de mémoire
</details>

### Question 5.2

> **Q22** — Cliquez sur le lien **"Inspect"** à côté du graphique **CPU Usage**. Vers quelle page êtes-vous redirigé ?

<details>
<summary>Voir la réponse</summary>

Vous êtes redirigé vers la page **Observe → Metrics** avec une **requête PromQL** déjà préremplie.

Cela permet de **passer du dashboard à l'analyse fine** rapidement, et de modifier la requête pour ajouter des filtres ou comparer plusieurs métriques.
</details>

---

## Récapitulatif

À l'issue de cet exercice, vous savez :

- ✅ Naviguer vers **Observe → Dashboards** et sélectionner le bon dashboard
- ✅ Lire les métriques **CPU** dans les cartes principales et le tableau Quota
- ✅ Lire les métriques **Memory** (Usage, RSS, Cache, Requests, Limits)
- ✅ Détecter une **saturation mémoire** : `todo-app` à 99,34 % de Memory Limits
- ✅ Lire les métriques **Network** (Bandwidth, Rate of Packets, Packets Dropped)
- ✅ Lire les métriques **Storage IO** (IOPS, Throughput)
- ✅ **Diagnostiquer** un namespace en synthétisant plusieurs métriques
- ✅ Utiliser **"Inspect"** pour passer du dashboard à PromQL

:::tip Pour aller plus loin
Dans le prochain exercice, vous apprendrez à **explorer les métriques avec PromQL** (page **Observe → Metrics**), puis à **créer une alerte custom** qui se déclenche automatiquement quand un pod approche sa limite mémoire.
:::