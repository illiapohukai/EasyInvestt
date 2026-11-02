import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { QuizQuestion } from "@/content/types";
import { QuizQuestionCard } from "./QuizQuestionCard";

const question: QuizQuestion = {
  id: "test-frage",
  prompt: "Was passiert bei Inflation?",
  correctOptionId: "b",
  options: [
    {
      id: "a",
      text: "Preise sinken",
      feedback: "Bei Inflation steigen die Preise im Durchschnitt.",
    },
    {
      id: "b",
      text: "Preise steigen",
      feedback: "Genau, dein Geld verliert dadurch an Kaufkraft.",
    },
  ],
};

describe("QuizQuestionCard", () => {
  it("explains a wrong answer and allows a retry", () => {
    const onAnswer = vi.fn();
    render(<QuizQuestionCard question={question} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByRole("button", { name: /Preise sinken/ }));
    expect(screen.getByText("Noch nicht ganz.")).toBeInTheDocument();
    expect(screen.getByText(/steigen die Preise im Durchschnitt/)).toBeInTheDocument();
    expect(onAnswer).toHaveBeenLastCalledWith({ correct: false, firstAttempt: true });

    fireEvent.click(screen.getByRole("button", { name: /Preise steigen/ }));
    expect(screen.getByText("Richtig!")).toBeInTheDocument();
    expect(screen.getByText(/verliert dadurch an Kaufkraft/)).toBeInTheDocument();
    expect(onAnswer).toHaveBeenLastCalledWith({ correct: true, firstAttempt: false });
  });

  it("locks the question once it is solved", () => {
    const onAnswer = vi.fn();
    render(<QuizQuestionCard question={question} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole("button", { name: /Preise steigen/ }));
    fireEvent.click(screen.getByRole("button", { name: /Preise sinken/ }));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Preise sinken/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
