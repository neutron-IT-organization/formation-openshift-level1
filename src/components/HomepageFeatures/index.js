import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Prise en main rapide",
    Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <>
        La formation est conçue pour être accessible dès le début, avec une
        installation rapide et une approche pédagogique qui vous permet de
        maîtriser les bases d'OpenShift rapidement.
      </>
    ),
  },
  {
    title: "Concentrez-vous sur l essentiel",
    Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <>
        La formation vous permet de vous concentrer sur les concepts clés
        d'OpenShift, sans perdre de temps sur des détails techniques inutiles.
        Avancez à votre rythme en vous focalisant sur les compétences les plus
        demandées.
      </>
    ),
  },
  {
    title: "Approfondissement et flexibilité",
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    description: (
      <>
        Adaptez la formation à vos besoins avec des modules avancés et des
        exercices pratiques. Vous pouvez approfondir vos connaissances tout en
        gardant une flexibilité dans votre apprentissage.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
