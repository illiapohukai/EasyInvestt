/**
 * Neutral, simplified characteristics of common asset classes.
 * Levels are rough educational categories, not measured values.
 */

export type RiskLevel = 1 | 2 | 3 | 4 | 5;

export const RISK_LABELS: Record<RiskLevel, string> = {
  1: "niedrig",
  2: "niedrig bis mittel",
  3: "mittel",
  4: "hoch",
  5: "sehr hoch",
};

export interface AssetClass {
  id: string;
  name: string;
  summary: string;
  risk: RiskLevel;
  /** Short description of the typical risk level, e.g. depends on content. */
  riskNote?: string;
  fluctuation: string;
  accessibility: string;
  liquidity: string;
  beginnerNote: string;
  details: string[];
}

export const assetClasses: readonly AssetClass[] = [
  {
    id: "tagesgeld-festgeld",
    name: "Tagesgeld & Festgeld",
    summary: "Geld liegt auf einem Konto bei einer Bank und bringt Zinsen.",
    risk: 1,
    fluctuation: "Keine Kursschwankungen. Beim Tagesgeld kann sich der Zinssatz jederzeit ändern.",
    accessibility: "Konto bei einer Bank, meist ohne Mindestbetrag. Unter 18 nur mit den Eltern.",
    liquidity:
      "Tagesgeld ist täglich verfügbar. Festgeld ist bis zum Ende der vereinbarten Laufzeit gebunden.",
    beginnerNote:
      "Passt gut für den Notgroschen. Die Zinsen gleichen die Inflation aber nicht immer aus.",
    details: [
      "Tagesgeld: jederzeit verfügbar, der Zins ist variabel.",
      "Festgeld: Das Geld ist für eine feste Zeit angelegt, dafür ist der Zins fest vereinbart.",
      "Die gesetzliche Einlagensicherung in der EU schützt Guthaben bis 100.000 € pro Person und Bank.",
    ],
  },
  {
    id: "anleihen",
    name: "Anleihen",
    summary: "Du leihst einem Staat oder einem Unternehmen Geld und bekommst dafür Zinsen.",
    risk: 2,
    riskNote: "je nach Schuldner",
    fluctuation:
      "Gering bis mittel. Die Kurse ändern sich zum Beispiel, wenn sich das allgemeine Zinsniveau ändert.",
    accessibility: "Über ein Wertpapierdepot – einzeln oder gebündelt über Fonds.",
    liquidity:
      "Meist börsentäglich verkaufbar. Vor Laufzeitende aber nur zum aktuellen Kurs, der unter dem Kaufpreis liegen kann.",
    beginnerNote:
      "Das Risiko hängt stark davon ab, wer sich das Geld leiht. Kann der Schuldner nicht zahlen, ist Geld verloren.",
    details: [
      "Am Ende der Laufzeit bekommst du den geliehenen Betrag zurück – wenn der Schuldner zahlen kann.",
      "Anleihen von Staaten mit guter Bonität gelten als sicherer als viele Unternehmensanleihen.",
      "Höhere Zinsen bedeuten meist ein höheres Ausfallrisiko.",
    ],
  },
  {
    id: "aktien",
    name: "Aktien",
    summary: "Du kaufst einen kleinen Anteil an einem Unternehmen und bist Miteigentümer.",
    risk: 4,
    fluctuation:
      "Stark. Kursverluste von mehreren Dutzend Prozent kommen vor, manchmal über Jahre.",
    accessibility:
      "Über ein Wertpapierdepot. Bei manchen Anbietern auch Bruchteile von Aktien mit kleinen Beträgen.",
    liquidity: "Börsentäglich verkaufbar – bei gefallenen Kursen aber nur mit Verlust.",
    beginnerNote:
      "Einzelne Unternehmen können pleitegehen. Wer nur wenige Aktien besitzt, trägt ein hohes Einzelrisiko.",
    details: [
      "Als Miteigentümer kannst du an Gewinnen beteiligt werden, etwa über Dividenden.",
      "Über lange Zeiträume haben breit gestreute Aktienanlagen in der Vergangenheit oft höhere Erträge gebracht als Konten – eine Garantie für die Zukunft ist das nicht.",
      "Kurzfristig sind Verluste normal und können jederzeit auftreten.",
    ],
  },
  {
    id: "etfs",
    name: "ETFs",
    summary:
      "Börsengehandelte Fonds, die einen Index nachbilden – zum Beispiel viele Aktien auf einmal.",
    risk: 3,
    riskNote: "je nach Inhalt",
    fluctuation:
      "Hängt vom Inhalt ab. Ein Aktien-ETF schwankt ungefähr so stark wie der Aktienmarkt, den er abbildet.",
    accessibility:
      "Über ein Wertpapierdepot. Per Sparplan bei vielen Anbietern schon mit kleinen monatlichen Beträgen.",
    liquidity: "Börsentäglich verkaufbar – zum jeweils aktuellen Kurs.",
    beginnerNote:
      "Streuung senkt das Risiko einzelner Unternehmen, schützt aber nicht vor Rückgängen des ganzen Marktes. Auf die laufenden Kosten achten.",
    details: [
      "Ein Index ist eine Liste von Wertpapieren, etwa die größten Unternehmen eines Landes oder der Welt.",
      "ETFs sind meist günstiger als aktiv gemanagte Fonds, weil niemand einzelne Aktien auswählt.",
      "Es gibt ETFs auf Aktien, Anleihen, Rohstoffe und mehr – das Risiko unterscheidet sich stark.",
    ],
  },
  {
    id: "immobilien",
    name: "Immobilien",
    summary: "Häuser und Wohnungen – direkt gekauft oder indirekt über Fonds.",
    risk: 3,
    fluctuation:
      "Direkt gekaufte Immobilien ändern ihren Preis langsamer, aber teils deutlich. Immobilienfonds können ebenfalls schwanken.",
    accessibility:
      "Eine eigene Immobilie braucht viel Eigenkapital und meist einen Kredit. Indirekt über Fonds auch mit kleineren Beträgen.",
    liquidity: "Gering – eine Immobilie lässt sich nicht schnell verkaufen.",
    beginnerNote:
      "Neben dem Kaufpreis fallen Nebenkosten, Instandhaltung und viel Verantwortung an. Für junge Menschen meist ein Thema für später.",
    details: [
      "Vermietete Immobilien können Mieteinnahmen bringen, aber auch leer stehen.",
      "Ein Kredit erhöht das Risiko, weil er unabhängig vom Immobilienwert zurückgezahlt werden muss.",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    summary: "Edelmetall, das als Münzen, Barren oder über Wertpapiere gekauft werden kann.",
    risk: 3,
    fluctuation: "Teils stark – auch über mehrere Jahre kann der Preis deutlich fallen.",
    accessibility:
      "Münzen und Barren bei Händlern oder Banken, alternativ über Wertpapiere im Depot.",
    liquidity: "Meist gut verkaufbar, beim Verkauf fallen aber oft Abschläge oder Kosten an.",
    beginnerNote:
      "Gold bringt keine Zinsen oder Dividenden. Der Wert hängt nur davon ab, was andere später dafür zahlen.",
    details: [
      "Gold gilt manchen als Schutz in Krisen – verlässlich ist das nicht.",
      "Physisches Gold muss sicher aufbewahrt werden, was zusätzlich kosten kann.",
    ],
  },
  {
    id: "krypto",
    name: "Kryptowerte",
    summary: "Digitale Werte wie Bitcoin, die über spezielle Plattformen gehandelt werden.",
    risk: 5,
    fluctuation: "Extrem. Halbierungen des Werts innerhalb kurzer Zeit sind schon oft vorgekommen.",
    accessibility: "Über Handelsplattformen oder Apps, oft schon mit sehr kleinen Beträgen.",
    liquidity: "Rund um die Uhr handelbar – die Preise können aber plötzlich einbrechen.",
    beginnerNote:
      "Kein Schutz vor Wertverlust und viele Betrugsmaschen über Social Media. Wenn überhaupt, nur mit Geld, dessen kompletten Verlust man verkraften könnte.",
    details: [
      "Kryptowerte haben keinen inneren Ertrag wie Zinsen oder Unternehmensgewinne.",
      "Plattformen können gehackt werden oder pleitegehen.",
      "Versprechen von sicheren, schnellen Gewinnen sind ein Warnsignal.",
    ],
  },
];
