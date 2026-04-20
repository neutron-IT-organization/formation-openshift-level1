// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // Formation complète — tout le contenu du cours
  formationSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      items: [
        '00_Introduction/00_Objectif_du_cours',
        '00_Introduction/01_Organisation_de_la_formation',
      ],
    },
    {
      type: 'category',
      label: 'Présentation de Kubernetes et Openshift',
      items: [
        '01_Présentation_de_Kubernetes_et_Openshift/00_Presentation_d_Openshift',
        '01_Présentation_de_Kubernetes_et_Openshift/01_Quiz_Presentation_d_Openshift',
        '01_Présentation_de_Kubernetes_et_Openshift/02_Exploration_de_la_console',
        '01_Présentation_de_Kubernetes_et_Openshift/03_Exercice_guidé_Exploration_de_la_console',
        '01_Présentation_de_Kubernetes_et_Openshift/04_Architecture_Openshift_et_Kubernetes',
        '01_Présentation_de_Kubernetes_et_Openshift/05_Quiz_Architecture_Openshift_et_Kubernetes',
        '01_Présentation_de_Kubernetes_et_Openshift/06_Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Interface et ligne de commande',
      items: [
        '01_Présentation_de_Kubernetes_et_Openshift/02_Interface_et_ligne_de_commande/00_Intéragir_avec_la_ligne_de_commande',
        '01_Présentation_de_Kubernetes_et_Openshift/02_Interface_et_ligne_de_commande/01_Exerice_guidé_Intéragir_avec_la_ligne_de_commande',
        '01_Présentation_de_Kubernetes_et_Openshift/02_Interface_et_ligne_de_commande/02_Examen_des_ressources_Kubernetes',
        '01_Présentation_de_Kubernetes_et_Openshift/02_Interface_et_ligne_de_commande/03_Exercice_guidé_Examen_des_ressources_Kubernetes',
        '01_Présentation_de_Kubernetes_et_Openshift/02_Interface_et_ligne_de_commande/04_Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Exécutez des applications conteneurisées',
      items: [
        '03_Executez_des_applications_conteneurisé/00_Les_Workloads_dans_Openshift',
        '03_Executez_des_applications_conteneurisé/01_Quiz_Les_Workloads_dans_Openshift',
        '03_Executez_des_applications_conteneurisé/02_Les_deployment_et_les_daemonset',
        '03_Executez_des_applications_conteneurisé/03_Exercice_guidé_Les_deployment_et_les_daemonset',
        '03_Executez_des_applications_conteneurisé/04_Les_statefulset',
        '03_Executez_des_applications_conteneurisé/05_Exercice_guidé_Les_statefulset',
        '03_Executez_des_applications_conteneurisé/06_Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Les réseaux dans OpenShift',
      items: [
        '04_Les_réseaux_dans_openshift/00_Les_sdn_dans_openshift',
        '04_Les_réseaux_dans_openshift/01_Quiz_Les_sdn_dans_openshift',
        '04_Les_réseaux_dans_openshift/02_Les_réseaux_de_pods_et_de_services',
        '04_Les_réseaux_dans_openshift/03_Exercice_guidé_Les_réseaux_de_pods_et_de_services',
        '04_Les_réseaux_dans_openshift/04_Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Gestion du stockage',
      items: [
        '05_Gestion_du_stockage/00_Les_configmap_et_les_secrets_dans_openshift',
        '05_Gestion_du_stockage/01_Exercice_guidé_Les_configmap_et_les_secrets_dans_openshifts',
        '05_Gestion_du_stockage/02_Approvisionnement_des_volumes_de_donnés_persistantes',
        '05_Gestion_du_stockage/03_Selection_d_une_classe_de_stockage',
        '05_Gestion_du_stockage/04_Exercice_guidé_pv_pvc_storage_class',
        '05_Gestion_du_stockage/05_Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Configuration de la fiabilité des applications',
      items: [
        '06_Configuration_de_la_fiabilité_des_applications/00_Taints_Tolerations_et_Affinité_des_noeuds',
        '06_Configuration_de_la_fiabilité_des_applications/02_Réservation_et_Limitation_de_capacité_de_calcul_pour_les_applications',
        '06_Configuration_de_la_fiabilité_des_applications/03_Exercice_guidé_Réservation_et_Limitation_de_capacité_de_calcul_pour_les_applications',
        '06_Configuration_de_la_fiabilité_des_applications/04_Mise_a_l\'echelle_automatique_des_applications',
        '06_Configuration_de_la_fiabilité_des_applications/06_Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Gestion et administration du cluster',
      items: [
        '07_Gestion_et_administration_du_cluster/00_User_management',
        '07_Gestion_et_administration_du_cluster/01_Exercice_guidé_user_management',
        '07_Gestion_et_administration_du_cluster/02_Observabilité_du_cluster',
        '07_Gestion_et_administration_du_cluster/03_Exercice_guidé_Observabilité_du_cluster',
        '07_Gestion_et_administration_du_cluster/04_Node_MachineSet_MachineConfigs',
        '07_Gestion_et_administration_du_cluster/05_Exercice_guidé_MachineSet_MachineConfigs',
        '07_Gestion_et_administration_du_cluster/06_Gestion_des_mises_a_jours',
        '07_Gestion_et_administration_du_cluster/07_Quiz_gestion',
        '07_Gestion_et_administration_du_cluster/08_Résumé',
      ],
    },
  ],

  // Exercices uniquement — accès rapide aux travaux pratiques
  exercicesSidebar: [
    {
      type: 'category',
      label: 'Exercices guidés',
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: '01_Présentation_de_Kubernetes_et_Openshift/03_Exercice_guidé_Exploration_de_la_console',
          label: 'Exercice 1 — Exploration de la console',
        },
        {
          type: 'doc',
          id: '01_Présentation_de_Kubernetes_et_Openshift/02_Interface_et_ligne_de_commande/01_Exerice_guidé_Intéragir_avec_la_ligne_de_commande',
          label: 'Exercice 2 — Intéragir avec la ligne de commande',
        },
        {
          type: 'doc',
          id: '01_Présentation_de_Kubernetes_et_Openshift/02_Interface_et_ligne_de_commande/03_Exercice_guidé_Examen_des_ressources_Kubernetes',
          label: 'Exercice 3 — Examen des ressources Kubernetes',
        },
        {
          type: 'doc',
          id: '03_Executez_des_applications_conteneurisé/03_Exercice_guidé_Les_deployment_et_les_daemonset',
          label: 'Exercice 4 — Deployments et DaemonSets',
        },
        {
          type: 'doc',
          id: '03_Executez_des_applications_conteneurisé/05_Exercice_guidé_Les_statefulset',
          label: 'Exercice 5 — StatefulSets',
        },
        {
          type: 'doc',
          id: '04_Les_réseaux_dans_openshift/03_Exercice_guidé_Les_réseaux_de_pods_et_de_services',
          label: 'Exercice 6 — Réseaux de pods et services',
        },
        {
          type: 'doc',
          id: '05_Gestion_du_stockage/01_Exercice_guidé_Les_configmap_et_les_secrets_dans_openshifts',
          label: 'Exercice 7 — ConfigMaps et Secrets',
        },
        {
          type: 'doc',
          id: '05_Gestion_du_stockage/04_Exercice_guidé_pv_pvc_storage_class',
          label: 'Exercice 8 — PV, PVC et StorageClass',
        },
        {
          type: 'doc',
          id: '06_Configuration_de_la_fiabilité_des_applications/03_Exercice_guidé_Réservation_et_Limitation_de_capacité_de_calcul_pour_les_applications',
          label: 'Exercice 9 — Réservation et limitation de ressources',
        },
        {
          type: 'doc',
          id: '07_Gestion_et_administration_du_cluster/01_Exercice_guidé_user_management',
          label: 'Exercice 10 — Gestion des utilisateurs',
        },
        {
          type: 'doc',
          id: '07_Gestion_et_administration_du_cluster/03_Exercice_guidé_Observabilité_du_cluster',
          label: 'Exercice 11 — Observabilité du cluster',
        },
        {
          type: 'doc',
          id: '07_Gestion_et_administration_du_cluster/05_Exercice_guidé_MachineSet_MachineConfigs',
          label: 'Exercice 12 — MachineSet et MachineConfigs',
        },
      ],
    },
  ],
};

export default sidebars;
