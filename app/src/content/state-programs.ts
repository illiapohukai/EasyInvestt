import { SITE } from "@/config/site";

export type ProgramStatus = "aktiv" | "beschlossen" | "geplant" | "im-wandel";

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  aktiv: "Aktiv",
  beschlossen: "Beschlossen",
  geplant: "Geplant",
  "im-wandel": "Im Wandel",
};

export interface ExternalSource {
  label: string;
  url: string;
}

export interface StateProgram {
  id: string;
  name: string;
  status: ProgramStatus;
  /** One-line status explanation, e.g. planned start date. */
  statusDetail: string;
  description: string;
  relevance: string;
  check: ExternalSource;
  asOf: string;
}

const asOf = SITE.contentReviewedAt;

/**
 * Overview of government programmes.
 * Status and dates were checked in November 2026 and can change at any time.
 * Amounts are intentionally omitted where they depend on income or contracts.
 */
export const statePrograms: readonly StateProgram[] = [
  {
    id: "kindergeld",
    name: "Kindergeld",
    status: "aktiv",
    statusDetail: "2026: 259 € pro Kind und Monat",
    description:
      "Monatliche Leistung, die in der Regel die Eltern erhalten. Sie dient vor allem dem Unterhalt des Kindes.",
    relevance:
      "Gibt es meist bis 18, während Ausbildung oder Studium unter bestimmten Bedingungen bis 25. Eine Erhöhung für 2027 war im November 2026 geplant, aber noch nicht beschlossen.",
    check: {
      label: "Familienkasse",
      url: "https://www.arbeitsagentur.de/familie-und-kinder/kindergeld",
    },
    asOf,
  },
  {
    id: "vl",
    name: "Vermögenswirksame Leistungen (VL)",
    status: "aktiv",
    statusDetail: "Abhängig vom Arbeits- oder Tarifvertrag",
    description:
      "Ein Zuschuss, den manche Arbeitgeber zusätzlich zum Lohn in einen speziellen Sparvertrag einzahlen – auch während der Ausbildung.",
    relevance:
      "Ob und wie viel es gibt, regelt der Arbeits- oder Tarifvertrag. Nachfragen lohnt sich.",
    check: {
      label: "Verbraucherzentrale",
      url: "https://www.verbraucherzentrale.de",
    },
    asOf,
  },
  {
    id: "arbeitnehmersparzulage",
    name: "Arbeitnehmersparzulage",
    status: "aktiv",
    statusDetail: "Nur unterhalb bestimmter Einkommensgrenzen",
    description:
      "Eine staatliche Zulage auf vermögenswirksame Leistungen, die in bestimmte Sparformen fließen, etwa in Fondssparpläne.",
    relevance:
      "Ob du sie bekommst, hängt von deinem Einkommen und der Sparform ab. Beantragt wird sie über die Steuererklärung.",
    check: {
      label: "Verbraucherzentrale",
      url: "https://www.verbraucherzentrale.de",
    },
    asOf,
  },
  {
    id: "wohnungsbaupraemie",
    name: "Wohnungsbauprämie",
    status: "aktiv",
    statusDetail: "Mit Einkommensgrenzen und Bedingungen",
    description:
      "Eine Prämie auf Sparbeiträge, zum Beispiel in einen Bausparvertrag, wenn das Geld später fürs Wohnen genutzt wird.",
    relevance: "Es gelten Einkommensgrenzen und weitere Bedingungen zur Verwendung des Geldes.",
    check: {
      label: "Verbraucherzentrale",
      url: "https://www.verbraucherzentrale.de",
    },
    asOf,
  },
  {
    id: "riester",
    name: "Riester-Rente",
    status: "im-wandel",
    statusDetail: "Neuverträge nach altem Modell nur bis Ende 2026",
    description: "Bisheriges staatlich gefördertes Modell der privaten Altersvorsorge mit Zulagen.",
    relevance:
      "Bestehende Verträge laufen weiter. Ab 2027 wird das alte Modell für neue Verträge durch neue Produkte ersetzt.",
    check: {
      label: "Bundesregierung: Fragen und Antworten zur Reform",
      url: "https://www.bundesregierung.de/breg-de/aktuelles/reform-private-altersvorsorge-2400072",
    },
    asOf,
  },
  {
    id: "altersvorsorgedepot",
    name: "Neue geförderte private Altersvorsorge",
    status: "beschlossen",
    statusDetail: "Gesetz beschlossen, Start am 1. Januar 2027",
    description:
      "Mit dem Altersvorsorgereformgesetz von 2026 soll es neue staatlich geförderte Produkte geben – darunter ein Altersvorsorgedepot ohne Beitragsgarantie und ein einfaches Standarddepot.",
    relevance:
      "Die Produkte sind im November 2026 noch nicht verfügbar. Förderung und Angebote solltest du zum Start genau prüfen.",
    check: {
      label: "Bundesregierung: Fragen und Antworten zur Reform",
      url: "https://www.bundesregierung.de/breg-de/aktuelles/reform-private-altersvorsorge-2400072",
    },
    asOf,
  },
  {
    id: "fruehstart-rente",
    name: "Frühstart-Rente",
    status: "geplant",
    statusDetail:
      "Bundestag hat zugestimmt, Bundesrat steht noch aus; geplanter Start: Januar 2027",
    description:
      "Geplant ist, dass der Staat für Kinder vom 6. bis zum 18. Lebensjahr monatlich einen kleinen Betrag in ein Altersvorsorgedepot einzahlt – beginnend mit dem Geburtsjahrgang 2020.",
    relevance:
      "Für Jugendliche, die heute 16 oder älter sind, gilt sie nach den Plänen nicht mehr. Interessant ist sie etwa für jüngere Geschwister.",
    check: {
      label: "Bundesregierung: Frühstartrente",
      url: "https://www.bundesregierung.de/breg-de/aktuelles/fruehstartrente-2449404",
    },
    asOf,
  },
];
