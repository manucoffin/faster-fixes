/**
 * Major French cities for programmatic SEO
 * Used to generate location-based professional directory pages
 * Format: /professionnels/[activity-slug]/[city-slug]
 */

export interface MajorCity {
  slug: string;
  name: string;
  code: string; // INSEE code (e.g., "75056" for Paris)
  departmentCode: string;
  departmentName: string;
  regionCode: string;
  regionName: string;
}

export const MAJOR_CITIES: MajorCity[] = [
  {
    slug: "paris",
    name: "Paris",
    code: "75056",
    departmentCode: "75",
    departmentName: "Paris",
    regionCode: "11",
    regionName: "Île-de-France",
  },
  {
    slug: "marseille",
    name: "Marseille",
    code: "13055",
    departmentCode: "13",
    departmentName: "Bouches-du-Rhône",
    regionCode: "93",
    regionName: "Provence-Alpes-Côte d'Azur",
  },
  {
    slug: "lyon",
    name: "Lyon",
    code: "69123",
    departmentCode: "69",
    departmentName: "Rhône",
    regionCode: "84",
    regionName: "Auvergne-Rhône-Alpes",
  },
  {
    slug: "toulouse",
    name: "Toulouse",
    code: "31555",
    departmentCode: "31",
    departmentName: "Haute-Garonne",
    regionCode: "76",
    regionName: "Occitanie",
  },
  {
    slug: "nice",
    name: "Nice",
    code: "06088",
    departmentCode: "06",
    departmentName: "Alpes-Maritimes",
    regionCode: "93",
    regionName: "Provence-Alpes-Côte d'Azur",
  },
  {
    slug: "nantes",
    name: "Nantes",
    code: "44109",
    departmentCode: "44",
    departmentName: "Loire-Atlantique",
    regionCode: "52",
    regionName: "Pays de la Loire",
  },
  {
    slug: "montpellier",
    name: "Montpellier",
    code: "34172",
    departmentCode: "34",
    departmentName: "Hérault",
    regionCode: "76",
    regionName: "Occitanie",
  },
  {
    slug: "strasbourg",
    name: "Strasbourg",
    code: "67482",
    departmentCode: "67",
    departmentName: "Bas-Rhin",
    regionCode: "44",
    regionName: "Grand Est",
  },
  {
    slug: "bordeaux",
    name: "Bordeaux",
    code: "33063",
    departmentCode: "33",
    departmentName: "Gironde",
    regionCode: "75",
    regionName: "Nouvelle-Aquitaine",
  },
  {
    slug: "lille",
    name: "Lille",
    code: "59350",
    departmentCode: "59",
    departmentName: "Nord",
    regionCode: "32",
    regionName: "Hauts-de-France",
  },
  {
    slug: "rennes",
    name: "Rennes",
    code: "35238",
    departmentCode: "35",
    departmentName: "Ille-et-Vilaine",
    regionCode: "53",
    regionName: "Bretagne",
  },
  {
    slug: "reims",
    name: "Reims",
    code: "51454",
    departmentCode: "51",
    departmentName: "Marne",
    regionCode: "44",
    regionName: "Grand Est",
  },
  {
    slug: "saint-etienne",
    name: "Saint-Étienne",
    code: "42218",
    departmentCode: "42",
    departmentName: "Loire",
    regionCode: "84",
    regionName: "Auvergne-Rhône-Alpes",
  },
  {
    slug: "toulon",
    name: "Toulon",
    code: "83137",
    departmentCode: "83",
    departmentName: "Var",
    regionCode: "93",
    regionName: "Provence-Alpes-Côte d'Azur",
  },
  {
    slug: "le-havre",
    name: "Le Havre",
    code: "76217",
    departmentCode: "76",
    departmentName: "Seine-Maritime",
    regionCode: "28",
    regionName: "Normandie",
  },
  {
    slug: "grenoble",
    name: "Grenoble",
    code: "38185",
    departmentCode: "38",
    departmentName: "Isère",
    regionCode: "84",
    regionName: "Auvergne-Rhône-Alpes",
  },
  {
    slug: "dijon",
    name: "Dijon",
    code: "21231",
    departmentCode: "21",
    departmentName: "Côte-d'Or",
    regionCode: "27",
    regionName: "Bourgogne-Franche-Comté",
  },
  {
    slug: "angers",
    name: "Angers",
    code: "49007",
    departmentCode: "49",
    departmentName: "Maine-et-Loire",
    regionCode: "52",
    regionName: "Pays de la Loire",
  },
  {
    slug: "nimes",
    name: "Nîmes",
    code: "30189",
    departmentCode: "30",
    departmentName: "Gard",
    regionCode: "76",
    regionName: "Occitanie",
  },
  {
    slug: "villeurbanne",
    name: "Villeurbanne",
    code: "69266",
    departmentCode: "69",
    departmentName: "Rhône",
    regionCode: "84",
    regionName: "Auvergne-Rhône-Alpes",
  },
];

/**
 * Get a city by its slug
 * Used for quick lookups during page generation
 */
export function getCityBySlugSync(slug: string): MajorCity | undefined {
  return MAJOR_CITIES.find((city) => city.slug === slug);
}

/**
 * Get city slugs for URL slug validation
 */
export function getMajorCitySlugs(): string[] {
  return MAJOR_CITIES.map((city) => city.slug);
}
