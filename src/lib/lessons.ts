import type { Tables } from "@/integrations/supabase/types";
import { todayISO } from "./format";

export type StudentRow = Tables<"students">;
export type LessonRecordRow = Tables<"lesson_records">;

export const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const STUDENT_STATUS: Record<string, { label: string; tone: string }> = {
  ATIVO: { label: "Ativo", tone: "bg-success/10 text-success border-success/30" },
  PAUSADO: { label: "Pausado", tone: "bg-warning/10 text-warning border-warning/30" },
  ENCERRADO: { label: "Encerrado", tone: "bg-muted/50 text-muted-foreground border-border" },
};

export const LESSON_STATUS: Record<string, { label: string; tone: string }> = {
  REALIZADA: { label: "Realizada", tone: "bg-success/10 text-success border-success/30" },
  FALTA: { label: "Falta", tone: "bg-destructive/10 text-destructive border-destructive/30" },
  REPOSICAO: { label: "Reposição", tone: "bg-lesson/10 text-lesson border-lesson/30" },
  CANCELADA: { label: "Cancelada", tone: "bg-muted/50 text-muted-foreground border-border" },
};

/** Data local em YYYY-MM-DD a partir de um Date, sem passar por UTC. */
function isoOf(d: Date) {
  return d.toLocaleDateString("en-CA");
}

/** Constrói um Date local a partir de YYYY-MM-DD, sem o deslocamento que
 *  `new Date("2026-08-17")` sofre por ser interpretado como UTC. */
export function parseISODate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export type LessonOccurrence = {
  student: StudentRow;
  date: string;
  start_time: string | null;
  record: LessonRecordRow | undefined;
};

/**
 * Ocorrências de aula entre duas datas, calculadas a partir do horário fixo
 * do aluno — nada é lido nem gravado por ocorrência.
 *
 * O registro em `lesson_records` só existe quando a aula desviou do
 * combinado (falta, reposição, cancelamento). Por isso ele entra aqui como
 * enriquecimento opcional: sem registro, a aula é prevista e normal.
 *
 * Alunos PAUSADO e ENCERRADO não geram ocorrência: quem trancou não deve
 * continuar aparecendo na agenda.
 */
export function lessonOccurrences(
  students: StudentRow[],
  records: LessonRecordRow[],
  fromISO: string,
  toISO: string,
): LessonOccurrence[] {
  const active = students.filter((s) => s.status === "ATIVO" && s.weekday !== null);
  if (active.length === 0) return [];

  const byStudentDate = new Map(records.map((r) => [`${r.student_id}|${r.lesson_date}`, r]));
  const out: LessonOccurrence[] = [];
  const end = parseISODate(toISO);

  for (const cursor = parseISODate(fromISO); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const iso = isoOf(cursor);
    const weekday = cursor.getDay();
    for (const student of active) {
      if (student.weekday !== weekday) continue;
      // Aula não existe antes do aluno começar.
      if (student.started_at && iso < student.started_at.slice(0, 10)) continue;
      out.push({
        student,
        date: iso,
        start_time: student.start_time,
        record: byStudentDate.get(`${student.id}|${iso}`),
      });
    }
  }

  return out.sort((a, b) =>
    a.date === b.date
      ? (a.start_time ?? "").localeCompare(b.start_time ?? "")
      : a.date.localeCompare(b.date),
  );
}

/** Aulas de hoje, na ordem do relógio. */
export function todayLessons(students: StudentRow[], records: LessonRecordRow[]) {
  const today = todayISO();
  return lessonOccurrences(students, records, today, today);
}

/** Primeiro dia do mês em YYYY-MM-DD — a chave de `reference_month`. */
export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(referenceMonth: string) {
  const d = parseISODate(referenceMonth);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/**
 * Vencimento da mensalidade no mês de referência.
 *
 * `due_day` 31 em fevereiro não existe: em vez de estourar para março (o que
 * `new Date(y, m, 31)` faria em silêncio), a data é presa ao último dia do
 * próprio mês.
 */
export function dueDateFor(referenceMonth: string, dueDay: number) {
  const base = parseISODate(referenceMonth);
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const day = Math.min(Math.max(dueDay || 1, 1), lastDay);
  return isoOf(new Date(base.getFullYear(), base.getMonth(), day));
}

export type PendingMonthly = {
  student: StudentRow;
  due_date: string;
  amount: number;
};

/**
 * Quais mensalidades faltam gerar no mês — só alunos ATIVO, e só quem ainda
 * não tem cobrança daquele mês.
 *
 * A checagem aqui é de conveniência (para o botão saber se há algo a fazer e
 * quanto). Quem realmente garante que nada duplica é o índice único
 * `charges_student_month_key` no banco, que resiste a dois cliques
 * simultâneos e a duas abas abertas.
 */
export function pendingMonthlies(
  students: StudentRow[],
  charges: Tables<"charges">[],
  referenceMonth: string,
): PendingMonthly[] {
  const already = new Set(
    charges
      .filter((c) => c.student_id && c.reference_month === referenceMonth)
      .map((c) => c.student_id),
  );

  return students
    .filter((s) => s.status === "ATIVO" && !already.has(s.id) && Number(s.monthly_fee) > 0)
    .map((student) => ({
      student,
      due_date: dueDateFor(referenceMonth, student.due_day),
      amount: Number(student.monthly_fee),
    }));
}
