import type { Lesson } from "../types";

export const kleineBetraege: Lesson = {
  id: "kleine-betraege",
  title: "Sparen mit kleinen Beträgen",
  shortTitle: "Kleine Beträge",
  icon: "piggy-bank",
  teaser:
    "Budget planen, Reserve aufbauen und regelmäßig kleine Beträge sparen – auch rund ums Kindergeld.",
  intro:
    "Du brauchst kein großes Vermögen, um anzufangen. Wichtiger als ein hoher Startbetrag ist ein Plan: Was kommt rein, was geht raus – und was bleibt übrig?",
  minutes: 6,
  sections: [
    {
      id: "budget",
      heading: "Erst der Überblick, dann sparen",
      paragraphs: [
        "Bevor du Geld anlegst, solltest du wissen, wohin dein Geld fließt. Ein **Budget** ist eine einfache Übersicht über deine monatlichen Einnahmen und Ausgaben.",
        "Schon eine grobe Liste zeigt oft, wo Geld „versickert“ – etwa bei Snacks, Abos oder In-App-Käufen.",
      ],
    },
    {
      id: "trennen",
      heading: "Feste Ausgaben und Reserve getrennt halten",
      paragraphs: [
        "Geld für Dinge, die du sicher bezahlen musst – etwa Handyvertrag, Fahrkarte oder Essen –, gehört nicht in eine Anlage.",
        "Als Nächstes baust du eine kleine Reserve auf. Erst was danach übrig bleibt und länger nicht gebraucht wird, kommt für langfristiges Sparen infrage.",
      ],
    },
    {
      id: "regelmaessig",
      heading: "Regelmäßigkeit schlägt Startbetrag",
      paragraphs: [
        "Wer jeden Monat einen kleinen, festen Betrag spart, baut über die Jahre oft mehr auf als jemand, der einmal viel zurücklegt und dann aufhört.",
        "Ein **Sparplan** macht das automatisch: Jeden Monat wird ein fester Betrag gespart oder angelegt. Tipp: Leg den Sparbetrag am Monatsanfang zur Seite – nicht nur das, was am Ende übrig bleibt.",
      ],
    },
    {
      id: "kindergeld",
      heading: "Und das Kindergeld?",
      paragraphs: [
        "**Kindergeld** bekommen in der Regel deine Eltern. Im Jahr 2026 sind es 259 € pro Kind und Monat – meist bis zum 18. Geburtstag, während Ausbildung oder Studium unter bestimmten Bedingungen bis 25.",
        "Das Kindergeld ist vor allem für deinen Unterhalt gedacht: Essen, Kleidung, Wohnen, Schule. Manche Familien legen einen Teil davon für später zurück. Ob und wie viel, entscheidet die Familie gemeinsam – es geht nicht darum, das gesamte Kindergeld anzulegen.",
        "Der Betrag kann sich ändern. Den aktuellen Stand findest du bei der Familienkasse.",
      ],
    },
  ],
  example: {
    title: "Ein Monatsbudget",
    paragraphs: [
      "Lukas (17) bekommt 60 € Taschengeld und verdient 150 € im Minijob. Er gibt 15 € fürs Handy, 50 € für Essen und Trinken und 60 € für Freizeit aus. Übrig bleiben 85 €.",
      "Er legt zuerst 35 € als Reserve zurück, bis sein Notgroschen steht, und spart 50 € regelmäßig für später. Die Zahlen sind ein ausgedachtes Lernbeispiel.",
    ],
  },
  interactive: {
    kind: "budget",
    title: "Dein Monatsbudget",
    description:
      "Trag Einnahmen und Ausgaben ein – mit eigenen Zahlen oder dem Beispiel. Die Werte werden nicht gespeichert.",
  },
  takeaways: [
    "Ein Budget zeigt dir, wie viel Geld wirklich übrig bleibt.",
    "Feste Ausgaben und die Reserve kommen zuerst. Angelegt wird nur, was du länger nicht brauchst.",
    "Kleine, regelmäßige Beträge können über die Jahre viel bewirken.",
    "Kindergeld ist vor allem für den Unterhalt da – ob ein Teil gespart wird, entscheidet die Familie.",
  ],
  quiz: [
    {
      id: "kleine-betraege-reserve",
      prompt:
        "Lena hat 120 € Einnahmen und 100 € feste Ausgaben im Monat. Eine Reserve hat sie noch nicht. Was ist ein sinnvoller erster Schritt?",
      correctOptionId: "a",
      options: [
        {
          id: "a",
          text: "Die übrigen 20 € zuerst als Reserve zurücklegen.",
          feedback:
            "Eine Reserve schützt vor unerwarteten Ausgaben. Danach kann Lena über langfristiges Sparen nachdenken.",
        },
        {
          id: "b",
          text: "Alle 120 € anlegen, damit sie schneller wachsen.",
          feedback:
            "Dann fehlt ihr das Geld für die festen Ausgaben. Angelegt wird nur Geld, das man nicht bald braucht.",
        },
        {
          id: "c",
          text: "Einen Kredit aufnehmen, um mehr anlegen zu können.",
          feedback:
            "Mit geliehenem Geld anzulegen ist sehr riskant: Den Kredit muss man auch dann zurückzahlen, wenn die Anlage an Wert verliert.",
        },
      ],
    },
    {
      id: "kleine-betraege-sparplan",
      prompt: "Was ist ein Sparplan?",
      correctOptionId: "a",
      options: [
        {
          id: "a",
          text: "Ein fester Betrag, der regelmäßig – zum Beispiel monatlich – gespart oder angelegt wird.",
          feedback:
            "Ein Sparplan sorgt dafür, dass du dranbleibst, ohne jeden Monat neu entscheiden zu müssen.",
        },
        {
          id: "b",
          text: "Ein Versprechen der Bank, dass sich das Geld verdoppelt.",
          feedback:
            "Ein Sparplan legt nur fest, wie regelmäßig gespart wird. Über die Rendite verspricht er nichts.",
        },
        {
          id: "c",
          text: "Eine einmalige große Einzahlung.",
          feedback: "Das wäre eine Einmalanlage. Beim Sparplan geht es um regelmäßige Beträge.",
        },
      ],
    },
    {
      id: "kleine-betraege-monatsanfang",
      prompt:
        "Warum kann es sinnvoll sein, den Sparbetrag schon am Monatsanfang zur Seite zu legen?",
      correctOptionId: "b",
      options: [
        {
          id: "a",
          text: "Weil Banken am Monatsanfang höhere Zinsen zahlen.",
          feedback:
            "Der Tag im Monat ändert an den Zinsen praktisch nichts. Es geht um die Gewohnheit.",
        },
        {
          id: "b",
          text: "Weil Sparen so zur festen Gewohnheit wird, statt vom Rest abzuhängen.",
          feedback: "Wer erst am Monatsende spart, hat oft nichts mehr übrig.",
        },
        {
          id: "c",
          text: "Weil man danach im Monat kein Geld mehr ausgeben darf.",
          feedback:
            "Den Rest kannst du ganz normal ausgeben. Der Sparbetrag ist nur vorher sicher beiseitegelegt.",
        },
      ],
    },
  ],
};
