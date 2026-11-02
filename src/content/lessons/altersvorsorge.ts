import type { Lesson } from "../types";

export const altersvorsorge: Lesson = {
  id: "altersvorsorge",
  title: "Altersvorsorge",
  shortTitle: "Altersvorsorge",
  icon: "hourglass",
  teaser: "Warum lange Zeiträume zählen und wie gesetzliche und private Vorsorge zusammenspielen.",
  intro:
    "Rente klingt weit weg. Gerade deshalb lohnt sich ein Blick darauf: Für kaum ein Ziel hast du so viel Zeit wie für die Vorsorge im Alter.",
  minutes: 6,
  sections: [
    {
      id: "warum",
      heading: "Warum schon jetzt darüber nachdenken?",
      paragraphs: [
        "Im Alter fällt das Einkommen aus dem Job weg. Die gesetzliche Rente ersetzt in der Regel nur einen Teil davon. Viele Menschen ergänzen sie deshalb durch eigene Vorsorge.",
      ],
    },
    {
      id: "gesetzlich",
      heading: "Die gesetzliche Rente",
      paragraphs: [
        "Wer angestellt arbeitet, zahlt Pflichtbeiträge in die **gesetzliche Rentenversicherung**. Sie funktioniert im **Umlageverfahren**: Die Beiträge der Erwerbstätigen von heute finanzieren die Renten von heute.",
        "Wie hoch deine eigene Rente später ist, hängt unter anderem davon ab, wie lange und wie viel du einzahlst.",
      ],
    },
    {
      id: "privat",
      heading: "Betriebliche und private Vorsorge",
      paragraphs: [
        "Daneben gibt es die **betriebliche Altersvorsorge** über den Arbeitgeber und die **private Vorsorge**, bei der du selbst Geld für später zurücklegst.",
        "Private Vorsorge ist meist **kapitalgedeckt**: Dein eigenes Geld wird angelegt und kann wachsen – aber auch schwanken.",
      ],
    },
    {
      id: "bindung",
      heading: "Lange Zeiträume: Chance und Bindung",
      paragraphs: [
        "Zwischen heute und der Rente liegen Jahrzehnte. In dieser Zeit kann der Zinseszins viel bewirken.",
        "Gleichzeitig gilt: Geld in speziellen Vorsorgeverträgen ist oft bis zum Ruhestand gebunden. Du kommst lange nicht oder nur mit Nachteilen daran. Für Ziele wie Führerschein oder Studium ist dieses Geld nicht gedacht.",
      ],
    },
    {
      id: "aenderungen",
      heading: "Regeln können sich ändern",
      paragraphs: [
        "Rentenpolitik ändert sich immer wieder – zum Beispiel beim Rentenalter, bei der Förderung oder bei den Produkten, die es gibt.",
        "So soll es ab Januar 2027 neue staatlich geförderte Produkte für die private Altersvorsorge geben. Mehr dazu im Thema „Hilfe vom Staat“. Prüfe vor jeder Entscheidung den aktuellen Stand.",
      ],
    },
  ],
  example: {
    title: "Wie lange noch bis zur Rente?",
    paragraphs: [
      "Wer heute 17 ist und mit 67 in Rente geht, hat noch 50 Jahre Zeit. Würde diese Person jeden Monat 30 € zurücklegen, wären das in 50 Jahren 18.000 € eigene Einzahlungen.",
      "Wie viel daraus werden könnte, hängt von der Rendite ab – und die lässt sich über so lange Zeit nicht vorhersagen.",
    ],
  },
  interactive: {
    kind: "retirement-timeline",
    title: "Dein Zeitstrahl bis zur Rente",
    description:
      "Stell dein Alter und einen Beispielbetrag ein. Du siehst, wie viel Zeit bleibt und wie verschiedene Annahmen das Ergebnis verändern.",
  },
  takeaways: [
    "Die gesetzliche Rente deckt meist nur einen Teil des späteren Einkommens.",
    "Private Vorsorge ist meist kapitalgedeckt: Das Geld wird für dich angelegt und kann schwanken.",
    "Lange Zeiträume sind ein Vorteil – aber Vorsorgegeld ist oft lange gebunden.",
    "Regeln und Produkte ändern sich. Prüfe immer den aktuellen Stand.",
  ],
  quiz: [
    {
      id: "altersvorsorge-umlage",
      prompt: "Wie funktioniert die gesetzliche Rente in Deutschland grundsätzlich?",
      correctOptionId: "a",
      options: [
        {
          id: "a",
          text: "Die Beiträge der Erwerbstätigen finanzieren die heutigen Renten.",
          feedback:
            "Das nennt man Umlageverfahren: Das Geld wird nicht für dich angelegt, sondern direkt an die heutigen Rentner ausgezahlt.",
        },
        {
          id: "b",
          text: "Jede Person spart auf ein eigenes Aktiendepot.",
          feedback:
            "Das beschreibt eher eine private, kapitalgedeckte Vorsorge – nicht die gesetzliche Rente.",
        },
        {
          id: "c",
          text: "Alle bekommen die gleiche Rente, egal wie lange sie gearbeitet haben.",
          feedback:
            "Die Höhe der gesetzlichen Rente hängt unter anderem davon ab, wie lange und wie viel jemand eingezahlt hat.",
        },
      ],
    },
    {
      id: "altersvorsorge-bindung",
      prompt:
        "Was solltest du bei Geld bedenken, das in einen speziellen Altersvorsorgevertrag fließt?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "Man kann es jederzeit ohne Nachteile abheben.",
          feedback:
            "Meist ist das nicht so: Vorsorgegeld ist oft bis zum Ruhestand gebunden, eine vorzeitige Auszahlung kann Nachteile haben.",
        },
        {
          id: "b",
          text: "Es ist oft bis zum Ruhestand gebunden.",
          feedback:
            "Für kurzfristige Ziele wie Führerschein oder Laptop ist dieses Geld daher nicht gedacht.",
        },
        {
          id: "c",
          text: "Es wächst garantiert jedes Jahr.",
          feedback:
            "Bei kapitalgedeckter Vorsorge schwankt der Wert. Ein Wachstum in jedem Jahr ist nicht garantiert.",
        },
      ],
    },
    {
      id: "altersvorsorge-geplant",
      prompt: "Du liest, dass der Staat eine neue Förderung „plant“. Was bedeutet das?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "Die Förderung gibt es schon und man kann sie sofort nutzen.",
          feedback: "„Geplant“ heißt: Die Regel gilt noch nicht. Details können sich noch ändern.",
        },
        {
          id: "b",
          text: "Die Regeln stehen noch nicht endgültig fest – aktuelle offizielle Infos prüfen.",
          feedback:
            "Erst wenn ein Gesetz beschlossen und in Kraft ist, gelten die Regeln verbindlich.",
        },
        {
          id: "c",
          text: "Geplante Förderungen werden immer genau so umgesetzt.",
          feedback:
            "Im Gesetzgebungsverfahren können sich Details ändern, und Pläne können auch ganz scheitern.",
        },
      ],
    },
  ],
};
