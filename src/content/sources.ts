import type { ExternalSource } from "./state-programs";

export interface InfoSource extends ExternalSource {
  description: string;
}

/** Official and independent consumer information sources. */
export const infoSources: readonly InfoSource[] = [
  {
    label: "Verbraucherzentrale",
    url: "https://www.verbraucherzentrale.de",
    description: "Unabhängige Informationen zu Geld, Verträgen, Altersvorsorge und Förderungen.",
  },
  {
    label: "Bundesregierung",
    url: "https://www.bundesregierung.de",
    description: "Aktuelle Informationen zu Gesetzen, etwa zur Reform der privaten Altersvorsorge.",
  },
  {
    label: "Bundesministerium der Finanzen",
    url: "https://www.bundesfinanzministerium.de",
    description: "Offizielle Informationen zu Steuern, Förderungen und Gesetzesvorhaben.",
  },
  {
    label: "Deutsche Rentenversicherung",
    url: "https://www.deutsche-rentenversicherung.de",
    description: "Alles zur gesetzlichen Rente und zur Renteninformation.",
  },
  {
    label: "Familienkasse",
    url: "https://www.arbeitsagentur.de/familie-und-kinder/kindergeld",
    description: "Offizielle Stelle für das Kindergeld: Anspruch, Höhe und Antrag.",
  },
  {
    label: "BaFin – Informationen für Verbraucher",
    url: "https://www.bafin.de",
    description:
      "Finanzaufsicht mit Hinweisen zu Geldanlage, Risiken und Warnungen vor unseriösen Angeboten.",
  },
];
