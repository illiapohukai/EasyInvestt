import { createFileRoute, notFound } from "@tanstack/react-router";
import { LessonView } from "@/components/lesson/LessonView";
import { getLesson } from "@/content/lessons";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/lernen/$lessonId")({
  loader: ({ params }) => {
    const lesson = getLesson(params.lessonId);
    if (!lesson) throw notFound();
    return { lessonId: lesson.id };
  },
  head: ({ loaderData }) => {
    const lesson = loaderData ? getLesson(loaderData.lessonId) : undefined;
    return {
      meta: lesson
        ? [
            { title: `${lesson.title} – ${SITE.name}` },
            { name: "description", content: lesson.teaser },
          ]
        : [{ title: `Thema nicht gefunden – ${SITE.name}` }],
    };
  },
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useLoaderData();
  const lesson = getLesson(lessonId);
  // The loader guarantees a valid id; this keeps TypeScript and edge cases safe.
  if (!lesson) return null;
  // `key` resets quiz and interactive state when switching between lessons.
  return <LessonView key={lesson.id} lesson={lesson} />;
}
