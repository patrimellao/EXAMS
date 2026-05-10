import Link from "next/link";
import {
  Bell,
  Building2,
  FileText,
  Lightbulb,
  Megaphone,
  Settings,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = "convocatoria" | "temario" | "plataforma" | "tip";

type NewsItem = {
  slug: string;
  category: Category;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime?: string;
  author?: string;
  unread?: boolean;
};

const items: NewsItem[] = [
  {
    slug: "convocatoria-justicia-2026",
    category: "convocatoria",
    title: "Convocadas 1.873 plazas para el Cuerpo de Justicia 2026",
    excerpt:
      "El BOE publica la convocatoria oficial. Plazos de inscripción: del 1 al 30 de mayo. Documentación requerida y temario actualizado disponibles en la sección de cursos.",
    publishedAt: "Hace 2 días",
    readingTime: "4 min lectura",
    unread: true,
  },
  {
    slug: "temario-derecho-civil-unidad-4",
    category: "temario",
    title: "Actualizado el temario de Derecho Civil, Unidad 4",
    excerpt:
      "Hemos revisado las lecciones 4.2 y 4.3 tras el cambio en el Código Civil del 15 de marzo. Tu progreso se mantiene intacto.",
    publishedAt: "Hace 3 días",
    readingTime: "2 min lectura",
    author: "Equipo TuFolio",
    unread: true,
  },
  {
    slug: "palacio-mental-articulos",
    category: "tip",
    title:
      "Cómo memorizar artículos: la técnica del 'palacio mental' aplicada a oposiciones",
    excerpt:
      "Una guía práctica para recordar bloques largos del Código sin saturar la memoria a corto plazo. Incluye ejemplos con artículos del Constitucional y plantilla descargable para construir tu propio palacio.",
    publishedAt: "Hace 5 días",
    readingTime: "12 min lectura",
    author: "Prof. Ana García",
    unread: true,
  },
  {
    slug: "mantenimiento-18-mayo",
    category: "plataforma",
    title: "Mantenimiento programado: 18 de mayo, 02:00 a 04:00",
    excerpt:
      "Durante la ventana, la plataforma estará en modo solo lectura. Tus rachas no se verán afectadas y los tests en curso se guardarán automáticamente.",
    publishedAt: "Hace 6 días",
    readingTime: "1 min lectura",
    author: "Equipo TuFolio",
  },
  {
    slug: "aplazamiento-hacienda-2026",
    category: "convocatoria",
    title: "Aplazada la convocatoria de Hacienda 2026",
    excerpt:
      "El plazo se traslada al tercer trimestre del año. Más detalles en la web del Ministerio. Mantenemos el curso disponible para que sigas avanzando.",
    publishedAt: "12 marzo 2026",
    readingTime: "3 min lectura",
  },
  {
    slug: "errores-constitucional",
    category: "tip",
    title: "5 errores comunes en los tests de Constitucional (y cómo evitarlos)",
    excerpt:
      "Análisis de los 200 tests más fallados de la plataforma. Cuatro patrones que se repiten en preguntas de derechos fundamentales y un atajo para no caer en la trampa de los plazos.",
    publishedAt: "8 marzo 2026",
    readingTime: "8 min lectura",
    author: "Prof. Carlos Ruiz",
  },
  {
    slug: "nuevas-lecciones-constitucional",
    category: "temario",
    title: "Nuevas lecciones de Derecho Constitucional disponibles",
    excerpt:
      "Tres lecciones añadidas a la Unidad 7 sobre el Tribunal Constitucional. Marcadas como opcionales para no romper tu plan de estudio actual.",
    publishedAt: "5 marzo 2026",
    readingTime: "2 min lectura",
    author: "Equipo TuFolio",
  },
];

const categoryMeta: Record<
  Category,
  {
    label: string;
    icon: typeof Megaphone;
    badgeClass: string;
  }
> = {
  convocatoria: {
    label: "Oficial",
    icon: Megaphone,
    badgeClass:
      "bg-brand-primary/10 text-brand-primary border-brand-primary/30",
  },
  temario: {
    label: "Cambio de temario",
    icon: FileText,
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
  plataforma: {
    label: "Plataforma",
    icon: Wrench,
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
  tip: {
    label: "Tip docente",
    icon: Lightbulb,
    badgeClass: "bg-brand-warm/10 text-brand-warm border-brand-warm/30",
  },
};

const unreadCount = items.filter((i) => i.unread).length;

export default function NewsWireframe() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-display md:text-hero">Noticias</h1>
        <p className="text-muted-foreground">
          Convocatorias, cambios en temario y anuncios de la plataforma.
        </p>
      </header>

      {/* Filter tabs + meta */}
      <div className="space-y-3 border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="convocatoria">Oficiales</TabsTrigger>
              <TabsTrigger value="plataforma">Plataforma</TabsTrigger>
              <TabsTrigger value="tip">Tips</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="sm" className="gap-2">
            <Settings className="h-4 w-4" aria-hidden />
            Preferencias
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium tabular-nums">{items.length}</span>{" "}
          noticias ·{" "}
          <span className="font-medium tabular-nums text-foreground">
            {unreadCount}
          </span>{" "}
          sin leer
        </p>
      </div>

      {/* News list */}
      <ul className="space-y-3">
        {items.map((item) => {
          const meta = categoryMeta[item.category];
          const Icon = meta.icon;
          return (
            <li key={item.slug}>
              <Link
                href={`/wireframes/news/${item.slug}`}
                className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary"
              >
                <article className="rounded-card border border-border bg-card p-5 shadow-card transition-shadow duration-normal ease-out group-hover:shadow-card-hover">
                  {/* Top row: badges + date */}
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`gap-1.5 ${meta.badgeClass}`}
                      >
                        <Icon className="h-3 w-3" aria-hidden />
                        {meta.label}
                      </Badge>
                      {item.unread && (
                        <Badge className="bg-brand-primary px-2 py-0.5 text-[10px] uppercase tracking-wide text-white hover:bg-brand-primary">
                          Sin leer
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {item.publishedAt}
                    </span>
                  </div>

                  {/* Headline + unread dot */}
                  <h3 className="flex items-start gap-2 text-lg font-semibold leading-snug text-foreground transition-colors duration-fast group-hover:text-primary">
                    {item.unread && (
                      <span
                        className="mt-2 inline-block h-2 w-2 shrink-0 rounded-pill bg-brand-primary"
                        aria-label="Sin leer"
                      />
                    )}
                    <span>{item.title}</span>
                  </h3>

                  {/* Excerpt */}
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.excerpt}
                  </p>

                  {/* Footer meta */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {item.author && (
                      <>
                        <span className="inline-flex items-center gap-1.5">
                          {item.category === "tip" ? (
                            <Building2 className="h-3 w-3" aria-hidden />
                          ) : (
                            <Bell className="h-3 w-3" aria-hidden />
                          )}
                          {item.author}
                        </span>
                        {item.readingTime && (
                          <span aria-hidden className="text-border">
                            ·
                          </span>
                        )}
                      </>
                    )}
                    {item.readingTime && <span>{item.readingTime}</span>}
                  </div>
                </article>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Pagination */}
      <div className="flex justify-center pt-2">
        <Button variant="outline" size="sm">
          Cargar más
        </Button>
      </div>

      {/* Empty state TODO: ícono BookOpen + "No hay noticias nuevas. Te avisaremos cuando haya convocatorias relacionadas con tus cursos." */}
    </div>
  );
}
