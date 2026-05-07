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

📖 **Définition — CPU Utilisation (from requests)** :
Pourcentage de la **CPU réservée** (requests) qui est **réellement utilisée** par les pods du namespace.

**Formule** : `(CPU utilisée / CPU réservée) × 100`

**Interprétation** :
- 🟢 0-50 % → ressources sous-utilisées (peut-être trop réservées)
- 🟡 50-80 % → utilisation normale
- 🔴 80-100 % → besoin d'augmenter les requests

Cette valeur de **21,97 %** indique que les pods consomment ~22 % de la CPU qu'ils ont réservée. C'est une utilisation modérée.
</details>

### Question 1.2

> **Q2** — Quelle est la valeur affichée pour **CPU Utilisation (from limits)** dans la deuxième carte ?

<details>
<summary>Voir la réponse</summary>

**0,15 %**

📖 **Définition — CPU Utilisation (from limits)** :
Pourcentage de la **CPU maximale autorisée** (limits) qui est **réellement utilisée**.

**Formule** : `(CPU utilisée / CPU maximale) × 100`

**Différence avec requests** : les `limits` sont généralement **plus élevées** que les `requests`, donc cette valeur est souvent **plus basse**.

**Interprétation** :
- 🟢 < 80 % → marge confortable
- 🔴 > 80 % → risque de **CPU throttling** (le pod est ralenti)

Cette valeur très basse (0,15 %) indique que les pods ont **beaucoup de marge** avant d'être limités.
</details>

### Question 1.3

> **Q3** — Combien de pods sont listés dans le tableau **CPU Quota** ?

<details>
<summary>Voir la réponse</summary>

**3 pods** :
- `monitoring-pod`
- `postgres-5b59c7f5ff-scm4n`
- `todo-app-dd5dfc87-2hw4q`

📖 **Définition — Tableau CPU Quota** :
Tableau qui détaille la **consommation CPU pod par pod** dans le namespace.

**Colonnes affichées** :
- `CPU Usage` → CPU réellement utilisée
- `CPU Requests` → CPU réservée
- `CPU Requests %` → % d'utilisation par rapport aux requests
- `CPU Limits` → CPU maximale autorisée
- `CPU Limits %` → % d'utilisation par rapport aux limits

Ce tableau permet d'**identifier le pod qui consomme le plus** de CPU.
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

📖 **Définition — CPU Requests %** :
Pour **chaque pod**, le pourcentage de la CPU réservée qui est utilisée.

**Comment lire** :
- 🟢 < 50 % → pod peu actif
- 🟡 50-100 % → pod actif (utilisation normale)
- 🔴 > 100 % → pod **dépasse** ses requests (peut affecter les voisins)

⚠️ Une valeur > 100 % signifie que le pod **utilise plus** que ce qu'il a demandé. Kubernetes le tolère tant que les `limits` ne sont pas atteintes.
</details>

### Question 1.5

> **Q5** — Dans le tableau **CPU Quota**, quelle est la valeur **CPU Limits** du pod `monitoring-pod` ?

<details>
<summary>Voir la réponse</summary>

**0,05** (soit 50 millicores)

Cette valeur est plus basse que celle de `postgres` et `todo-app` (qui ont chacun 0,2). C'est cohérent avec un pod de monitoring léger.

📖 **Définition — CPU Limits (cores / millicores)** :
La CPU **maximale autorisée** pour le pod.

**Unités** :
- `1` = 1 CPU complet
- `0,5` = 500 millicores (1/2 CPU)
- `0,2` = 200 millicores (1/5 CPU)
- `0,05` = 50 millicores (1/20 CPU) → pour pods très légers

**Bonne pratique** : définir une limit cohérente avec le rôle du pod (un monitoring n'a pas besoin de 1 CPU).
</details>

---

## Partie 2 — Memory

### Question 2.1

> **Q6** — Quelle est la valeur affichée pour **Memory Utilisation (from requests)** dans la troisième carte en haut du dashboard ?

<details>
<summary>Voir la réponse</summary>

**94,70 %**

⚠️ Cette valeur est très élevée ! Les pods consomment **presque toute la mémoire qu'ils ont réservée**. C'est un signal d'alerte qu'il faut investiguer.

📖 **Définition — Memory Utilisation (from requests)** :
Pourcentage de la **mémoire réservée** (requests) qui est **réellement utilisée** par les pods.

**Formule** : `(Mémoire utilisée / Mémoire réservée) × 100`

⚠️ Cette métrique est **plus critique que la CPU** car la mémoire ne se "throttle" pas — un pod qui dépasse sa limite mémoire est **tué** (OOMKilled).

**Interprétation** :
- 🟢 < 80 % → utilisation normale
- 🟡 80-100 % → vigilance
- 🔴 > 100 % → les requests sont sous-estimées
</details>

### Question 2.2

> **Q7** — Quelle est la valeur affichée pour **Memory Utilisation (from limits)** dans la quatrième carte ?

<details>
<summary>Voir la réponse</summary>

**47,35 %**

Cette valeur indique qu'il reste de la marge avant d'atteindre le maximum autorisé.

📖 **Définition — Memory Utilisation (from limits)** :
Pourcentage de la **mémoire maximale autorisée** (limits) qui est **réellement utilisée**.

**Différence avec requests** : les `limits` sont le **vrai plafond** — au-delà, le pod est **OOMKilled**.

**Interprétation** :
- 🟢 < 70 % → marge confortable
- 🟡 70-90 % → vigilance accrue
- 🔴 > 90 % → **risque imminent** d'OOMKill
</details>

### Question 2.3

> **Q8** — Dans le tableau **Memory Quota**, quelle est la valeur **Memory Limits %** du pod `todo-app-dd5dfc87-2hw4q` ?

<details>
<summary>Voir la réponse</summary>

**99,34 %**

🚨 **C'est dangereux !** Le pod utilise **presque 100 % de sa limite mémoire**. S'il dépasse, il sera **OOMKilled** par Kubernetes.

📖 **Définition — Memory Limits %** :
Pour **chaque pod**, le pourcentage de la mémoire maximale qui est utilisée.

⚠️ **Indicateur le plus critique** car c'est ce qui détermine si un pod va être **OOMKilled**.

**Seuils d'alerte** :
- 🟢 < 70 % → OK
- 🟡 70-90 % → surveiller
- 🔴 90-100 % → **tueur silencieux** (OOMKill imminent)
- 💀 > 100 % → impossible (le pod est déjà mort)

📖 **Définition — OOMKilled (Out Of Memory Killed)** :
Le pod a dépassé sa limite mémoire et a été **tué par le kernel**. Il sera redémarré automatiquement, mais il y aura une **interruption de service**.
</details>

### Question 2.4

> **Q9** — Dans le tableau **Memory Quota**, quelle est la valeur **Memory Requests %** du pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**198,68 %**

Cette valeur dépasse 100 %, ce qui signifie que `todo-app` utilise **presque le double de ce qu'il a demandé**. Les `requests` ont été sous-estimées.

📖 **Définition — Memory Requests % > 100 %** :
Si le pourcentage dépasse 100 %, le pod **utilise plus** que ce qu'il a réservé.

**Cause** : les **requests sont sous-estimées** par rapport à l'usage réel.

**Conséquences** :
- ⚠️ Le **scheduler Kubernetes** peut placer le pod sur un nœud insuffisant
- ⚠️ Risque d'**éviction** si le nœud est saturé
- ✅ **Solution** : augmenter les `requests` à une valeur réaliste
</details>

### Question 2.5

> **Q10** — Pour le pod `postgres-5b59c7f5ff-scm4n`, quelle est la valeur **Memory Usage (RSS)** ?

<details>
<summary>Voir la réponse</summary>

**3,68 MiB**

📖 **Définition — RSS (Resident Set Size)** :
La mémoire **vraiment utilisée** par le processus du pod (en RAM).

**C'est la métrique critique** pour évaluer la pression mémoire réelle.

**À ne pas confondre avec** :
- `Memory Usage` → RSS + Cache (somme des deux)
- `Cache` → mémoire pour les fichiers, **libérable** si besoin

**Important** : c'est le **RSS** qui compte pour OOMKill, pas le `Memory Usage` total.
</details>

### Question 2.6

> **Q11** — Pour le pod `postgres-5b59c7f5ff-scm4n`, quelle est la valeur **Memory Usage (Cache)** ?

<details>
<summary>Voir la réponse</summary>

**10,46 MiB**

Le cache peut être **libéré par le système** si nécessaire. Il ne représente pas une "vraie" pression mémoire.

📖 **Définition — Cache (Page Cache)** :
Mémoire utilisée pour **mettre en cache des fichiers** lus depuis le disque.

**Particularité** : le cache peut être **libéré par le kernel** à tout moment si besoin de RAM.

**Donc** : un cache élevé n'est **pas** un signal d'alerte → le système peut s'en débarrasser facilement.

**Exemple typique** : PostgreSQL met en cache les pages disque pour accélérer les requêtes.
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

📖 **Définition — Pourquoi comparer le RSS entre pods** :
Identifier le pod qui **consomme le plus de mémoire réellement utile**.

**Ne pas confondre** :
- Total Memory Usage → peut être trompeur (cache inclus)
- RSS → vraie pression mémoire

**Action** : pour optimiser, regarder les pods avec le **RSS le plus élevé** en premier.
</details>

---

## Partie 3 — Network

### Question 3.1

> **Q13** — Dans la section **Current Network Usage**, quelle est la valeur **Current Receive Bandwidth** du pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**0 Bps**

Cela signifie qu'à l'instant T, **aucun trafic n'arrive** vers `todo-app`. C'est normal s'il n'y a pas d'utilisateur actif.

📖 **Définition — Current Receive Bandwidth** :
Débit de **trafic entrant** vers un pod (bytes par seconde).

**Unités** :
- `Bps` (Bytes/seconde) → faible
- `KBps` (Kilobytes/seconde) → moyen
- `MBps` (Megabytes/seconde) → élevé

**À l'instant T** : valeur **ponctuelle** (pas une moyenne).

**Interprétation** :
- `0 Bps` → aucun trafic entrant en ce moment
- valeur élevée → le pod **reçoit beaucoup de requêtes**
</details>

### Question 3.2

> **Q14** — Dans la section **Current Network Usage**, quelle est la valeur **Rate of Received Packets** du pod `monitoring-pod` ?

<details>
<summary>Voir la réponse</summary>

**0 pps**

Aucun paquet reçu à l'instant T pour `monitoring-pod`.

📖 **Définition — Rate of Received Packets** :
Nombre de **paquets réseau** reçus par seconde.

**Unité** : `pps` (packets per second).

**Différence avec Bandwidth** :
- `Bandwidth` → **volume** de données (octets)
- `Rate of Packets` → **nombre** de paquets

**Pourquoi c'est utile** : un grand nombre de petits paquets peut indiquer une **attaque** (SYN flood) ou un **mauvais design** (trop de petites requêtes).
</details>

### Question 3.3

> **Q15** — Dans la section **Bandwidth**, regardez le graphique **Receive Bandwidth**. Quelle est la valeur du pic le plus élevé observé ?

<details>
<summary>Voir la réponse</summary>

Le pic le plus élevé atteint environ **3 Bps** vers **11:15 AM**.

C'est probablement dû à un test `curl` effectué pendant les exercices précédents (par exemple lors de la communication Pod-à-Pod).

📖 **Définition — Graphique Bandwidth (historique)** :
Graphique qui montre l'**évolution** du Bandwidth dans le temps (sur 30 min par défaut).

**Comment lire** :
- Axe X → temps
- Axe Y → débit (bytes/sec)
- Pic → moment où le trafic était maximum
- Vallée → moment où le trafic était minimum

**Différence avec "Current Bandwidth"** :
- `Current` → valeur instantanée
- `Graphique` → tendance sur 30 min
</details>

### Question 3.4

> **Q16** — Dans la section **Rate of Packets**, regardez le graphique **Rate of Received Packets**. Quelle est la valeur du pic le plus élevé ?

<details>
<summary>Voir la réponse</summary>

Le pic le plus élevé atteint environ **0,04 pps** vers **11:15 AM**.

Cela représente environ 0,04 paquets par seconde, ce qui est très faible.

📖 **Définition — Graphique Rate of Packets** :
Graphique qui montre l'**évolution** du nombre de paquets reçus par seconde dans le temps.

**Pourquoi 2 graphiques distincts (Bandwidth + Rate of Packets)** :
- Quelques **gros paquets** = bandwidth élevé, peu de paquets
- Beaucoup de **petits paquets** = bandwidth faible, beaucoup de paquets

→ Les 2 graphiques donnent des **informations complémentaires** sur le trafic réseau.
</details>

---

## Partie 4 — Storage IO

### Question 4.1

> **Q17** — Dans le tableau **Current Storage IO**, quelle est la valeur **IOPS(Writes)** du pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**0,393**

Le pod fait environ 0,4 opérations d'écriture par seconde sur le disque.

📖 **Définition — IOPS (Input/Output Operations Per Second)** :
Nombre d'opérations **disque par seconde** (lectures et écritures).

**Différence Reads vs Writes** :
- `IOPS Reads` → opérations de lecture
- `IOPS Writes` → opérations d'écriture

**Interprétation** :
- 🟢 < 10 IOPS → faible
- 🟡 10-100 IOPS → moyen
- 🔴 > 1000 IOPS → élevé (vérifier si normal)

**Cas d'usage** : une base de données fait souvent **beaucoup d'IOPS** (logs, transactions).
</details>

### Question 4.2

> **Q18** — Dans le tableau **Current Storage IO**, quelle est la valeur **Throughput(Write)** du pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**2,41 KBps**

`todo-app` écrit environ **2,4 Ko de données par seconde** sur le disque.

📖 **Définition — Throughput (Débit disque)** :
**Volume de données** écrites/lues par seconde sur le disque.

**Unités** :
- `Bps` → octets/sec (très faible)
- `KBps` → Ko/sec (faible)
- `MBps` → Mo/sec (moyen)
- `GBps` → Go/sec (élevé)

**Différence avec IOPS** :
- `IOPS` → **nombre** d'opérations
- `Throughput` → **volume** de données

**Exemple** : 100 IOPS de 1 KB chacun = 100 KBps de Throughput.
</details>

### Question 4.3

> **Q19** — Dans le tableau **Current Storage IO**, quelle est la valeur **Throughput(Write)** du pod `postgres` ?

<details>
<summary>Voir la réponse</summary>

**352,7 Bps**

`postgres` écrit environ 353 octets par seconde, ce qui est très faible. C'est cohérent avec un PostgreSQL en attente d'activité (idle).

📖 **Définition — Throughput d'une base de données** :
Une base de données comme PostgreSQL écrit en permanence pour :
- Les **transactions logs (WAL)**
- Les **commits**
- Les **statistiques**

Donc même **idle**, elle a un Throughput non-nul.

**Interprétation** :
- **Bps faibles** (< 1 KB/s) → base **inactive** (pas de requêtes utilisateurs)
- **KBps moyens** → base **active** avec quelques requêtes
- **MBps** → base sous **forte charge**
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

📖 **Définition — Pourquoi comparer le Throughput entre pods** :
Identifier le pod qui **génère le plus d'écritures disque**.

**Cas d'usage** :
- 🔍 **Diagnostic** : un pod qui écrit beaucoup peut **saturer le disque** d'un nœud
- 📊 **Capacité** : prévoir la **taille des PVCs** nécessaires
- 💰 **Coût** : sur cloud, les IOPS et le Throughput sont **facturés**
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

📖 **Définition — Diagnostic SRE par cumul de signaux** :
Un bon diagnostic ne se fait **jamais** sur une seule métrique.

**Étapes** :
1. **Lister** toutes les métriques anormales du namespace
2. **Identifier** le pod qui apparaît dans plusieurs anomalies
3. **Prioriser** par criticité (Memory Limits > CPU Limits > Throughput)

**Règle d'or** : si un pod apparaît dans **3+ alertes**, il **doit être investigué en priorité**.
</details>

### Question 5.2

> **Q22** — Cliquez sur le lien **"Inspect"** à côté du graphique **CPU Usage**. Vers quelle page êtes-vous redirigé ?

<details>
<summary>Voir la réponse</summary>

Vous êtes redirigé vers la page **Observe → Metrics** avec une **requête PromQL** déjà préremplie.

Cela permet de **passer du dashboard à l'analyse fine** rapidement, et de modifier la requête pour ajouter des filtres ou comparer plusieurs métriques.

📖 **Définition — Bouton "Inspect" — du dashboard à PromQL** :
Bouton **à côté de chaque graphique** qui ouvre la requête **PromQL sous-jacente**.

**Pourquoi c'est utile** :
- 🔍 Le dashboard montre la **vue globale**
- 🎯 PromQL permet de **filtrer, comparer, ajouter des conditions**

**Exemple** :
- Dashboard : "CPU Usage du namespace"
- PromQL après Inspect : `sum(rate(container_cpu_usage_seconds_total{namespace="paris-user-ns"}[5m]))`

**Cas d'usage** : passer du **dashboard au debug fin** en 1 clic.
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