import type { ImageMetadata } from "astro";

import Prace01 from "../assets/images/el_prace_1.jpeg";
import Prace02 from "../assets/images/el_prace_2.jpeg";
import Prace03 from "../assets/images/el_prace_3.jpeg";

export interface Project {
  slug: string;
  lastmod?: string; // ISO date YYYY-MM-DD
  title: string;
  location: string;
  category: string;
  description: string;
  seoDescription?: string;
  heroImage: ImageMetadata;
  heroImageAlt: string;
  challenge: {
    title: string;
    text: string;
  };
  solution: {
    title: string;
    text: string;
  };
  gallery: ImageMetadata[];
}

export const projects: Project[] = [
  {
    slug: "elektroinstalace-haly-klatovy",
    lastmod: "2025-12-01",
    title: "Elektroinstalace haly",
    location: "Klatovy",
    category: "Elektroinstalace",
    description:
      "Realizace elektroinstalace v průmyslovém prostoru, kde se řeší hlavně rychlost, bezpečnost a přesnost provedení. Probíhala montáž vedení a příprava rozvodů ve výšce tak, aby navazující části instalace šly napojit bez zdržení.",
    seoDescription:
      "Elektroinstalace průmyslové haly v Klatovech. Montáž vedení, příprava rozvodů a bezpečné předání s dokumentací.",
    heroImage: Prace02,
    heroImageAlt: "Elektroinstalace průmyslové haly — Revimont Klatovy",
    challenge: {
      title: "Zadání projektu",
      text: "Zákazník potřeboval kompletní elektroinstalaci průmyslové haly v co nejkratším termínu, aniž by bylo narušeno souběžně probíhající stavební dílo. Klíčovým požadavkem bylo čisté vedení tras ve výšce a připravenost přípojných míst pro navazující technologie.",
    },
    solution: {
      title: "Náš přístup",
      text: "Práce jsme koordinovali s dalšími řemesly na stavbě a zvolili logické vedení tras s jasným značením. Veškeré spoje a rozvaděče byly provedeny podle projektové dokumentace a předány zákazníkovi s revizní zprávou a kompletní dokumentací skutečného provedení.",
    },
    gallery: [Prace02],
  },
  {
    slug: "revize-rozvadece-susice",
    lastmod: "2025-12-01",
    title: "Revize a servis rozvaděče",
    location: "Sušice",
    category: "Revize",
    description:
      "U tohoto projektu šlo o kontrolu a úpravu rozvaděče, aby byl přehledný a hlavně bezpečný. Byly prověřené okruhy, jištění a funkce ochranných prvků a doplněno vše, co bylo potřeba pro spolehlivý provoz.",
    seoDescription:
      "Revize a servis elektrického rozvaděče v Sušici. Kontrola jištění, ochranných prvků, oprava závad a přehledné značení.",
    heroImage: Prace01,
    heroImageAlt: "Revize a servis elektrického rozvaděče — Revimont Klatovy",
    challenge: {
      title: "Zadání projektu",
      text: "Zákazník provozoval starší rozvaděč bez aktuální dokumentace a s nejasným zapojením. Cílem bylo provést komplexní revizi, opravit zjištěné závady, doplnit chybějící prvky jištění a vytvořit přehledné schéma zapojení pro budoucí servis.",
    },
    solution: {
      title: "Náš přístup",
      text: "Provedli jsme důkladnou prohlídku všech obvodů, měření a zkoušení ochranných prvků. Závady byly ihned opraveny, rozvaděč doplněn a přehledně popsán. Výsledkem je bezpečné a srozumitelné řešení, které se snadno servisuje i do budoucna.",
    },
    gallery: [Prace01],
  },
  {
    slug: "venkovni-rozvadec-zelezna-ruda",
    lastmod: "2026-01-15",
    title: "Venkovní rozvaděč — příprava",
    location: "Železná Ruda",
    category: "Elektroinstalace",
    description:
      "Příprava venkovního rozvaděče před finálním dokončením. Osazení prvků, svorkování a pečlivé značení vodičů, aby bylo zapojení jasné a bez chyb i při dalších krocích na stavbě.",
    seoDescription:
      "Příprava venkovního rozvaděče v Železné Rudě. Osazení prvků, svorkování a značení vodičů pro bezpečné napojení.",
    heroImage: Prace03,
    heroImageAlt: "Příprava venkovního rozvaděče — Revimont Klatovy",
    challenge: {
      title: "Zadání projektu",
      text: "Stavba vyžadovala přípravu venkovního rozvaděče odolného vůči povětrnostním podmínkám, s přehledným a bezchybným svorkováním. Rozvaděč musel být připraven k rychlému napojení dalších technologií bez nutnosti dalších zásahů do zapojení.",
    },
    solution: {
      title: "Náš přístup",
      text: "Rozvaděč byl osazen kvalitními prvky vhodných pro venkovní použití, všechny vodiče pečlivě označeny a zapojení provedeno podle schématu. Výsledkem je přehledné a bezpečné řešení, které umožňuje rychlé a bezchybné připojení navazujících zařízení.",
    },
    gallery: [Prace03],
  },
];
