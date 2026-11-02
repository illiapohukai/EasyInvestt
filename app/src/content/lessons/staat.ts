import type { Lesson } from "../types";

export const staat: Lesson = {
  id: "staat",
  title: "Hilfe vom Staat",
  shortTitle: "Hilfe vom Staat",
  icon: "landmark",
  teaser:
    "Welche Förderungen es gibt, welche geplant sind – und wie du den aktuellen Stand prüfst.",
  intro:
    "Der Staat fördert unter bestimmten Bedingungen das Sparen und die Altersvorsorge. Wichtig ist, genau hinzuschauen: Manches gibt es schon lange, anderes ist erst beschlossen, geplant oder wird gerade umgebaut.",
  minutes: 6,
  sections: [
    {
      id: "status",
      heading: "Aktiv, beschlossen oder geplant?",
      paragraphs: ["Bei jeder Förderung lohnt sich zuerst der Blick auf den Status:"],
      terms: [
        {
          term: "Aktiv",
          definition: "Die Regel gilt bereits und kann genutzt werden.",
        },
        {
          term: "Beschlossen",
          definition:
            "Das Gesetz ist verabschiedet, die Regeln gelten aber erst ab einem späteren Datum.",
        },
        {
          term: "Geplant",
          definition:
            "Es gibt einen Entwurf oder Vorschlag. Details können sich ändern, der Plan kann auch scheitern.",
        },
        {
          term: "Im Wandel",
          definition: "Ein bestehendes Angebot wird umgebaut oder läuft für neue Verträge aus.",
        },
      ],
    },
    {
      id: "situation",
      heading: "Ob du etwas bekommst, hängt von dir ab",
      paragraphs: [
        "Ob jemand eine Förderung bekommt, hängt von der persönlichen Situation ab – etwa vom Alter, vom Einkommen, von der Ausbildung oder vom Arbeitsvertrag.",
        "Die Übersicht unten erklärt nur das Prinzip. Sie ersetzt keine Prüfung im Einzelfall und nennt bewusst keine Beträge, die sich schnell ändern können.",
      ],
    },
    {
      id: "pruefen",
      heading: "So prüfst du den aktuellen Stand",
      paragraphs: [
        "Informiere dich bei offiziellen Stellen wie der Bundesregierung, dem Bundesfinanzministerium, der Deutschen Rentenversicherung oder der Familienkasse – und bei unabhängigen Stellen wie der Verbraucherzentrale.",
        "Achte immer auf das Datum einer Information. Ein Artikel von vor zwei Jahren kann heute schon veraltet sein.",
      ],
    },
  ],
  example: {
    title: "Vermögenswirksame Leistungen in der Ausbildung",
    paragraphs: [
      "Jonas beginnt eine Ausbildung. In seinem Arbeitsvertrag steht, dass der Betrieb vermögenswirksame Leistungen zahlt. Er fragt in der Personalabteilung nach, wie viel es ist und welche Sparformen möglich sind.",
      "Ob er zusätzlich die Arbeitnehmersparzulage bekommt, hängt unter anderem von seinem Einkommen und der gewählten Sparform ab.",
    ],
  },
  interactive: {
    kind: "state-programs",
    title: "Förderungen im Überblick",
    description:
      "Filtere nach Status. Bei jedem Eintrag steht, wo du den aktuellen Stand prüfen kannst.",
  },
  takeaways: [
    "Unterscheide genau: aktiv, beschlossen, geplant oder im Wandel.",
    "Ob du eine Förderung bekommst, hängt von deiner persönlichen Situation ab.",
    "Achte bei jeder Information auf das Datum und prüfe offizielle Quellen.",
  ],
  quiz: [
    {
      id: "staat-status",
      prompt:
        "Der Bundestag hat ein Gesetz beschlossen, der Bundesrat muss aber noch zustimmen. Wie ist der Status?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "Die Förderung ist bereits aktiv.",
          feedback:
            "Solange die Zustimmung fehlt und das Gesetz nicht in Kraft ist, gilt die Regel nicht.",
        },
        {
          id: "b",
          text: "Sie ist noch nicht in Kraft – Details und Start können sich noch ändern.",
          feedback:
            "Erst nach Abschluss des Verfahrens und zum genannten Startdatum gelten die Regeln.",
        },
        {
          id: "c",
          text: "Sie ist endgültig gescheitert.",
          feedback: "Auch das stimmt nicht. Das Verfahren läuft noch – das Ergebnis ist offen.",
        },
      ],
    },
    {
      id: "staat-vl",
      prompt: "Wovon hängt es vor allem ab, ob du vermögenswirksame Leistungen bekommst?",
      correctOptionId: "a",
      options: [
        {
          id: "a",
          text: "Vom Arbeitgeber, also vom Arbeits- oder Tarifvertrag.",
          feedback:
            "Vermögenswirksame Leistungen zahlt der Arbeitgeber – ob und wie viel, regelt der Vertrag.",
        },
        {
          id: "b",
          text: "Alle bekommen sie automatisch ab 16.",
          feedback:
            "Es gibt sie nur über einen Arbeitgeber, der sie zahlt. Das Alter allein reicht nicht.",
        },
        {
          id: "c",
          text: "Nur davon, ob man ein Girokonto hat.",
          feedback:
            "Ein Konto braucht man zwar, entscheidend ist aber, ob der Arbeitgeber vermögenswirksame Leistungen zahlt.",
        },
      ],
    },
    {
      id: "staat-quelle",
      prompt: "Du findest einen Artikel über Förderungen von vor drei Jahren. Was ist sinnvoll?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "Ihn genau so übernehmen – Gesetze ändern sich selten.",
          feedback:
            "Gerade bei Förderungen ändern sich Regeln und Beträge immer wieder. Drei Jahre sind eine lange Zeit.",
        },
        {
          id: "b",
          text: "Den aktuellen Stand bei offiziellen Stellen oder der Verbraucherzentrale prüfen.",
          feedback:
            "Offizielle und unabhängige Quellen mit aktuellem Datum sind die beste Grundlage.",
        },
        {
          id: "c",
          text: "Davon ausgehen, dass die Förderung inzwischen höher ist.",
          feedback:
            "Das ist reine Vermutung. Förderungen können steigen, sinken oder ganz wegfallen.",
        },
      ],
    },
  ],
};
