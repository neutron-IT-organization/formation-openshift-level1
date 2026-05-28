---
id: Exercice_machineconfig_ca_certificate
slug: /Gestion_et_administration_du_cluster/Exercice_machineconfig_ca_certificate
---

# Exercice Pratique : Ajouter un Certificat CA via MachineConfig

## Ce que vous allez faire

Vous allez **rédiger une MachineConfig** qui ajoute un **certificat CA** au store de confiance des nœuds OpenShift. Ce certificat permettrait aux nœuds de faire confiance à un **registry interne**, un **proxy d'entreprise** ou tout service avec un certificat custom.

Vous validerez votre fichier en mode `--dry-run=client` **sans jamais l'appliquer** sur le cluster.

:::danger Cluster partagé — NE JAMAIS APPLIQUER
Ce cluster OpenShift est **partagé entre plusieurs utilisateurs**. Une MachineConfig appliquée déclenche un **reboot du nœud**, ce qui rend le cluster indisponible pour tous.

✅ Autorisé : `oc create --dry-run=client -f fichier.yaml`
❌ Interdit : `oc create -f fichier.yaml`
:::

:::info Personnalisation par utilisateur
Tout au long de cet exercice, **remplacez `<CITY>` par le nom de votre ville** (paris, rome, tokyo...) pour avoir des noms uniques.

Cela permet à **plusieurs utilisateurs** de faire l'exercice en parallèle sans conflit.
:::

## Objectifs

- [ ] Générer un certificat CA auto-signé avec `openssl`
- [ ] Encoder le certificat en base64
- [ ] Rédiger une MachineConfig complète
- [ ] Valider la syntaxe avec `--dry-run=client`
- [ ] Nettoyer proprement pour pouvoir refaire l'exercice

---

## 📚 Notions à connaître

**Certificat CA** = autorité de confiance qui signe des certificats. En entreprise, on a souvent une CA interne pour signer le certificat du registry, du proxy, etc.

Sur Linux, les CA custom sont stockées dans :
```
/etc/pki/ca-trust/source/anchors/
```

Sur OpenShift (RHCOS), pour ajouter une CA, il faut passer par une **MachineConfig**.

---

## Étape 0 — Vérifier qu'aucun ancien dossier n'existe

Avant de commencer, supprimez tout ancien dossier de l'exercice (au cas où vous l'auriez déjà fait) :

```bash
rm -rf ~/mc-ca-cert
```

✅ Cette commande ne renvoie aucune erreur même si le dossier n'existe pas. Vous pouvez maintenant commencer proprement.

---

## Étape 1 — Préparer le dossier de travail

```bash
mkdir -p ~/mc-ca-cert
cd ~/mc-ca-cert
```

---

## Étape 2 — Générer un certificat CA auto-signé

Remplacez `<CITY>` par le nom de votre ville (paris, rome, etc.) dans le `subj` :

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout my-ca.key \
  -out my-ca.crt \
  -subj "/CN=Internal CA <CITY>/O=Neutron IT/C=FR"
```

**Sortie attendue :**

```
.....+++
.........+++
writing new private key to 'my-ca.key'
-----
```

**Vérification :**

```bash
ls -la my-ca.*
```

Vous devez voir :

```
-rw-r--r-- 1 user user 1318 May  6 14:30 my-ca.crt
-rw------- 1 user user 1704 May  6 14:30 my-ca.key
```

---

## Étape 3 — Vérifier le certificat

```bash
openssl x509 -in my-ca.crt -text -noout | head -20
```

Vous devez voir :

```
Certificate:
    Data:
        Version: 3 (0x2)
        Issuer: CN = Internal CA <CITY>, O = Neutron IT, C = FR
        Validity
            Not Before: May  6 14:30:00 2026 GMT
            Not After : May  6 14:30:00 2027 GMT
        Subject: CN = Internal CA <CITY>, O = Neutron IT, C = FR
```

✅ **Issuer = Subject** → certificat auto-signé valide.

---

## Étape 4 — Encoder le certificat en base64


```bash
base64 my-ca.crt | tr -d '\n' > my-ca.b64
```

**Vérifier la chaîne :**

```bash
cat my-ca.b64
```

Vous obtenez une longue chaîne du type :

```
LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURYVENDQWtXZ0F3SUJBZ0lKQUt4eHh4...
```

---

## Étape 5 — Créer la MachineConfig

Créez le fichier `99-ca-certificate.yaml` avec un nom unique basé sur votre ville :

```bash
nano 99-ca-certificate.yaml
```

Collez ce contenu (remplacez `<CITY>` par le nom de votre ville et `<COLLER_BASE64_ICI>` par la chaîne de l'étape 4) :

```yaml
apiVersion: machineconfiguration.openshift.io/v1
kind: MachineConfig
metadata:
  name: 99-master-ca-<CITY>
  labels:
    machineconfiguration.openshift.io/role: master
spec:
  config:
    ignition:
      version: 3.2.0
    storage:
      files:
        - path: /etc/pki/ca-trust/source/anchors/internal-ca-<CITY>.crt
          mode: 0644
          overwrite: true
          contents:
            source: data:text/plain;base64,<COLLER_BASE64_ICI>
```

---

## Étape 6 — Valider la syntaxe avec `--dry-run=client`

```bash
oc apply --dry-run=client -f 99-ca-certificate.yaml
```

**Sortie attendue (succès) :**

```
machineconfig.machineconfiguration.openshift.io/99-master-ca-paris created (dry run)
```

✅ Le mot-clé **`(dry run)`** confirme que **rien n'est appliqué** sur le cluster.

Si vous voyez une erreur, vérifiez :
- Le base64 est sur **une seule ligne** (pas de retour à la ligne)
- L'indentation YAML est **correcte** (espaces, pas de tabulations)
- Tous les `<CITY>` ont bien été remplacés

---

## Étape 7 — Afficher le manifest rendu

Pour visualiser le YAML complet tel qu'il serait envoyé au cluster :

```bash
oc apply --dry-run=client -f 99-ca-certificate.yaml -o yaml
```

Vous verrez le manifest avec les métadonnées auto-générées par Kubernetes.

---

## Étape 8 — Vérifier la cohérence du contenu

Décodez le contenu de la MachineConfig et comparez avec votre certificat :

```bash
diff <(cat my-ca.crt) <(oc apply --dry-run=client -f 99-ca-certificate.yaml -o jsonpath='{.spec.config.storage.files[0].contents.source}' | sed 's|data:text/plain;base64,||' | base64 -d)
```

✅ Si **rien** ne s'affiche → les deux contenus sont identiques.

Vérifiez aussi que le décodage donne bien un certificat valide :

```bash
oc apply --dry-run=client -f 99-ca-certificate.yaml -o jsonpath='{.spec.config.storage.files[0].contents.source}' | sed 's|data:text/plain;base64,||' | base64 -d | openssl x509 -text -noout | head -10
```

Vous devez voir les détails du certificat ✅


## Étape 9 — Nettoyage complet

Supprimez **tous les fichiers** créés pendant l'exercice :

```bash
cd ~
rm -rf ~/mc-ca-cert
```

**Vérifier que tout est bien supprimé :**

```bash
ls ~/mc-ca-cert 2>/dev/null && echo "❌ Le dossier existe encore" || echo "✅ Le dossier est supprimé"
```

Vous devez voir :

```
✅ Le dossier est supprimé
```

✅ Vous pouvez maintenant **refaire l'exercice depuis l'Étape 0** si vous voulez vous entraîner une nouvelle fois.

:::info Pas de nettoyage côté cluster
Comme vous avez utilisé `--dry-run=client` partout, **aucune ressource n'a été créée sur le cluster**. Il n'y a donc **rien à nettoyer côté cluster** ✅
:::

---



## Récapitulatif

À l'issue de cet exercice, vous avez :

- ✅ Généré un certificat CA auto-signé avec `openssl`
- ✅ Vérifié le certificat avec `openssl x509`
- ✅ Encodé le certificat en base64
- ✅ Rédigé une MachineConfig complète au format Ignition 3.2.0
- ✅ Utilisé un **nom unique par utilisateur** (avec `<CITY>`) pour éviter les conflits
- ✅ Validé la syntaxe avec `oc apply --dry-run=client`
- ✅ Vérifié la cohérence du contenu base64
- ✅ Compris ce qui se passerait à l'application réelle
- ✅ Nettoyé proprement pour pouvoir recommencer
