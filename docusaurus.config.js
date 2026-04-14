// @ts-check
import { themes as prismThemes } from "prism-react-renderer";
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Formation OpenShift — Neutron IT",
  tagline: "Exploitation d'un cluster OpenShift",
  favicon: "img/logo.png",
  url: "https://neutron-IT-organization.github.io",
  baseUrl: "/formation-openshift-level1/",
  organizationName: "neutron-IT-organization",
  projectName: "formation-openshift-level1",
  deploymentBranch: "gh-pages",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "fr",
    locales: ["fr"],
  },
  presets: [
    [
      "classic",
      ({
        docs: {
          sidebarPath: "./sidebars.js",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],
  themeConfig:
    ({
      image: "img/logo.png",
      navbar: {
        title: "Formation OpenShift",
        logo: {
          alt: "Neutron IT logo",
          src: "img/logo.png",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "formationSidebar",
            position: "left",
            label: "Formation complète",
          },
          {
            type: "docSidebar",
            sidebarId: "exercicesSidebar",
            position: "left",
            label: "Exercices",
          },
          {
            href: "https://rahoot.apps.neutron-sno-office.neutron-it.fr",
            label: "Quiz Rahoot",
            position: "left",
          },
          {
            href: "https://github.com/neutron-IT-organization/formation-openshift-level1",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Formation",
            items: [
              {
                label: "Introduction",
                to: "/",
              },
            ],
          },
          {
            title: "Neutron IT",
            items: [
              {
                label: "Site web",
                href: "https://neutron-it.fr",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Neutron IT. Formation OpenShift.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ["bash", "yaml", "json"],
      },
    }),
};
export default config;