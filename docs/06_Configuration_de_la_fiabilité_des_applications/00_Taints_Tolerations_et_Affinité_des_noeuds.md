---
slug: /Configuration_de_la_fiabilité_des_applications/Taints_Tolerations_et_Affinité_des_noeuds
---
# Taints, Tolerations et Affinité des Nœuds

## Introduction

Dans Kubernetes et OpenShift, il est souvent nécessaire de contrôler **quel pod va sur quel nœud**. Par défaut, le scheduler répartit les pods équitablement. Cependant, pour des raisons de performance, de coût ou de sécurité, vous pouvez vouloir forcer ou empêcher certains placements.

Il existe deux mécanismes principaux pour cela :
1. **Les Taints et Tolerations** : permettent à un nœud de **repousser** un groupe de pods.
2. **L'Affinité des Nœuds (Node Affinity)** : permet à un pod d'être **attiré** vers un nœud spécifique.

---

## 1. Taints et Tolerations

Imaginez les **Taints** (taches) comme une étiquette "Attention" sur un nœud. Un pod ne peut pas aller sur ce nœud **sauf s'il possède une Toleration** (tolérance) correspondante.

### Les trois effets d'une Taint :
- **NoSchedule** : le scheduler ne placera aucun pod sur le nœud s'il ne tolère pas la taint.
- **PreferNoSchedule** : le scheduler essaiera d'éviter le nœud, mais l'utilisera s'il n'y a pas d'autre choix.
- **NoExecute** : les pods déjà présents sur le nœud sont expulsés immédiatement s'ils ne tolèrent pas la taint.

### Cas d'usage :
- Réserver des nœuds pour des types de calculs spécifiques (ex: nœuds GPU).
- Marquer des nœuds en cours de maintenance (drain).
- Isoler les nœuds de contrôle (Master) des nœuds de travail (Worker).

---

## 2. Affinité des Nœuds (Node Affinity)

L'**Affinité** est l'inverse de la Taint : c'est le pod qui demande à aller sur un nœud particulier en fonction de ses **labels**.

### Deux types d'affinité :
- **RequiredDuringSchedulingIgnoredDuringExecution** : Le pod **nécessite** absolument que le nœud réponde aux critères (Hard rule). Sinon, le pod reste en état `Pending`.
- **PreferredDuringSchedulingIgnoredDuringExecution** : Le pod **préfère** ce nœud (Soft rule), mais ira ailleurs si nécessaire.

---

## 3. Le cas particulier du Single Node OpenShift (SNO)

Sur votre environnement de formation actuel, vous travaillez sur un **SNO** (Single Node OpenShift). Cela signifie qu'il n'y a qu'**un seul nœud physique** qui fait à la fois office de Master et de Worker.

### Conséquences sur le SNO :
1. **Pas de redirection possible** : Si vous appliquez une Taint `NoSchedule` sur votre nœud unique sans que vos pods ne la tolèrent, le cluster ne pourra **plus rien lancer**. Les pods resteront indéfiniment en `Pending` car il n'y a pas d'autre nœud vers lequel se replier.
2. **Master Taint** : Sur un cluster multi-nœuds herbergé, les nœuds masters sont souvent "taintés" avec `node-role.kubernetes.io/master:NoSchedule`. Sur SNO, cette configuration est adaptée pour permettre aux workloads applicatifs de s'exécuter sur ce nœud unique.
3. **Usage pédagogique** : Le SNO est idéal pour apprendre la syntaxe et le fonctionnement des Taints/Affinités, même si l'effet "répartition sur plusieurs nœuds" n'est pas observable physiquement.

---

## Conclusion

La gestion du placement des pods est cruciale pour l'optimisation des ressources d'un cluster. Même sur un SNO, comprendre comment ces mécanismes fonctionnent est indispensable avant de passer sur des architectures multi-nœuds complexes.
