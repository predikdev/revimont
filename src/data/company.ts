export const SITE_URL = "https://revimont-klatovy.cz";

export const COMPANY = {
  name: "Revimont Klatovy",
  legalName: "Revimont Klatovy",
  description:
    "Elektroinstalace, revize, montáže a opravy elektrozařízení v Klatovech a okolí. Důraz na bezpečnost, kvalitu a poctivě odvedenou práci.",
  phoneDisplay: "+420 775 736 112",
  phoneHref: "+420775736112",
  email: "social.predik@gmail.com",
  ico: "22089497",
  dic: "CZ22089497",
  address: {
    streetAddress: "K Letišti 965",
    postalCode: "339 01",
    addressLocality: "Klatovy",
    addressCountry: "CZ",
  },
  serviceArea: "Klatovy a okolí",
  openingHours: ["Mo-Fr 07:00-16:00"],
  geo: {
    latitude: 49.4073,
    longitude: 13.2958,
  },
} as const;

export const MAPS_QUERY = `${COMPANY.address.streetAddress}, ${COMPANY.address.postalCode} ${COMPANY.address.addressLocality}`;

export const MAPS_SEARCH_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}`;
export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`;
