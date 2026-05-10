import Link from "next/link";
import { ChevronRight, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Button as GameButton } from "@/components/game/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const courses = [
  {
    id: "derecho-civil",
    name: "Derecho Civil",
    progress: 65,
    units: "12 / 18",
    rank: 4,
    status: "in-progress" as const,
  },
  {
    id: "constitucional",
    name: "Constitucional",
    progress: 22,
    units: "4 / 18",
    rank: 21,
    status: "in-progress" as const,
  },
  {
    id: "penal",
    name: "Penal",
    progress: 100,
    units: "16 / 16",
    rank: 2,
    status: "completed" as const,
  },
  {
    id: "mercantil",
    name: "Mercantil",
    progress: 8,
    units: "1 / 14",
    rank: 30,
    status: "paused" as const,
  },
];

const statusBadge = {
  "in-progress": (
    <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
      En progreso
    </Badge>
  ),
  completed: (
    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
      Completado
    </Badge>
  ),
  paused: (
    <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Pausado
    </Badge>
  ),
};

export default function CoursesWireframe() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis cursos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            4 inscripciones, 2 activas esta semana
          </p>
        </div>
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          Explorar catálogo
        </Button>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos (4)</TabsTrigger>
          <TabsTrigger value="progress">En progreso (2)</TabsTrigger>
          <TabsTrigger value="completed">Completados (1)</TabsTrigger>
          <TabsTrigger value="paused">Pausados (1)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const isCompleted = course.status === "completed";
          return (
            <Card
              key={course.id}
              className="flex flex-col border-0 shadow-card transition-shadow duration-normal hover:shadow-card-hover focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2"
            >
              <CardHeader className="pb-3">
                <div className="mb-3 flex items-center justify-between">
                  {statusBadge[course.status]}
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Trophy className="h-3 w-3" />#{course.rank}
                  </span>
                </div>
                <CardTitle className="text-lg">{course.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <Progress value={course.progress} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{course.progress}%</span>
                  <span className="text-muted-foreground">
                    {course.units} unidades
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                {isCompleted ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link
                      href={`/wireframes/courses/${course.id}`}
                      className="focus-visible:outline-none"
                    >
                      Repasar
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <GameButton variant="learning" className="w-full" asChild>
                    <Link
                      href={`/wireframes/courses/${course.id}`}
                      className="focus-visible:outline-none"
                    >
                      Continuar
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </GameButton>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
