import { useId, useState } from "react";
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
import { useDepot } from "@/hooks/use-depot";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDate } from "@/lib/format";
import { depotStore } from "@/lib/depot/store";
import { progressStore } from "@/lib/progress/store";

/**
 * Deletes the practice portfolio after confirmation. Learning progress stays
 * unless the user explicitly ticks the extra option.
 */
export function DepotReset() {
  const hydrated = useHydrated();
  const { state, issue } = useDepot();
  const [alsoProgress, setAlsoProgress] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const checkboxId = useId();
  const portfolio = state.portfolio;
  const stored = portfolio !== null || issue === "newer-version";

  function reset() {
    depotStore.reset();
    let text = depotStore.isPersisted()
      ? "Erledigt: Dein Übungsdepot wurde gelöscht."
      : "Das Übungsdepot wurde zurückgesetzt. Der Browser hat das Löschen im Speicher aber blockiert.";
    if (alsoProgress) {
      progressStore.reset();
      text += " Dein Lernfortschritt wurde ebenfalls gelöscht.";
    } else {
      text += " Dein Lernfortschritt bleibt erhalten.";
    }
    setMessage(text);
    setAlsoProgress(false);
  }

  return (
    <div className="space-y-3">
      {portfolio ? (
        <ul className="space-y-1 text-[0.9375rem]">
          <li>
            Depot: <span className="font-semibold">{portfolio.name}</span>, angelegt am{" "}
            {formatDate(portfolio.createdAt)}
          </li>
          <li>
            Positionen:{" "}
            <span className="font-semibold tabular-nums">{portfolio.positions.length}</span>
          </li>
          <li>
            Virtuelle Transaktionen:{" "}
            <span className="font-semibold tabular-nums">{portfolio.transactions.length}</span>
          </li>
          <li>
            Gespeicherte Messpunkte für den Verlauf:{" "}
            <span className="font-semibold tabular-nums">{portfolio.snapshots.length}</span>
          </li>
        </ul>
      ) : null}

      <AlertDialog onOpenChange={(open) => (open ? setAlsoProgress(false) : undefined)}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={!hydrated || !stored}>
            <Trash2 aria-hidden="true" />
            Übungsdepot zurücksetzen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Übungsdepot wirklich zurücksetzen?</AlertDialogTitle>
            <AlertDialogDescription>
              Startguthaben, Positionen, alle virtuellen Transaktionen, deine Notizen und der
              Depotverlauf werden auf diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen.
              Dein Lernfortschritt bleibt erhalten, wenn du unten nichts anderes auswählst.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <input
              id={checkboxId}
              type="checkbox"
              checked={alsoProgress}
              onChange={(event) => setAlsoProgress(event.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-destructive"
            />
            <label htmlFor={checkboxId} className="text-[0.9375rem]">
              Auch Lernfortschritt löschen
              <span className="block text-sm text-muted-foreground">
                Abgeschlossene Themen, Quizergebnisse und Rechner-Werte
              </span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={reset}
              className={buttonVariants({ variant: "destructive" })}
            >
              {alsoProgress ? "Depot und Fortschritt löschen" : "Ja, Depot löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p role="status" className="text-[0.9375rem] font-medium text-primary-strong">
        {message ?? (hydrated && !stored ? "Es ist kein Übungsdepot gespeichert." : "")}
      </p>
    </div>
  );
}
