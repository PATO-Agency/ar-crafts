export const legalLinks = [
  { slug: "terminos-y-condiciones", label: "Términos y condiciones" },
  { slug: "privacidad", label: "Política de privacidad" },
  { slug: "cookies", label: "Política de cookies" },
  {
    slug: "condiciones-comerciales",
    label: "Entregas, cancelaciones y devoluciones",
  },
] as const;

export const legalPaths = legalLinks.map(({ slug }) => `/legal/${slug}`);
