---
id: Exercice_dashboards_observe
slug: /Observability/Exercice_dashboards_observe
---

# Exercice Guidé : Lire les Dashboards dans OpenShift Observe

## Ce que vous allez apprendre

Dans cet exercice, vous allez **explorer les dashboards intégrés** d'OpenShift et **répondre à des questions** en lisant les métriques affichées dans la console.

L'objectif est de **développer votre capacité à diagnostiquer** un namespace en lisant les bons graphiques, sans avoir à écrire de requêtes PromQL.

## Objectifs

- [ ] Naviguer dans **Observe → Dashboards** et choisir le bon dashboard.
- [ ] Lire les métriques **CPU** d'un namespace (Utilisation, Quota, Requests/Limits).
- [ ] Lire les métriques **Memory** (Utilisation, Quota, RSS, Cache, Swap).
- [ ] Lire les métriques **Network** (Bandwidth, Rate of Packets, Packets Dropped).
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

:::tip Naviguer dans les sections
Le dashboard est divisé en plusieurs sections : **CPU Usage, CPU Quota, Memory Usage, Memory Quota, Current Network Usage, Bandwidth, Rate of Packets, Rate of Packets Dropped, Storage IO**. Faites défiler verticalement pour les voir.
:::

---

## Partie 1 — CPU

### Question 1.1

Regardez les **4 cartes principales** en haut du dashboard.

> **Q1** — Quelle est la valeur affichée pour **CPU Utilisation (from requests)** ?

<details>
<summary>Voir la réponse</summary>

La valeur attendue est de l'ordre de **21,04 %**.

Cette métrique indique que les pods de votre namespace consomment **21 % de la CPU qu'ils ont réservée** (`requests`). C'est une utilisation **modérée**, il reste de la marge.
</details>

### Question 1.2

> **Q2** — Quelle est la valeur affichée pour **CPU Utilisation (from limits)** ?

<details>
<summary>Voir la réponse</summary>

La valeur attendue est de l'ordre de **0,14 %**.

Cette valeur est très basse car les `limits` (le maximum autorisé) sont beaucoup plus élevées que les `requests`. Les pods ont donc beaucoup de marge avant d'être limités.
</details>

### Question 1.3

Faites défiler jusqu'à la section **CPU Quota** et regardez le tableau.

> **Q3** — Combien de pods sont listés dans le tableau **CPU Quota** ?

<details>
<summary>Voir la réponse</summary>

Le tableau liste **3 pods** :
- `monitoring-pod`
- `postgres-5b59c7f5ff-scm4n`
- `todo-app-dd5dfc87-2hw4q`

(Les pods éphémères ou récemment créés peuvent ne pas apparaître immédiatement dans le tableau.)
</details>

### Question 1.4

> **Q4** — Quel pod a le **CPU Requests % le plus élevé** ?

<details>
<summary>Voir la réponse</summary>

C'est **`todo-app-dd5dfc87-2hw4q`** avec **54,05 %**.

Ce pod consomme la moitié de la CPU qu'il a réservée. C'est élevé mais pas critique.
</details>

### Question 1.5

> **Q5** — Quel est le **CPU Limits %** du pod `todo-app` ? Que peut-on en conclure ?

<details>
<summary>Voir la réponse</summary>

**CPU Limits %** = **0,27 %**

On peut conclure que le pod `todo-app` :
- Utilise **54 %** de ce qu'il a demandé (`requests`)
- N'utilise que **0,27 %** de son maximum (`limits`)
- A donc **beaucoup de marge** avant d'être étranglé (CPU throttling)

C'est typique d'un pod avec des `limits` très généreuses par rapport aux `requests`.
</details>

---

## Partie 2 — Memory

### Question 2.1

Revenez tout en haut du dashboard.

> **Q6** — Quelle est la valeur affichée pour **Memory Utilisation (from requests)** ?

<details>
<summary>Voir la réponse</summary>

La valeur est de l'ordre de **94,71 %**.

⚠️ **Attention** : c'est très élevé ! Les pods consomment **presque toute la mémoire qu'ils ont réservée**. C'est un signal d'alerte qu'il faut investiguer.
</details>

### Question 2.2

> **Q7** — Quelle est la valeur affichée pour **Memory Utilisation (from limits)** ?

<details>
<summary>Voir la réponse</summary>

La valeur est de l'ordre de **47,36 %**.

Cette valeur est plus rassurante car elle indique qu'il reste **52 % de marge** avant d'atteindre le maximum autorisé. Mais attention, certains pods peuvent être individuellement proches de leur limite.
</details>

### Question 2.3

Faites défiler jusqu'à la section **Memory Quota** et regardez le tableau.

> **Q8** — Quel pod a le **Memory Limits % le plus élevé** ? Que signifie cette valeur ?

<details>
<summary>Voir la réponse</summary>

C'est **`todo-app-dd5dfc87-2hw4q`** avec **99,33 %**.

🚨 **C'est dangereux !** Le pod utilise **presque 100 % de sa limite mémoire**. S'il dépasse :
- Il sera **OOMKilled** (Out Of Memory) par Kubernetes
- Le conteneur sera redémarré automatiquement
- Il y aura potentiellement une perte de données ou de connexions actives

**Action recommandée** : augmenter `memory.limits` dans le Deployment de `todo-app`, ou investiguer pourquoi il consomme autant.
</details>

### Question 2.4

> **Q9** — Quelle est la valeur de **Memory Requests %** pour le pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

**Memory Requests %** = **198,65 %**

🤔 Cette valeur **dépasse 100 %**, ce qui signifie que `todo-app` utilise **presque le double de ce qu'il a demandé**. Ce n'est pas illégal en Kubernetes (tant qu'on reste sous les `limits`), mais ça indique que les `requests` ont été **sous-estimées**.

Il faudrait ajuster les `memory.requests` à une valeur plus proche de la consommation réelle pour éviter les mauvaises surprises lors de la planification (scheduling).
</details>

### Question 2.5

> **Q10** — Pour le pod `postgres-5b59c7f5ff-scm4n`, quelle est la **Memory Usage (RSS)** et la **Memory Usage (Cache)** ?

<details>
<summary>Voir la réponse</summary>

- **Memory Usage (RSS)** = **3,68 MiB** → mémoire **vraiment utilisée** par le processus
- **Memory Usage (Cache)** = **10,46 MiB** → mémoire utilisée pour le **cache du système de fichiers**

Le **RSS** est la métrique critique : c'est la mémoire que ton application **consomme réellement**. Le cache peut être libéré par le système si nécessaire — il ne représente pas une "vraie" pression mémoire.
</details>

### Question 2.6

> **Q11** — Quel pod utilise le plus de **Memory Usage (RSS)** dans le namespace ?

<details>
<summary>Voir la réponse</summary>

C'est **`todo-app-dd5dfc87-2hw4q`** avec **251,4 MiB** de RSS.

C'est cohérent avec son **Memory Limits % à 99,33 %** : il consomme énormément de mémoire active, et il est proche de sa limite.
</details>

---

## Partie 3 — Network

### Question 3.1

Faites défiler jusqu'à la section **Current Network Usage**.

> **Q12** — Quelle est la valeur de **Current Receive Bandwidth** pour le pod `todo-app` ?

<details>
<summary>Voir la réponse</summary>

La valeur est **0 Bps** (0 octets par seconde).

Ça signifie qu'à l'instant T, **aucun trafic n'arrive** vers `todo-app`. C'est normal s'il n'y a pas d'utilisateur actif sur l'application.
</details>

### Question 3.2

Faites défiler jusqu'à la section **Bandwidth** (graphiques).

> **Q13** — À quelle heure environ y a-t-il eu un **pic de Receive Bandwidth** sur le graphique ?

<details>
<summary>Voir la réponse</summary>

Sur le graphique, on voit un pic vers **4:33 PM** environ, atteignant **3,5 Bps**.

Les couleurs des pics correspondent aux pods (vérifiez la légende sous le graphique). Ce pic est probablement dû à un test `curl` que vous avez fait pendant l'exercice précédent.
</details>

### Question 3.3

Regardez la section **Rate of Packets**.

> **Q14** — Quel est le **pic de Rate of Received Packets** observé, et à quelle heure ?

<details>
<summary>Voir la réponse</summary>

Le pic visible est d'environ **0,05 pps** (paquets par seconde) vers **4:33 PM**.

C'est très faible parce que vous n'avez pas généré beaucoup de trafic. En production, sur un service web actif, on peut voir plusieurs centaines voire milliers de pps.
</details>

### Question 3.4

Allez dans la section **Rate of Packets Dropped**.

> **Q15** — Y a-t-il des **paquets perdus** (Rate of Received/Transmitted Packets Dropped) ? Que peut-on en conclure ?

<details>
<summary>Voir la réponse</summary>

Les graphiques **Rate of Received Packets Dropped** et **Rate of Transmitted Packets Dropped** sont **plats à 0 pps**.

✅ **Conclusion** : aucun paquet n'est perdu, le réseau fonctionne correctement.

Si on voyait des valeurs > 0, ce serait un signal d'alerte indiquant un problème réseau (buffer saturé, MTU mal configuré, etc.).
</details>

---

## Partie 4 — Storage IO

### Question 4.1

Faites défiler jusqu'à la section **Storage IO**.

> **Q16** — Sur le graphique **IOPS (Reads + Writes)**, quel pod a la valeur la plus élevée et combien ?

<details>
<summary>Voir la réponse</summary>

Le pod **`todo-app-dd5dfc87-2hw4q`** a un pic à **3 IOPS** (couleur jaune sur le graphique vers 4:37 PM).

Les autres pods restent en dessous, ce qui est cohérent avec une application web qui fait des lectures/écritures sur la base de données.
</details>

### Question 4.2

Allez dans la section **Storage IO - Distribution**, sur le tableau **Current Storage IO**.

> **Q17** — Quel pod a le **Throughput(Write) le plus élevé** ?

<details>
<summary>Voir la réponse</summary>

C'est **`todo-app-dd5dfc87-2hw4q`** avec **2,39 KBps**.

Ça signifie que `todo-app` écrit environ **2,4 Ko de données par seconde** sur le disque. C'est cohérent avec une application qui écrit dans des logs ou met à jour des données en base.
</details>

### Question 4.3

> **Q18** — Combien d'IOPS en **écriture** le pod `postgres` fait-il actuellement ?

<details>
<summary>Voir la réponse</summary>

**IOPS(Writes)** pour `postgres-5b59c7f5ff-scm4n` = **0,097 IOPS**

C'est très faible parce qu'il n'y a probablement aucune écriture active sur la base. Sur une base sollicitée, on pourrait voir des centaines voire des milliers d'IOPS.
</details>

---

## Partie 5 — Synthèse

### Question 5.1

> **Q19** — En vous basant sur **toutes** les informations lues, **quel pod nécessite votre attention en priorité** dans ce namespace, et pourquoi ?

<details>
<summary>Voir la réponse</summary>

C'est **`todo-app-dd5dfc87-2hw4q`** qui nécessite votre attention.

**Pourquoi ?** Cumul de plusieurs signaux :
- 🚨 **Memory Limits % à 99,33 %** → risque imminent d'OOMKill
- ⚠️ **Memory Requests % à 198,65 %** → les requests sont sous-estimées
- ⚠️ **CPU Requests % à 54 %** → consommation soutenue
- 📊 **C'est aussi le plus actif** en Storage IO (Throughput Write = 2,39 KBps)

**Actions recommandées** :
1. Augmenter `memory.limits` dans le Deployment (par exemple : `512Mi` au lieu de `256Mi`)
2. Ajuster `memory.requests` à une valeur plus réaliste (par exemple : `256Mi`)
3. Investiguer pourquoi l'application consomme autant (fuite mémoire ? cache trop volumineux ?)
</details>

### Question 5.2

> **Q20** — Cliquez sur **"Inspect"** à côté du graphique **CPU Usage**. Que se passe-t-il ?

<details>
<summary>Voir la réponse</summary>

Cliquer sur **"Inspect"** ouvre la page **Observe → Metrics** avec une **requête PromQL** déjà préremplie.

Exemple de requête générée :
```
sum(node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate{namespace="paris-user-ns"}) by (pod)
```

C'est un moyen rapide de **passer du dashboard à l'analyse fine** : vous pouvez modifier la requête, ajouter des filtres, comparer plusieurs métriques, etc.

C'est ce que vous allez explorer dans le prochain exercice.
</details>

---

## Récapitulatif

À l'issue de cet exercice, vous savez :

- ✅ Naviguer vers **Observe → Dashboards** et sélectionner le bon dashboard
- ✅ Lire les métriques **CPU** (Utilisation, Quota, Requests vs Limits)
- ✅ Lire les métriques **Memory** (Utilisation, Quota, RSS, Cache, Swap)
- ✅ Détecter une **saturation mémoire** (Limits % proche de 100 %)
- ✅ Lire les métriques **Network** (Bandwidth, Rate of Packets, Packets Dropped)
- ✅ Lire les métriques **Storage IO** (IOPS, Throughput)
- ✅ **Diagnostiquer** un namespace en synthétisant plusieurs métriques
- ✅ Utiliser **"Inspect"** pour passer du dashboard à PromQL

:::tip Pour aller plus loin
Dans le prochain exercice, vous apprendrez à **explorer les métriques avec PromQL** (page **Observe → Metrics**), puis à **créer une alerte custom** qui se déclenche automatiquement quand un pod approche sa limite mémoire.
:::