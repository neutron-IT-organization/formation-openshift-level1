---
id: Executez_des_applications_conteneurisé/Exercice_guidé_Les_statefulset

slug: /Executez_des_applications_conteneurisé/Exercice_guidé_Les_statefulset
---
# Exercice Guidé : Les StatefulSets

## Ce que vous allez apprendre

Dans cet exercice, vous allez visualiser concrètement pourquoi on utilise un **StatefulSet** pour les applications avec état :
1.  **L'Identité Stable** : Chaque pod a un nom fixe (`web-0`, `web-1`) qui ne change jamais.
2.  **Le Stockage Persistant Dédié** : Chaque pod possède **son propre disque dur** (PVC). Si le pod est supprimé, il retrouve exactement son disque et ses données au redémarrage.

Nous allons utiliser un serveur **Apache (httpd)** pour afficher le contenu de ces disques.

---

## Objectifs

- [ ] Déployer un **StatefulSet** avec 2 réplicas
- [ ] Vérifier que chaque pod a son **propre volume (PVC)** distinct
- [ ] Personnaliser le contenu de chaque volume via le navigateur
- [ ] Prouver la **persistance** après la suppression d'un pod

---

## Étape 1 : Créer le manifeste YAML

Nous allons utiliser l'image **Apache (httpd)** de Red Hat qui est très stable pour ce type d'exercice.

Créez un fichier nommé `stateful-visual.yaml` :

```bash
vi stateful-visual.yaml
```

Contenu du fichier :

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-headless
  namespace: <CITY>-user-ns
spec:
  ports:
  - port: 80
    name: web
  clusterIP: None
  selector:
    app: web
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
  namespace: <CITY>-user-ns
spec:
  serviceName: "web-headless"
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: apache
        image: registry.access.redhat.com/ubi8/httpd-24:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "20m"
            memory: "64Mi"
          limits:
            cpu: "100m"
            memory: "128Mi"
        volumeMounts:
        - name: data
          mountPath: /var/www/html
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: web-public
  namespace: <CITY>-user-ns
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: web-route
  namespace: <CITY>-user-ns
  annotations:
    # Désactive les cookies de session pour voir l'alternance entre les pods
    haproxy.router.openshift.io/disable_cookies: 'true'
spec:
  to:
    kind: Service
    name: web-public
  tls:
    termination: edge
```

---

## Étape 2 : Déploiement et Vérification

Appliquez le fichier :

```bash
oc apply -f stateful-visual.yaml
```

### 2.1 Vérifier les pods et PVC
Vérifiez que vous avez 2 pods (`web-0`, `web-1`) et 2 PVC (`data-web-0`, `data-web-1`) :
```bash
oc get pods,pvc -l app=web
```

---

## Étape 3 : Écrire des données (La partie visuelle)

Nous allons injecter une page HTML différente dans chaque pod.

### Pour le Pod 0 :
```bash
oc exec web-0 -- bash -c 'echo "<html><body style=\"background-color:aliceblue;text-align:center;padding:50px;\"><h1>POD 0 : Mon disque est unique !</h1><p>Ce texte est stocké sur mon propre volume persistant.</p></body></html>" > /var/www/html/index.html'
```

### Pour le Pod 1 :
```bash
oc exec web-1 -- bash -c 'echo "<html><body style=\"background-color:honeydew;text-align:center;padding:50px;\"><h1>POD 1 : J ai mon propre espace !</h1><p>Chaque pod du StatefulSet a son propre disque.</p></body></html>" > /var/www/html/index.html'
```

---

## Étape 4 : Tester dans le navigateur

Récupérez l'URL :
```bash
oc get route web-route
```

Ouvrez l'URL et actualisez plusieurs fois. 


Vous verrez alterner :
- La page du **Pod 0** (Bleue)
- La page du **Pod 1** (Verte)

![Aperçu Pod 0](/img/screenshots/stateful_pod0.png)
![Aperçu Pod 1](/img/screenshots/stateful_pod1.png)

---

## Étape 5 : Tester la persistance

1. Supprimez le pod 0 :
   ```bash
   oc delete pod web-0
   ```
2. Attendez qu'il soit de nouveau `Running`.
3. Actualisez votre navigateur.
4. **Résultat** : Le Pod 0 revient avec sa page bleue intacte ! Le StatefulSet a automatiquement retrouvé le disque `data-web-0` et l'a rattaché au nouveau pod `web-0`.

---

## Étape 6 : Nettoyage

```bash
oc delete -f stateful-visual.yaml
oc delete pvc data-web-0 data-web-1
```
