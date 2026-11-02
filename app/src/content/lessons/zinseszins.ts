import type { Lesson } from "../types";

export const zinseszins: Lesson = {
  id: "zinseszins",
  title: "Zinseszins",
  shortTitle: "Zinseszins",
  icon: "trending-up",
  teaser: "Wie Erträge auf Erträge dein Geld mit der Zeit wachsen lassen können.",
  intro:
    "Der Zinseszins ist einer der wichtigsten Effekte beim langfristigen Sparen. Er wirkt langsam – aber je länger, desto stärker.",
  minutes: 5,
  sections: [
    {
      id: "zinsen",
      heading: "Was sind Zinsen?",
      paragraphs: [
        "**Zinsen** sind der Preis für geliehenes Geld. Legst du Geld bei einer Bank an, leihst du es ihr gewissermaßen – und bekommst dafür Zinsen. Sie werden meist in Prozent pro Jahr angegeben.",
      ],
    },
    {
      id: "zinsen-auf-zinsen",
      heading: "Zinsen auf Zinsen",
      paragraphs: [
        "Beim **Zinseszins** werden die Zinsen nicht ausgegeben, sondern bleiben angelegt. Im nächsten Jahr bekommst du dann Zinsen auf deinen ursprünglichen Betrag **und** auf die bisherigen Zinsen.",
        "Bei Aktien oder Fonds spricht man eher von **Wertzuwachs** oder Rendite. Das Prinzip ist ähnlich, aber die Entwicklung ist nicht gleichmäßig: Es gibt gute und schlechte Jahre, auch Verluste.",
      ],
    },
    {
      id: "zeit",
      heading: "Zeit ist der stärkste Hebel",
      paragraphs: [
        "Am Anfang ist der Zinseszins kaum zu sehen. Erst nach vielen Jahren wird er deutlich, weil der Betrag, auf den es Erträge gibt, immer größer wird.",
        "Deshalb kann ein früher Start viel ausmachen – auch mit kleinen Beträgen.",
      ],
    },
    {
      id: "eingezahlt-gewachsen",
      heading: "Eingezahlt oder gewachsen?",
      paragraphs: [
        "Bei jeder Berechnung lohnt sich der Blick auf zwei Teile: die **Einzahlungen** (dein eigenes Geld) und den **Wertzuwachs** (was dazugekommen ist).",
        "Die Einzahlungen hast du wirklich selbst beigetragen. Der Wertzuwachs ist bei schwankenden Anlagen nicht sicher – er kann größer, kleiner oder sogar negativ ausfallen.",
      ],
    },
  ],
  example: {
    title: "100 € mit 5 % Zinsen",
    paragraphs: [
      "Du legst 100 € zu 5 % Zinsen pro Jahr an. Nach einem Jahr hast du 105 €.",
      "Im zweiten Jahr bekommst du 5 % auf 105 € – also 110,25 €. Die zusätzlichen 25 Cent sind Zinsen auf deine Zinsen. Mit jedem Jahr wird dieser Anteil größer.",
    ],
  },
  interactive: {
    kind: "interest-steps",
    title: "Mit und ohne Zinseszins",
    description:
      "Vergleiche 100 € bei 5 % pro Jahr: einmal werden die Zinsen ausgezahlt, einmal bleiben sie angelegt.",
  },
  takeaways: [
    "Zinseszins heißt: Erträge werden wieder angelegt und bringen selbst Erträge.",
    "Der Effekt wird mit der Zeit immer stärker – ein früher Start kann viel ausmachen.",
    "Unterscheide immer zwischen eingezahltem Geld und Wertzuwachs.",
    "Bei Aktien und Fonds schwankt der Zuwachs. Rechner zeigen nur Annahmen.",
  ],
  quiz: [
    {
      id: "zinseszins-rechnen",
      prompt:
        "Du legst 200 € zu 5 % Zinsen pro Jahr an und lässt die Zinsen stehen. Wie viel hast du nach zwei Jahren?",
      correctOptionId: "c",
      options: [
        {
          id: "a",
          text: "210 €",
          feedback:
            "Das ist der Stand nach einem Jahr. Im zweiten Jahr kommen weitere Zinsen dazu – sogar auf die Zinsen aus dem ersten Jahr.",
        },
        {
          id: "b",
          text: "220 €",
          feedback:
            "Das wäre ohne Zinseszins: zweimal 10 €. Im zweiten Jahr gibt es aber 5 % auf 210 €, also 10,50 €.",
        },
        {
          id: "c",
          text: "220,50 €",
          feedback:
            "200 € → 210 € → 220,50 €. Die 50 Cent sind Zinsen auf die Zinsen aus dem ersten Jahr.",
        },
      ],
    },
    {
      id: "zinseszins-frueh",
      prompt: "Warum kann ein früher Start beim Sparen so viel ausmachen?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "Weil junge Menschen höhere Zinsen bekommen.",
          feedback:
            "Zinsen und Renditen hängen nicht vom Alter ab. Der Vorteil ist die längere Zeit.",
        },
        {
          id: "b",
          text: "Weil der Zinseszins mehr Zeit hat zu wirken.",
          feedback:
            "Je länger Erträge wieder angelegt werden, desto stärker kann der Betrag wachsen.",
        },
        {
          id: "c",
          text: "Weil früh angelegtes Geld garantiert nicht an Wert verliert.",
          feedback:
            "Eine Garantie gibt es nicht. Ein langer Zeitraum kann helfen, Schwankungen auszusitzen – sicher ist aber nichts.",
        },
      ],
    },
    {
      id: "zinseszins-ergebnis",
      prompt:
        "Ein Rechner zeigt: 12.000 € eingezahlt, 18.000 € geschätzter Endwert. Welche Aussage stimmt?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "Du machst sicher 6.000 € Gewinn.",
          feedback:
            "Der Endwert ist nur eine Schätzung auf Basis einer angenommenen Rendite. Sicher ist er nicht.",
        },
        {
          id: "b",
          text: "12.000 € sind dein eigenes Geld, 6.000 € sind geschätzter Wertzuwachs.",
          feedback:
            "Die Einzahlungen kommen von dir. Der Zuwachs beruht auf einer Annahme und kann anders ausfallen.",
        },
        {
          id: "c",
          text: "Du hast die 18.000 € komplett selbst eingezahlt.",
          feedback: "Eingezahlt hast du 12.000 €. Der Rest ist der geschätzte Wertzuwachs.",
        },
      ],
    },
  ],
};
