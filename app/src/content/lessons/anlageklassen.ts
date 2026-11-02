import type { Lesson } from "../types";

export const anlageklassen: Lesson = {
  id: "anlageklassen",
  title: "Anlageklassen",
  shortTitle: "Anlageklassen",
  icon: "layers",
  teaser: "Tagesgeld, Anleihen, Aktien, ETFs & Co. – neutral im Vergleich.",
  intro:
    "Es gibt sehr unterschiedliche Arten, Geld anzulegen. Sie unterscheiden sich vor allem darin, wie stark sie schwanken, wie schnell du an dein Geld kommst und wie viel Wissen sie voraussetzen.",
  minutes: 7,
  sections: [
    {
      id: "kriterien",
      heading: "Worauf du bei jeder Anlage achten kannst",
      paragraphs: ["Vier Fragen helfen dir, jede Anlageklasse einzuordnen:"],
      terms: [
        {
          term: "Risiko",
          definition: "Wie wahrscheinlich und wie hoch können Verluste sein?",
        },
        {
          term: "Schwankung",
          definition: "Wie stark kann sich der Wert kurzfristig nach oben und unten bewegen?",
        },
        {
          term: "Liquidität",
          definition: "Wie schnell kommst du wieder an dein Geld – und zu welchem Preis?",
        },
        {
          term: "Zugänglichkeit",
          definition: "Wie leicht ist der Einstieg, und mit welchen Beträgen ist er möglich?",
        },
      ],
    },
    {
      id: "dreieck",
      heading: "Man kann nicht alles gleichzeitig haben",
      paragraphs: [
        "Sicherheit, Verfügbarkeit und Rendite lassen sich nicht gleichzeitig maximieren. Fachleute sprechen vom **magischen Dreieck der Geldanlage**.",
        "Eine Anlage, die sehr sicher und jederzeit verfügbar ist, bringt in der Regel wenig Rendite. Höhere Renditechancen gibt es nur mit mehr Schwankung oder längerer Bindung.",
      ],
    },
    {
      id: "mischen",
      heading: "Mischen statt wählen",
      paragraphs: [
        "Viele Menschen nutzen mehrere Anlageklassen gleichzeitig: zum Beispiel ein Tagesgeldkonto für den Notgroschen und breit gestreute Anlagen für Ziele, die weit in der Zukunft liegen.",
        "Welche Mischung zu jemandem passt, hängt von Zielen, Zeithorizont und Risikobereitschaft ab. Diese Übersicht erklärt die Unterschiede – sie empfiehlt keine bestimmte Anlage.",
      ],
    },
  ],
  example: {
    title: "Zwei Ziele, zwei Wege",
    paragraphs: [
      "Mia spart für einen Laptop, den sie in acht Monaten kaufen möchte. Das Geld liegt auf einem Tagesgeldkonto – es soll sicher und rechtzeitig verfügbar sein.",
      "Für ein Ziel in 15 Jahren könnte sie auch schwankungsreichere Anlagen in Betracht ziehen, weil sie Zeit hat, Kursrückgänge auszusitzen. Das ist ein Lernbeispiel, keine Empfehlung.",
    ],
  },
  interactive: {
    kind: "asset-classes",
    title: "Anlageklassen im Vergleich",
    description:
      "Tippe auf eine Anlageklasse, um Schwankung, Verfügbarkeit, Einstieg und wichtige Hinweise zu sehen.",
  },
  takeaways: [
    "Keine Anlageklasse ist gleichzeitig sehr sicher, sofort verfügbar und renditestark.",
    "Tagesgeld eignet sich für Reserven, schwankende Anlagen eher für lange Zeiträume.",
    "ETFs streuen breit, können aber genauso fallen wie der Markt, den sie abbilden.",
    "Kryptowerte sind sehr riskant – und ein beliebtes Feld für Betrug.",
  ],
  quiz: [
    {
      id: "anlageklassen-notgroschen",
      prompt: "Welche Anlage passt am ehesten zu einem Notgroschen?",
      correctOptionId: "a",
      options: [
        {
          id: "a",
          text: "Tagesgeld",
          feedback:
            "Tagesgeld ist täglich verfügbar und schwankt nicht im Wert – wichtig für unerwartete Ausgaben.",
        },
        {
          id: "b",
          text: "Kryptowerte",
          feedback:
            "Kryptowerte können innerhalb kurzer Zeit stark fallen. Für eine Reserve, die jederzeit da sein soll, passen sie nicht.",
        },
        {
          id: "c",
          text: "Eine eigene Immobilie",
          feedback:
            "Eine Immobilie lässt sich nicht schnell verkaufen. Ein Notgroschen muss aber sofort verfügbar sein.",
        },
      ],
    },
    {
      id: "anlageklassen-etf",
      prompt: "Was ist ein ETF?",
      correctOptionId: "a",
      options: [
        {
          id: "a",
          text: "Ein börsengehandelter Fonds, der einen Index nachbildet und so in viele Unternehmen gleichzeitig investiert.",
          feedback:
            "Dadurch ist das Geld automatisch auf viele Werte verteilt. Schwanken kann es trotzdem.",
        },
        {
          id: "b",
          text: "Ein Sparkonto mit festem Zins.",
          feedback:
            "Das beschreibt eher Festgeld. Der Wert eines ETFs schwankt mit den enthaltenen Wertpapieren.",
        },
        {
          id: "c",
          text: "Eine Anlage mit garantierter Rendite.",
          feedback: "ETFs haben keine garantierte Rendite. Ihr Wert kann steigen und fallen.",
        },
      ],
    },
    {
      id: "anlageklassen-betrug",
      prompt:
        "Jemand verspricht auf Social Media: „Mit dieser Kryptowährung verdoppelst du dein Geld sicher in einem Monat.“ Wie schätzt du das ein?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "Glaubwürdig, weil Kryptowerte schnell steigen können.",
          feedback:
            "Kryptowerte können steigen, aber genauso stark fallen. Eine sichere Verdopplung gibt es nicht.",
        },
        {
          id: "b",
          text: "Als Warnsignal – hohe Rendite ohne Risiko gibt es nicht.",
          feedback:
            "Versprechen von sicheren, schnellen Gewinnen sind ein typisches Merkmal von Betrug.",
        },
        {
          id: "c",
          text: "Als sinnvoll, wenn schon viele andere mitmachen.",
          feedback:
            "Viele Mitmachende machen eine Anlage nicht sicherer. Gerade Betrugsmaschen setzen auf diesen Effekt.",
        },
      ],
    },
  ],
};
