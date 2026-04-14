// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // Formation complète — tout le contenu du cours
  formationSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      items: [
        'Introduction/Objectif_du_cours',
        'Introduction/Organisation_de_la_formation',
      ],
    },
    {
      type: 'category',
      label: 'Présentation de Kubernetes et Openshift',
      items: [
        'Présentation_de_Kubernetes_et_Openshift/Presentation_d_Openshift',
        'Présentation_de_Kubernetes_et_Openshift/Quiz_Presentation_d_Openshift',
        'Présentation_de_Kubernetes_et_Openshift/Exploration_de_la_console',
        'Présentation_de_Kubernetes_et_Openshift/Exercice_guidé_Exploration_de_la_console',
        'Présentation_de_Kubernetes_et_Openshift/Architecture_Openshift_et_Kubernetes',
        'Présentation_de_Kubernetes_et_Openshift/Quiz_Architecture_Openshift_et_Kubernetes',
        'Présentation_de_Kubernetes_et_Openshift/Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Interface et ligne de commande',
      items: [
        'Interface_et_ligne_de_commande/Intéragir_avec_la_ligne_de_commande',
        'Interface_et_ligne_de_commande/Exerice_guidé_Intéragir_avec_la_ligne_de_commande',
        'Interface_et_ligne_de_commande/Examen_des_ressources_Kubernetes',
        'Interface_et_ligne_de_commande/Exercice_guidé_Examen_des_ressources_Kubernetes',
        'Interface_et_ligne_de_commande/Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Exécutez des applications conteneurisées',
      items: [
        'Executez_des_applications_conteneurisé/Les_Workloads_dans_Openshift',
        'Executez_des_applications_conteneurisé/Quiz_Les_Workloads_dans_Openshift',
        'Executez_des_applications_conteneurisé/Les_deployment_et_les_daemonset',
        'Executez_des_applications_conteneurisé/Exercice_guidé_Les_deployment_et_les_daemonset',
        'Executez_des_applications_conteneurisé/Les_statefulset',
        'Executez_des_applications_conteneurisé/Exercice_guidé_Les_statefulset',
        'Executez_des_applications_conteneurisé/Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Les réseaux dans OpenShift',
      items: [
        'Les_réseaux_dans_openshift/Les_sdn_dans_openshift',
        'Les_réseaux_dans_openshift/Quiz_Les_sdn_dans_openshift',
        'Les_réseaux_dans_openshift/Les_réseaux_de_pods_et_de_services',
        'Les_réseaux_dans_openshift/Exercice_guidé_Les_réseaux_de_pods_et_de_services',
        'Les_réseaux_dans_openshift/Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Gestion du stockage',
      items: [
        'Gestion_du_stockage/Les_configmap_et_les_secrets_dans_openshift',
        'Gestion_du_stockage/Exercice_guidé_Les_configmap_et_les_secrets_dans_openshifts',
        'Gestion_du_stockage/Approvisionnement_des_volumes_de_donnés_persistantes',
        'Gestion_du_stockage/Selection_d_une_classe_de_stockage',
        'Gestion_du_stockage/Exercice_guidé_pv_pvc_storage_class',
        'Gestion_du_stockage/Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Configuration de la fiabilité des applications',
      items: [
        'Configuration_de_la_fiabilité_des_applications/Taints_Tolerations_et_Affinité_des_noeuds',
        'Configuration_de_la_fiabilité_des_applications/Réservation_et_Limitation_de_capacité_de_calcul_pour_les_applications',
        'Configuration_de_la_fiabilité_des_applications/Exercice_guidé_Réservation_et_Limitation_de_capacité_de_calcul_pour_les_applications',
        'Configuration_de_la_fiabilité_des_applications/Mise_a_l\'echelle_automatique_des_applications',
        'Configuration_de_la_fiabilité_des_applications/Résumé',
      ],
    },
    {
      type: 'category',
      label: 'Gestion et administration du cluster',
      items: [
        'Gestion_et_administration_du_cluster/User_management',
        'Gestion_et_administration_du_cluster/Exercice_guidé_user_management',
        'Gestion_et_administration_du_cluster/Observabilité_du_cluster',
        'Gestion_et_administration_du_cluster/Exercice_guidé_Observabilité_du_cluster',
        'Gestion_et_administration_du_cluster/Node_MachineSet_MachineConfigs',
        'Gestion_et_administration_du_cluster/Exercice_guidé_MachineSet_MachineConfigs',
        'Gestion_et_administration_du_cluster/Gestion_des_mises_a_jours',
        'Gestion_et_administration_du_cluster/Quiz_gestion',
        'Gestion_et_administration_du_cluster/Résumé',
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
          id: 'Présentation_de_Kubernetes_et_Openshift/Exercice_guidé_Exploration_de_la_console',
          label: 'Exercice 1 — Exploration de la console',
        },
        {
          type: 'doc',
          id: 'Interface_et_ligne_de_commande/Exerice_guidé_Intéragir_avec_la_ligne_de_commande',
          label: 'Exercice 2 — Intéragir avec la ligne de commande',
        },
        {
          type: 'doc',
          id: 'Interface_et_ligne_de_commande/Exercice_guidé_Examen_des_ressources_Kubernetes',
          label: 'Exercice 3 — Examen des ressources Kubernetes',
        },
        {
          type: 'doc',
          id: 'Executez_des_applications_conteneurisé/Exercice_guidé_Les_deployment_et_les_daemonset',
          label: 'Exercice 4 — Deployments et DaemonSets',
        },
        {
          type: 'doc',
          id: 'Executez_des_applications_conteneurisé/Exercice_guidé_Les_statefulset',
          label: 'Exercice 5 — StatefulSets',
        },
        {
          type: 'doc',
          id: 'Les_réseaux_dans_openshift/Exercice_guidé_Les_réseaux_de_pods_et_de_services',
          label: 'Exercice 6 — Réseaux de pods et services',
        },
        {
          type: 'doc',
          id: 'Gestion_du_stockage/Exercice_guidé_Les_configmap_et_les_secrets_dans_openshifts',
          label: 'Exercice 7 — ConfigMaps et Secrets',
        },
        {
          type: 'doc',
          id: 'Gestion_du_stockage/Exercice_guidé_pv_pvc_storage_class',
          label: 'Exercice 8 — PV, PVC et StorageClass',
        },
        {
          type: 'doc',
          id: 'Configuration_de_la_fiabilité_des_applications/Exercice_guidé_Réservation_et_Limitation_de_capacité_de_calcul_pour_les_applications',
          label: 'Exercice 9 — Réservation et limitation de ressources',
        },
        {
          type: 'doc',
          id: 'Gestion_et_administration_du_cluster/Exercice_guidé_user_management',
          label: 'Exercice 10 — Gestion des utilisateurs',
        },
        {
          type: 'doc',
          id: 'Gestion_et_administration_du_cluster/Exercice_guidé_Observabilité_du_cluster',
          label: 'Exercice 11 — Observabilité du cluster',
        },
        {
          type: 'doc',
          id: 'Gestion_et_administration_du_cluster/Exercice_guidé_MachineSet_MachineConfigs',
          label: 'Exercice 12 — MachineSet et MachineConfigs',
        },
      ],
    },
  ],
};

export default sidebars;
