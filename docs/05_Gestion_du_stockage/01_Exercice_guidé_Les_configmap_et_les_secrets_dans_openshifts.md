# Exercice Guidé : Utilisation des ConfigMaps et Secrets dans OpenShift

Cet exercice vous guidera à travers la création, la gestion et la consommation de *ConfigMaps* et de *Secrets* pour vos applications dans OpenShift. Vous apprendrez à les utiliser pour stocker des configurations et des données sensibles, et à les intégrer dans un déploiement pour une gestion sécurisée des informations.

### Objectifs de l'Exercice

- Créer des *ConfigMaps* pour stocker des données de configuration applicatives.
- Créer des *Secrets* pour gérer des données sensibles comme des mots de passe.
- Intégrer les *ConfigMaps* et les *Secrets* dans des applications déployées.
- Mettre à jour les *ConfigMaps* et redéployer les applications pour appliquer les nouvelles configurations.
- Tester la sécurisation des données à travers les *Secrets*.

## Prérequis

Pour cet exercice, vous allez déployer une application simple qui nous affichera les messages de bienvenue d'un site web de démonstration. Pour cela, créez un fichier nommé `welcome-app.yaml` avec le contenu suivant :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: welcome-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: welcome-app
  template:
    metadata:
      labels:
        app: welcome-app
    spec:
      containers:
        - name: welcome-app-container
          image: quay.io/neutron-it/welcome-app:latest
          ports:
            - containerPort: 8080
```

**Appliquez ce déploiement avec la commande suivante :**

```bash
oc apply -f welcome-app.yaml
```

## Étape 1 : Créer un ConfigMap pour l'application

1. **Objectif :** Créer un *ConfigMap* pour stocker le message de bienvenue affiché par l'application.

2. **Action :** Créez un fichier nommé `welcome-config.yaml` avec le contenu suivant :

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: welcome-config
data:
  welcome_message: "Bienvenue sur notre site de démonstration !"
  app_mode: "production"
```

3. **Commande :** Appliquez le fichier pour créer le *ConfigMap* :

```bash
oc apply -f welcome-config.yaml
```

4. **Vérification :** Affichez le *ConfigMap* pour vérifier sa création :

```bash
oc get configmap welcome-config -o yaml
```

## Étape 2 : Créer un Secret pour l'application

1. **Objectif :** Créer un *Secret* pour stocker les informations sensibles de l'application, comme un token API.

2. **Action :** Créez un fichier nommé `welcome-secret.yaml` avec le contenu suivant :

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: welcome-secret
type: Opaque
data:
  api_token: d2VsY29tZVRva2VuMTIz # Le token "welcomeToken123" encodé en base64
```

3. **Commande :** Appliquez le fichier pour créer le *Secret* :

```bash
oc apply -f welcome-secret.yaml
```

4. **Vérification :** Affichez le *Secret* (sans afficher les données sensibles) pour vérifier sa création :

```bash
oc get secret welcome-secret -o yaml
```

## Étape 3 : Consommer le ConfigMap et le Secret dans l'application

1. **Objectif :** Utiliser le *ConfigMap* et le *Secret* dans le déploiement de l'application pour les injecter en tant que variables d'environnement.

2. **Action :** Modifiez le fichier `welcome-app.yaml` pour inclure les variables d'environnement :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: welcome-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: welcome-app
  template:
    metadata:
      labels:
        app: welcome-app
    spec:
      containers:
        - name: welcome-app-container
          image: quay.io/neutron-it/welcome-app:latest
          ports:
            - containerPort: 8080
          env:
            - name: WELCOME_MESSAGE
              valueFrom:
                configMapKeyRef:
                  name: welcome-config
                  key: welcome_message
            - name: APP_MODE
              valueFrom:
                configMapKeyRef:
                  name: welcome-config
                  key: app_mode
            - name: API_TOKEN
              valueFrom:
                secretKeyRef:
                  name: welcome-secret
                  key: api_token
```

3. **Commande :** Appliquez les modifications pour mettre à jour le déploiement :

```bash
oc apply -f welcome-app.yaml
```

4. **Vérification :** Vérifiez que le déploiement est bien en cours d'exécution :

```bash
oc get pods -l app=welcome-app
```

## Étape 4 : Mise à Jour du ConfigMap

1. **Objectif :** Modifier le *ConfigMap* pour changer le message de bienvenue et observer l'impact sur l'application.

2. **Action :** Modifiez le fichier `welcome-config.yaml` pour mettre à jour le message :

```yaml
data:
  welcome_message: "Bienvenue à notre nouvelle application déployée avec OpenShift !"
  app_mode: "development"
```

3. **Commande :** Réappliquez le fichier pour mettre à jour le *ConfigMap* :

```bash
oc apply -f welcome-config.yaml
```

4. **Vérification :** Redémarrez les pods pour qu'ils récupèrent la nouvelle configuration :

```bash
oc rollout restart deployment welcome-app
```

## Étape 6 : Nettoyage

Après avoir terminé les tests, nettoyez les ressources créées :

```bash
oc delete deployment welcome-app
oc delete configmap welcome-config
oc delete secret welcome-secret
oc delete role secret-reader
oc delete rolebinding read-secrets
```

## Conclusion

En suivant cet exercice, vous avez appris à créer et gérer des *ConfigMaps* et des *Secrets* dans OpenShift. Vous avez exploré la façon de les intégrer dans une application déployée, de les mettre à jour. Cela vous permet de gérer les configurations et les informations sensibles de manière centralisée et sécurisée dans un environnement OpenShift.
