# Exercice Guidé : Gestion des Requests, Limites et Quotas dans OpenShift

Cet exercice vous guidera dans la configuration et la gestion des **requests**, **limites** et **quotas** pour un déploiement dans un projet OpenShift. Vous apprendrez à configurer ces paramètres, à tester les limites et à observer l'utilisation réelle des ressources par rapport aux quotas définis.


## **Objectifs de l'exercice**

1. Configurer les **requests** et **limites** pour un déploiement dans OpenShift.  
2. Définir un **quota de ressources** pour restreindre la consommation globale des ressources.  
3. Tester le comportement d'OpenShift lorsque le quota est atteint en essayant de scaler un déploiement.  
4. Analyser les consommations via les quotas en observant les statuts des ressources consommées (**used** vs **hard**).  


## **Étape 1 : Créer un Déploiement avec Requests et Limites**

1. Créez un fichier nommé `deployment-limite.yaml` avec la configuration suivante :  

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: test-limite
     namespace: YOURCITY-user-ns
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: test-limite
     template:
       metadata:
         labels:
           app: test-limite
       spec:
         containers:
         - name: limite-container
           image: registry.redhat.io/ubi8/ubi:latest
           command: ["sh", "-c", "while true; do echo Hello OpenShift; sleep 5; done"]
           resources:
             requests:
               memory: "128Mi"
               cpu: "250m"
             limits:
               memory: "256Mi"
               cpu: "500m"
   ```

   **Explications** :  
   - **Image utilisée** : `registry.redhat.io/ubi8/ubi:latest` (catalogue Red Hat).  
   - Requests et limites configurées :  
     - CPU : **250m** à **500m**  
     - Mémoire : **128Mi** à **256Mi**

2. Appliquez le déploiement :  

   ```bash
   oc apply -f deployment-limite.yaml -n YOURCITY-user-ns
   ```

3. Vérifiez que le déploiement a été créé et que le pod est en cours d’exécution :  

   ```bash
   oc get pods -n YOURCITY-user-ns
   ```

4. Consultez les **requests** et **limites** appliquées au pod avec :  

   ```bash
   oc describe pod -l app=test-limite -n YOURCITY-user-ns
   ```


## **Étape 2 : Configurer un Quota de Ressources**

1. Créez un fichier `quota.yaml` pour définir un quota de ressources :  

   ```yaml
   apiVersion: v1
   kind: ResourceQuota
   metadata:
     name: quota-cpu-memoire
     namespace: YOURCITY-user-ns
   spec:
     hard:
       requests.cpu: "1"            # Limite totale des demandes CPU à 1 CPU
       requests.memory: "512Mi"     # Limite totale des demandes mémoire à 512 Mi
       limits.cpu: "2"              # Limite totale des limites CPU à 2 CPU
       limits.memory: "1Gi"         # Limite totale des limites mémoire à 1 Gi
   ```

2. Appliquez le quota :  

   ```bash
   oc apply -f quota.yaml -n YOURCITY-user-ns
   ```

3. Vérifiez que le quota est bien configuré :  

   ```bash
   oc describe resourcequota quota-cpu-memoire -n YOURCITY-user-ns
   ```


## **Étape 3 : Tester le Dépassement du Quota**

1. Essayez de scaler le déploiement au-delà des quotas. Modifiez le nombre de répliques avec :  

   ```bash
   oc scale deployment/test-limite --replicas=4 -n YOURCITY-user-ns
   ```

2. Observez les événements pour comprendre pourquoi OpenShift refuse de scaler :  

   ```bash
   oc get events -n YOURCITY-user-ns
   ```

Voici les détails ajoutés à l'étape 3 pour expliquer ce que vous êtes censé observer dans les événements lorsque le quota est dépassé :  


## **Étape 3 : Tester le Dépassement du Quota**

1. Essayez de scaler le déploiement pour augmenter le nombre de répliques :  

   ```bash
   oc scale deployment/test-limite --replicas=4 -n YOURCITY-user-ns
   ```

2. Vérifiez les événements générés par OpenShift :  

   ```bash
   oc get events -n YOURCITY-user-ns
   ```

   ### **Ce que vous devriez observer :**
   - Un événement indiquant que le quota est atteint.  
   - Exemple de message typique dans les événements :  

     ```
     Warning  FailedCreate  1m  replicaset-controller  Failed to create pod: exceeded quota: quota-cpu-memoire, requested: requests.cpu=500m, used: requests.cpu=1, limited: requests.cpu=1
     ```

     **Décryptage du message :**  
     - **`FailedCreate`** : OpenShift n’a pas pu créer de nouveaux pods.  
     - **`exceeded quota: quota-cpu-memoire`** : Le quota nommé `quota-cpu-memoire` a été dépassé.  
     - **`requested: requests.cpu=500m`** : Le déploiement a tenté de demander 500 millicores supplémentaires pour une nouvelle réplique.  
     - **`used: requests.cpu=1`** : Les ressources CPU actuellement utilisées dans le namespace sont déjà au maximum de 1 CPU.  
     - **`limited: requests.cpu=1`** : Le quota autorise au maximum 1 CPU pour les demandes (requests).  
     

Avec cette explication, les utilisateurs sauront interpréter les messages des événements et comprendre pourquoi le quota empêche la montée en charge du déploiement.

3. Retournez au déploiement d’une réplique pour éviter les problèmes persistants :  

   ```bash
   oc scale deployment/test-limite --replicas=8 -n YOURCITY-user-ns
   ``


## **Étape 4 : Analyser les Consommations des Quotas**

1. Vérifiez les consommations actuelles des quotas avec :  

   ```bash
   oc describe resourcequota quota-cpu-memoire -n YOURCITY-user-ns
   ```

   **Analyse des résultats** :  
   - **Used** : Les ressources actuellement consommées dans le namespace.  
   - **Hard** : Les limites totales définies par le quota.  

   Par exemple :  

   ```
   Resource              Used   Hard
   --------              ----   ----
   requests.cpu          500m   1
   requests.memory       256Mi  512Mi
   limits.cpu            1      2
   limits.memory         512Mi  1Gi
   ```

2. Pour surveiller les ressources consommées par chaque pod :  

   ```bash
   oc adm top pod -n YOURCITY-user-ns
   ```

## **Étape 5 : Nettoyer l'Environnement**

Pour supprimer les ressources créées :  

```bash
oc delete deployment test-limite -n YOURCITY-user-ns
oc delete resourcequota quota-cpu-memoire -n YOURCITY-user-ns
```


## **Conclusion**

Dans cet exercice, vous avez appris à :  
1. Configurer les requests et limites pour un déploiement.  
2. Définir et appliquer des quotas pour contrôler la consommation globale des ressources.  
3. Tester les quotas en scalant un déploiement et analyser les statuts avec `oc get quotas`.  

**Astuce** : En production, surveillez toujours les sections **used** et **hard** des quotas pour garantir une gestion optimale des ressources dans vos projets OpenShift.