import { QuestionBuilder } from './QuestionBuilder';
import { LessonBuilder } from './LessonBuilder';
import { getQuestionsFromUnit } from '@/controllers/questions';
import { getLessonsForUnit } from '@/controllers/lessons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function page({
  params,
}: {
  params: { id: number; unitId: number };
}) {
  const [questions, lessons] = await Promise.all([
    getQuestionsFromUnit(params.unitId),
    getLessonsForUnit(params.unitId),
  ]);

  return (
    <div className="p-4">
      <Tabs defaultValue="questions">
        <TabsList className="mb-4">
          <TabsTrigger value="questions">
            Preguntas ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="lessons">
            Lecciones ({lessons.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <QuestionBuilder questions={questions} unitId={params.unitId} />
        </TabsContent>

        <TabsContent value="lessons">
          <LessonBuilder unitId={params.unitId} initialLessons={lessons} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
