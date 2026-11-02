import type { Lesson } from "../types";

export const grundlagen: Lesson = {
  id: "grundlagen",
  title: "Grundlagen",
  shortTitle: "Grundlagen",
  icon: "lightbulb",
  teaser: "Sparen, Anlegen, Inflation und Risiko – das Fundament für alles Weitere.",
  intro:
    "Bevor es um Zinsen oder Aktien geht, helfen dir ein paar Grundbegriffe. Mit ihnen kannst du jede Geldentscheidung besser einordnen.",
  minutes: 5,
  sections: [
    {
      id: "sparen-anlegen",
      heading: "Sparen oder anlegen?",
      paragraphs: [
        "**Sparen** heißt: Du legst Geld zur Seite, zum Beispiel auf einem Konto. Es bleibt schnell verfügbar und schwankt nicht im Wert.",
        "**Anlegen** (auch: investieren) heißt: Du setzt Geld so ein, dass es wachsen kann – etwa durch Zinsen oder durch Wertpapiere wie Aktien. Dafür kann der Wert zwischendurch auch sinken.",
      ],
    },
    {
      id: "inflation",
      heading: "Inflation: Warum Geld an Wert verliert",
      paragraphs: [
        "Viele Preise steigen mit der Zeit. Das nennt man **Inflation**. Für denselben Geldbetrag bekommst du dann weniger – deine **Kaufkraft** sinkt.",
        "Geld, das ohne Zinsen herumliegt, verliert also langsam an Wert, obwohl der Betrag gleich bleibt.",
      ],
    },
    {
      id: "risiko-rendite",
      heading: "Risiko und Rendite gehören zusammen",
      paragraphs: [
        "**Rendite** ist der Ertrag einer Geldanlage, meist angegeben in Prozent pro Jahr. **Risiko** bedeutet: Das Ergebnis kann schlechter ausfallen als erwartet – bis hin zu Verlusten.",
        "Eine Grundregel: Höhere Renditechancen gehen fast immer mit höherem Risiko einher. Hohe Rendite ganz ohne Risiko gibt es nicht. Wer so etwas verspricht, verdient Misstrauen.",
      ],
    },
    {
      id: "notgroschen",
      heading: "Notgroschen zuerst",
      paragraphs: [
        "Ein **Notgroschen** ist eine Geldreserve für Unerwartetes – etwa ein kaputtes Handy oder eine Reparatur am Fahrrad. Er sollte jederzeit verfügbar sein, zum Beispiel auf einem Tagesgeldkonto.",
        "Häufig genannt werden drei bis sechs Monatsausgaben. Wie viel für dich passt, hängt davon ab, welche festen Kosten du hast. Erst wenn die Reserve steht, ist Anlegen ein Thema.",
      ],
    },
    {
      id: "streuen",
      heading: "Streuen statt alles auf eine Karte",
      paragraphs: [
        "**Diversifikation** (Streuung) bedeutet, Geld auf viele verschiedene Anlagen zu verteilen. Läuft eine davon schlecht, wirkt sich das weniger stark auf dein gesamtes Geld aus.",
      ],
    },
    {
      id: "zeithorizont",
      heading: "Wann brauchst du das Geld?",
      paragraphs: [
        "Der **Anlagehorizont** ist die Zeit, bis du das Geld brauchst. Geld für die nächsten Monate oder wenigen Jahre – etwa für den Führerschein – sollte keinem hohen Marktrisiko ausgesetzt sein. Sind die Kurse genau dann gefallen, müsstest du mit Verlust verkaufen.",
        "Je länger du Geld nicht brauchst, desto eher kannst du zwischenzeitliche Schwankungen aussitzen. Eine Garantie ist aber auch ein langer Zeitraum nicht.",
      ],
    },
  ],
  example: {
    title: "100 € und die Inflation",
    paragraphs: [
      "Angenommen, die Preise steigen zehn Jahre lang jedes Jahr um 2 %. Dann kannst du dir mit 100 € am Ende nur noch so viel kaufen wie heute mit etwa 82 €.",
      "Die 100 € sind noch da – aber sie sind weniger wert.",
    ],
  },
  interactive: {
    kind: "inflation",
    title: "Kaufkraft ausprobieren",
    description:
      "Stell ein, wie stark die Preise steigen und wie viele Jahre vergehen. Du siehst, was 100 € dann noch wert sind.",
  },
  takeaways: [
    "Sparen hält Geld verfügbar, Anlegen gibt ihm Wachstumschancen – mit Schwankungen.",
    "Inflation senkt die Kaufkraft von Geld, das nicht wächst.",
    "Mehr Renditechance bedeutet meistens mehr Risiko.",
    "Erst den Notgroschen aufbauen. Geld, das du bald brauchst, nicht riskant anlegen.",
    "Streuen verringert das Risiko, dass ein einzelner Verlust alles trifft.",
  ],
  quiz: [
    {
      id: "grundlagen-inflation",
      prompt:
        "Die Preise steigen jedes Jahr um 2 %. Was passiert mit 100 €, die zehn Jahre lang ohne Zinsen im Sparschwein liegen?",
      correctOptionId: "a",
      options: [
        {
          id: "a",
          text: "Sie sind am Ende weniger wert, weil man sich weniger dafür kaufen kann.",
          feedback:
            "Der Betrag bleibt gleich, aber die Kaufkraft sinkt – nach zehn Jahren auf etwa 82 € von heute.",
        },
        {
          id: "b",
          text: "Sie sind genauso viel wert wie heute.",
          feedback:
            "Es bleiben zwar 100 €, aber weil die Preise steigen, bekommst du dafür weniger.",
        },
        {
          id: "c",
          text: "Sie werden automatisch mehr.",
          feedback:
            "Ohne Zinsen oder andere Erträge wächst Geld nicht. Durch die Inflation verliert es sogar an Kaufkraft.",
        },
      ],
    },
    {
      id: "grundlagen-horizont",
      prompt:
        "Du willst in einem Jahr deinen Führerschein bezahlen. Wo ist das Geld dafür am ehesten passend aufgehoben?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "In einer einzelnen Aktie, weil sie in einem Jahr stark steigen könnte.",
          feedback:
            "Eine einzelne Aktie kann in einem Jahr auch deutlich fallen. Für Geld, das du bald brauchst, ist das Risiko zu hoch.",
        },
        {
          id: "b",
          text: "Auf einem Tagesgeld- oder Sparkonto, wo es sicher und verfügbar ist.",
          feedback:
            "Bei kurzen Zeiträumen zählt vor allem, dass das Geld sicher und rechtzeitig da ist.",
        },
        {
          id: "c",
          text: "In Kryptowährungen, weil man dort schnell Gewinne machen kann.",
          feedback:
            "Kryptowerte schwanken extrem. So schnell wie Gewinne sind auch große Verluste möglich.",
        },
      ],
    },
    {
      id: "grundlagen-streuung",
      prompt: "Was bedeutet Diversifikation?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "Das ganze Geld in die Anlage mit der höchsten Rendite stecken.",
          feedback: "Das wäre das Gegenteil: Alles auf eine Karte zu setzen, erhöht das Risiko.",
        },
        {
          id: "b",
          text: "Geld auf viele verschiedene Anlagen verteilen.",
          feedback: "Läuft eine Anlage schlecht, trifft das nur einen Teil deines Geldes.",
        },
        {
          id: "c",
          text: "Geld nur als Bargeld aufbewahren.",
          feedback: "Bargeld ist nicht gestreut und verliert durch Inflation an Kaufkraft.",
        },
      ],
    },
  ],
};
