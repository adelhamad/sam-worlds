import { db, logEvent } from "../engine/save/db";
import { scheduleBackup } from "../engine/save/backup";
import { questionKeys } from "../engine/generators";
import type { Question } from "../engine/generators/types";

/** Remember only questions actually displayed, including abandoned attempts. */
export function recordSeenQuestion(existing: string[], question?: Question): string[] {
  if (!question) return existing;
  const keys = questionKeys(question);
  const fresh = keys.filter((key) => !existing.includes(key));
  if (!fresh.length) return existing;
  const next = [...existing, ...fresh];
  void db.profile.update(1, { seenQuestionKeys: next }).then(scheduleBackup);
  logEvent("question.shown", { id: question.id });
  return next;
}
