# Exercice Guidé : Les Services et les Routes

## Ce que vous allez apprendre

Dans cet exercice, vous allez découvrir comment rendre une application accessible depuis l'extérieur du cluster. Vous apprendrez à créer un **Service** pour stabiliser l'identité de vos pods et une **Route HTTPS** pour exposer l'application de manière sécurisée (TLS Edge).

---

## Objectifs

A la fin de cet exercice, vous serez capable de :

- [ ] Déployer une application web simple
- [ ] Créer un **Service ClusterIP** pour la communication interne
- [ ] Créer une **Route HTTPS avec terminaison Edge**
- [ ] Vérifier le fonctionnement de la redirection HTTP vers HTTPS

---

## Étape 1 : Déployer l'application

Contrairement aux exercices précédents, nous allons tout faire de zéro. Commençons par déployer une application de bienvenue.

Créez le fichier `welcome-deployment.yaml` :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: welcome-app
  namespace: <CITY>-user-ns
spec:
  replicas: 1
  selector:
    matchLabels:
      app: welcome-app
  template:
    metadata:
      labels:
        app: welcome-app
    spec:
      containers:
      - name: welcome-app
        image: quay.io/neutron-it/welcome-app:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "1m"
            memory: "64Mi"
          limits:
            cpu: "100m"
            memory: "128Mi"
```

Appliquez le déploiement :
```bash
oc apply -f welcome-deployment.yaml
```

---

## Étape 2 : Créer un Service ClusterIP

Le Service est l'aiguilleur qui permet de joindre les pods via une IP stable à l'intérieur du cluster.

Créez le fichier `welcome-svc.yaml` :

```yaml
apiVersion: v1
kind: Service
metadata:
  name: welcome-svc
  namespace: <CITY>-user-ns
spec:
  selector:
    app: welcome-app
  ports:
  - protocol: TCP
    port: 80          # Port exposé par le service
    targetPort: 8080  # Port réel de l'application
  type: ClusterIP
```

Appliquez le service :
```bash
oc apply -f welcome-svc.yaml
```

---

## Étape 3 : Créer une Route HTTPS (TLS Edge)

C'est ici que nous exposons l'application sur Internet de manière sécurisée. Nous utilisons le mode **Edge** pour que le certificat soit géré automatiquement par le routeur OpenShift.

Créez le fichier `welcome-route.yaml` :

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: welcome-route
  namespace: <CITY>-user-ns
spec:
  to:
    kind: Service
    name: welcome-svc
  port:
    targetPort: 8080
  tls:
    termination: edge                        # HTTPS sécurisé
    insecureEdgeTerminationPolicy: Redirect  # Redirection HTTP -> HTTPS
```

Appliquez la route :
```bash
oc apply -f welcome-route.yaml
```

---

## Étape 4 : Vérifier l'accès sécurisé

Récupérez l'URL de votre route :
```bash
oc get route welcome-route -o jsonpath='https://{.spec.host}{"\n"}'
```

1.  Copiez l'URL et ouvrez-la dans votre navigateur.
2.  Vérifiez la présence du **cadenas** dans la barre d'adresse.
3.  Testez la redirection : essayez d'entrer l'URL en commençant par `http://`. Vous devriez être redirigé automatiquement vers `https://`.

:::info Pourquoi HTTPS ?
En production, il est impératif de chiffrer les communications. Le mode **Edge** est le plus utilisé car il simplifie la gestion des certificats : c'est OpenShift qui s'en occupe pour vous au point d'entrée du cluster.
:::

---

## Étape 5 : Nettoyage

```bash
oc delete -f welcome-deployment.yaml
oc delete -f welcome-svc.yaml
oc delete -f welcome-route.yaml
```
