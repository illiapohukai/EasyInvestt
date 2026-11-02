import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { lessons } from "@/content/lessons";
import { useHydrated } from "@/hooks/use-hydrated";
import { useProgress } from "@/hooks/use-progress";
import { countCompleted, hasStoredData } from "@/lib/progress/model";
import { progressStore } from "@/lib/progress/store";

/** Shows what is stored and deletes it after an explicit confirmation. */
export function ResetProgress() {
  const hydrated = useHydrated();
  const progress = useProgress();
  const [message, setMessage] = useState<string | null>(null);
  const completed = countCompleted(progress, lessons);
  const stored = hasStoredData(progress);

  function reset() {
    progressStore.reset();
    setMessage(
      progressStore.isPersisted()
        ? "Erledigt: Dein Lernfortschritt und die Rechner-Werte wurden gelöscht. Dein Übungsdepot bleibt erhalten."
        : "Der Fortschritt wurde zurückgesetzt. Der Browser hat das Löschen im Speicher aber blockiert.",
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1 text-[0.9375rem]">
        <li>
          Abgeschlossene Themen:{" "}
          <span className="font-semibold tabular-nums">
            {completed} von {lessons.length}
          </span>
        </li>
        <li>
          Begonnene Themen:{" "}
          <span className="font-semibold tabular-nums">{progress.opened.length}</span>
        </li>
        <li>
          Gespeicherte Rechner-Werte:{" "}
          <span className="font-semibold">{progress.calculator ? "ja" : "nein"}</span>
        </li>
      </ul>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={!hydrated || !stored}>
            <Trash2 aria-hidden="true" />
            Lernfortschritt zurücksetzen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lernfortschritt wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Abgeschlossene Themen, Quizergebnisse, das zuletzt geöffnete Thema und die
              Rechner-Werte werden auf diesem Gerät gelöscht. Das lässt sich nicht rückgängig
              machen. Dein Übungsdepot bleibt erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={reset}
              className={buttonVariants({ variant: "destructive" })}
            >
              Ja, Lernfortschritt löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p role="status" className="text-[0.9375rem] font-medium text-primary-strong">
        {message ?? (hydrated && !stored ? "Es ist noch nichts gespeichert." : "")}
      </p>
    </div>
  );
}
