import type {
  CreateNoteInput,
  UpdateNoteInput,
} from "@/app/api/notes/validation";

export type Note = {
  id: number;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
};

export type PaginatedNotes = {
  items: Note[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function listNotes(
  db: D1Database,
  pagination: { page: number; pageSize: number }
): Promise<PaginatedNotes> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  const [itemsResult, countResult] = await db.batch<Note | { total: number }>([
    db
      .prepare(
        `SELECT id, title, content, created_at, updated_at
         FROM notes
         ORDER BY id DESC
         LIMIT ?1 OFFSET ?2`
      )
      .bind(pageSize, offset),
    db.prepare("SELECT COUNT(*) AS total FROM notes"),
  ]);
  const count = countResult.results[0] as { total: number } | undefined;
  const total = Number(count?.total ?? 0);

  return {
    items: itemsResult.results as Note[],
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function getNoteById(db: D1Database, id: number): Promise<Note | null> {
  return db
    .prepare(
      `SELECT id, title, content, created_at, updated_at
       FROM notes
       WHERE id = ?1
       LIMIT 1`
    )
    .bind(id)
    .first<Note>();
}

export async function createNote(
  db: D1Database,
  input: CreateNoteInput
): Promise<Note> {
  const note = await db
    .prepare(
      `INSERT INTO notes (title, content)
       VALUES (?1, ?2)
       RETURNING id, title, content, created_at, updated_at`
    )
    .bind(input.title, input.content)
    .first<Note>();

  if (!note) {
    throw new Error("D1 did not return the created note");
  }

  return note;
}

export function updateNote(
  db: D1Database,
  id: number,
  input: UpdateNoteInput
): Promise<Note | null> {
  return db
    .prepare(
      `UPDATE notes
       SET title = COALESCE(?1, title),
           content = COALESCE(?2, content),
           updated_at = unixepoch()
       WHERE id = ?3
       RETURNING id, title, content, created_at, updated_at`
    )
    .bind(input.title ?? null, input.content ?? null, id)
    .first<Note>();
}

export async function deleteNote(db: D1Database, id: number): Promise<boolean> {
  const deleted = await db
    .prepare("DELETE FROM notes WHERE id = ?1 RETURNING id")
    .bind(id)
    .first<{ id: number }>();

  return deleted !== null;
}
