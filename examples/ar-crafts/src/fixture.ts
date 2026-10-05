import { parseCraftContent } from "./contract";

const demo = {
  contentStatus: "demo",
  sourceRef: "AR-Crafts-Codex-Handoff / Figma 2:37",
};
const art = (name: string, alt: string) => ({
  src: `/ar-crafts/conceptual/${name}.svg`,
  alt: `${alt} · ilustración conceptual`,
  kind: "illustration",
  rightsConfirmed: false,
});
export const arCraftsFixture = parseCraftContent({
  site: {
    ...demo,
    id: "ar-site",
    hero: {
      eyebrow: "JOYERÍA ARTESANAL · TALLERES E INSUMOS",
      title: "De la naturaleza\na tus manos.",
      text: "Aprende a crear piezas llenas de vida y encuentra los materiales para dar forma a tus ideas.",
      mobileText:
        "Talleres e insumos de joyería artesanal para dar vida a tus ideas.",
    },
    about: {
      text: "Un espacio para explorar la joyería artesanal, aprender nuevas técnicas y encontrar belleza en los pequeños detalles.",
      image: art("about-botanical", "Composición botánica con cuentas"),
    },
    contact: { confirmed: false },
  },
  workshops: [
    {
      ...demo,
      id: "miyuki",
      technique: "Miyuki",
      title: "Pequeñas cuentas,\ngrandes posibilidades.",
      details:
        "Ejemplo de taller para explorar composiciones con cuentas. Técnica, nivel y contenido por validar.",
      image: art("workshop-miyuki", "Collar con cuentas de colores"),
    },
    {
      ...demo,
      id: "macrame",
      technique: "Macramé",
      title: "Hilos que toman\nuna nueva forma.",
      details:
        "Ejemplo de taller de nudos y formas. Los materiales incluidos están por confirmar.",
      image: art("workshop-macrame", "Colgante de macramé"),
    },
    {
      ...demo,
      id: "gems",
      technique: "Pedrería",
      title: "Texturas para\nhacer florecer ideas.",
      details:
        "Ejemplo de taller de composición con piedras. Modalidad y proyecto por confirmar.",
      image: art("workshop-gems", "Flor con gemas"),
    },
  ],
  editions: [],
  materials: [
    {
      ...demo,
      id: "beads",
      title: "Cuentas Miyuki",
      presentationLabel: "Presentación de ejemplo por confirmar",
      status: "inquiry",
      featured: true,
      image: art("material-beads", "Cuentas en una paleta botánica"),
    },
    {
      ...demo,
      id: "threads",
      title: "Hilos para crear",
      presentationLabel: "Una presentación de ejemplo por confirmar",
      status: "inquiry",
      featured: true,
      image: art("material-threads", "Hilos de colores"),
    },
    {
      ...demo,
      id: "tools",
      title: "Herramientas y accesorios",
      presentationLabel: "Una herramienta de ejemplo por confirmar",
      status: "inquiry",
      featured: true,
      image: art("material-tools", "Herramientas de joyería"),
    },
  ],
  gallery: [
    {
      ...demo,
      id: "inspiration-piece",
      step: "piece",
      caption: "Formas orgánicas · pieza conceptual",
      image: art("gallery-organic", "Pieza inspirada en hojas"),
    },
    {
      ...demo,
      id: "inspiration-detail",
      step: "detail",
      caption: "Detalles que brillan · ilustración",
      image: art("gallery-gem-flower", "Detalle de una flor con gemas"),
    },
    {
      ...demo,
      id: "inspiration-hands",
      step: "hands",
      caption: "Manos que crean · esquema de encuadre",
      image: {
        src: "/ar-crafts/photography-guide/hands.svg",
        alt: "Esquema de manos trabajando; no es una fotografía real",
        kind: "illustration",
        rightsConfirmed: false,
      },
    },
  ],
  faq: [
    {
      ...demo,
      id: "faq-experience",
      question: "¿Necesito experiencia para llevar un taller?",
      answer:
        "Dependerá del taller. Este contenido es demostrativo: el nivel y los requisitos se confirmarán antes de ofrecer una edición.",
    },
    {
      ...demo,
      id: "faq-includes",
      question: "¿Qué materiales incluye cada taller?",
      answer:
        "Los materiales y herramientas incluidos están por confirmar para cada edición. La demo no ofrece una inscripción ni garantiza suministros.",
    },
    {
      ...demo,
      id: "faq-material",
      question: "¿Cómo consulto por un material?",
      answer:
        "Cuando el contacto esté confirmado podrás consultar por la presentación y disponibilidad. Por ahora, los enlaces llevan al estado de contacto pendiente.",
    },
  ],
});
