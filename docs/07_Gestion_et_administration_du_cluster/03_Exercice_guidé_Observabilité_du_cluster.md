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

---

## Tableau de référence — Valeurs fixes du namespace

### Cartes principales (haut du dashboard)

| Métrique | Valeur |
|---|---|
| CPU Utilisation (from requests) | **23,25 %** |
| CPU Utilisation (from limits) | **0,16 %** |
| Memory Utilisation (from requests) | **94,72 %** |
| Memory Utilisation (from limits) | **47,36 %** |

### Tableau CPU Quota

| Pod | CPU Usage | CPU Requests | CPU Requests % | CPU Limits | CPU Limits % |
|---|---|---|---|---|---|
| `monitoring-pod` | 0 | 0,001 | 0,00 % | 0,05 | 0,00 % |
| `postgres-5b59c7f5ff-scm4n` | 0 | 0,001 | **15,80 %** | 0,2 | 0,08 % |
| `todo-app-dd5dfc87-2hw4q` | 0,001 | 0,001 | **53,95 %** | 0,2 | 0,27 % |

### Tableau Memory Quota

| Pod | Memory Usage | Memory Requests | Memory Requests % | Memory Limits | Memory Limits % | RSS | Cache |
|---|---|---|---|---|---|---|---|
| `monitoring-pod` | 540 KiB | 32 MiB | 1,65 % | 64 MiB | 0,82 % | 212 KiB | 0 B |
| `postgres-5b59c7f5ff-scm4n` | 17,98 MiB | 128 MiB | 14,05 % | 256 MiB | 7,02 % | 3,68 MiB | **10,47 MiB** |
| `todo-app-dd5dfc87-2hw4q` | 254,3 MiB | 128 MiB | **198,65 %** | 256 MiB | **99,33 %** | **251,4 MiB** | 12 KiB |

### Tableau Current Storage IO

| Pod | IOPS Reads | IOPS Writes | Throughput Read | Throughput Write |
|---|---|---|---|---|
| `monitoring-pod` | 0 | 0 | 0 Bps | 0 Bps |
| `postgres-5b59c7f5ff-scm4n` | 0 | **0,067** | 0 Bps | **341,3 Bps** |
| `todo-app-dd5dfc87-2hw4q` | 0 | **0,393** | 0 Bps | **2,41 KBps** |

---

## Partie 1 — CPU

### Question 1.1

> **Q1** — Quelle est la valeur affichée pour **CPU Utilisation (from requests)** dans la première carte en haut du dashboard ?

<details>
<summary>Voir la réponse</summary>

**23,25 %**

Cette métrique indique que les pods de votre namespace consomment **23,25 % de la CPU qu'ils ont réservée** (`requests`). C'est une utilisation modérée.
</details>

### Question 1.2

> **Q2** — Quelle est la valeur affichée pour **CPU Utilisation (from limits)** dans la deuxième carte ?

<details>
<summary>Voir la réponse</summary>

**0,16 %**

Cette valeur est très basse car les `limits` (le maximum autorisé) sont beaucoup plus élevées que les `requests`. Les pods ont donc beaucoup de marge avant d'être limités.
</details>

### Question 1.3

> **Q3** — Dans le tableau **CPU Quota**, quel pod a la valeur **CPU Requests %** la plus élevée ?

<details>
<summary>Voir la réponse</summary>

**`todo-app-dd5dfc87-2hw4q`** avec **53,95 %**.

Voici le classement :
- `todo-app-dd5dfc87-2hw4q` → **53,95 %**
- `postgres-5b59c7f5ff-scm4n` → 15,80 %
- `monitoring-pod` → 0,00 %
</details>

### Question 1.4

> **Q4** — Dans le tableau **CPU Quota**, quelle est la valeur **CPU Limits** du pod `monitoring-pod` ?

<details>
<summary>Voir la réponse</summary>

**0,05** (soit 50 millicores)

Cette valeur est plus basse que celle de `postgres` et `todo-app` (qui ont chacun 0,2). C'est cohérent avec un pod de monitoring léger qui n'a pas besoin de beaucoup de CPU.
</details>

### Question 1.5

> **Q5** — Combien de pods sont listés dans le tableau **CPU Quota** ?

<details>
<summary>Voir la réponse</summary>

**3 pods** :
- `monitoring-pod`
- `postgres-5b59c7f5ff-scm4n`
- `todo-app-dd5dfc87-2hw4q`
</details>

---

## Partie 2 — Memory

### Question 2.1

> **Q6** — Quelle est la valeur affichée pour **Memory Utilisation (from requests)** dans la troisième carte en haut du dashboard ?

<details>
<summary>Voir la réponse</summary>

**94,72 %**

⚠️ Cette valeur est très élevée ! Les pods consomment **presque toute la mémoire qu'ils ont réservée**. C'est un signal d'alerte qu'il faut investiguer.
</details>

### Question 2.2

> **Q7** — Quelle est la valeur affichée pour **Memory Utilisation (from limits)** dans la quatrième carte ?

<details>
<summary>Voir la réponse</summary>

**47,36 %**

Cette valeur indique qu'il reste de la marge avant d'atteindre le maximum autorisé (les `limits`).
</details>

### Question 2.3

> **Q8** — Dans le tableau **Memory Quota**, quelle est la valeur **Memory Limits %** du pod `todo-app-dd5dfc87-2hw4q` ?

<details>
<summary>Voir la réponse</summary>

**99,33 %**

🚨 **C'est dangereux !** Le pod utilise **presque 100 % de sa limite mémoire**. S'il dépasse, il sera **OOMKilled** (Out Of Memory) par Kubernetes.
</details>

### Question 2.4

> **Q9** — Dans le tableau **Memory Quota**, quelle est la valeur **Memory Requests %** du pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**198,65 %**

Cette valeur dépasse 100 %, ce qui signifie que `todo-app` utilise **presque le double de ce qu'il a demandé**. Les `requests` ont été sous-estimées.
</details>

### Question 2.5

> **Q10** — Pour le pod `postgres-5b59c7f5ff-scm4n`, quelle est la valeur **Memory Usage (RSS)** affichée dans le tableau ?

<details>
<summary>Voir la réponse</summary>

**3,68 MiB**

Le **RSS** est la mémoire **vraiment utilisée** par le processus. C'est la métrique critique pour évaluer la pression mémoire réelle.
</details>

### Question 2.6

> **Q11** — Pour le pod `postgres-5b59c7f5ff-scm4n`, quelle est la valeur **Memory Usage (Cache)** affichée dans le tableau ?

<details>
<summary>Voir la réponse</summary>

**10,47 MiB**

Le cache peut être **libéré par le système** si nécessaire. Il ne représente pas une "vraie" pression mémoire.
</details>

### Question 2.7

> **Q12** — Quel pod a la valeur **Memory Usage (RSS)** la plus élevée dans le tableau ?

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

Le pic le plus élevé atteint environ **2 Bps** vers **9:17 AM**.

C'est probablement dû à un test `curl` effectué pendant les exercices précédents.
</details>

### Question 3.4

> **Q16** — Dans la section **Rate of Packets Dropped**, quelle est la valeur observée pour les paquets perdus en réception ?

<details>
<summary>Voir la réponse</summary>

**0 pps** sur toute la période.

✅ Aucun paquet n'est perdu, le réseau fonctionne correctement.
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

**341,3 Bps**

`postgres` écrit environ 341 octets par seconde, ce qui est très faible. C'est cohérent avec un PostgreSQL en attente d'activité (idle).
</details>

### Question 4.4

> **Q20** — Quel pod a la valeur **Throughput(Write)** la plus élevée dans le tableau ?

<details>
<summary>Voir la réponse</summary>

**`todo-app-dd5dfc87-2hw4q`** avec **2,41 KBps**.

Voici le classement :
- `todo-app-dd5dfc87-2hw4q` → **2,41 KBps**
- `postgres-5b59c7f5ff-scm4n` → 341,3 Bps
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
- 🚨 **Memory Limits % = 99,33 %** → risque imminent d'OOMKill
- ⚠️ **Memory Requests % = 198,65 %** → les requests sont sous-estimées
- ⚠️ **CPU Requests % = 53,95 %** → consommation soutenue
- 📊 **Throughput(Write) = 2,41 KBps** → c'est aussi le pod le plus actif en écriture
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
- ✅ Détecter une **saturation mémoire** : `todo-app` à 99,33 % de Memory Limits
- ✅ Lire les métriques **Network** (Bandwidth, Rate of Packets, Packets Dropped)
- ✅ Lire les métriques **Storage IO** (IOPS, Throughput)
- ✅ **Diagnostiquer** un namespace en synthétisant plusieurs métriques
- ✅ Utiliser **"Inspect"** pour passer du dashboard à PromQL

:::tip Pour aller plus loin
Dans le prochain exercice, vous apprendrez à **explorer les métriques avec PromQL** (page **Observe → Metrics**), puis à **créer une alerte custom** qui se déclenche automatiquement quand un pod approche sa limite mémoire.
:::