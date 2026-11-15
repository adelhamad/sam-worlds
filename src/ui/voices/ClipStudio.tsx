// "Your own voice": every unit of a language course (and its letters) with how
// many phrases are recorded, the phrases to record one by one, the "in a row"
// mode, and deleting (one clip, one group, or everything for the language).
import { useMemo, useState } from "react";
import type { LangCourseSeed } from "../../content/langCourse";
import { clipKeysOf, clipMeta, clipStats, deleteClips } from "../../engine/feedback/clips";
import { MAX_CLIP_MS } from "../../engine/feedback/recorder";
import { LANG } from "../../strings/lang";
import { formatBytes, VOICES } from "../../strings/voices";
import { ClipRow } from "./ClipRow";
import { InARow } from "./InARow";
import { studioGroups, type StudioGroup } from "./studioData";
import { problemText, useClipsVersion, type Studio } from "./useStudio";

const S = VOICES.studio;

/** Delete with one confirm step. */
function DeleteButton({ label, question, testId, onDelete }: { label: string; question: string; testId: string; onDelete: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return <button type="button" className="btn btn-compact btn-secondary" onClick={() => setAsking(true)} data-testid={testId}>{label}</button>;
  }
  return (
    <div className="vx-confirm">
      <p>{question}</p>
      <div className="parent-row">
        <button type="button" className="btn btn-compact btn-secondary" onClick={() => setAsking(false)}>{S.cancel}</button>
        <button type="button" className="btn btn-compact btn-danger" onClick={() => { setAsking(false); onDelete(); }} data-testid={`${testId}-yes`}>{S.yesDelete}</button>
      </div>
    </div>
  );
}

function toggleLabel(group: StudioGroup, open: boolean): string {
  if (group.letters) return open ? S.closeLetters : S.openLetters;
  return open ? S.close : S.open;
}

function Group({ group, lang, studio, open, onToggle, onInARow }: {
  group: StudioGroup; lang: string; studio: Studio; open: boolean; onToggle: () => void; onInARow: () => void;
}) {
  const recorded = group.items.filter((item) => clipMeta(item.key)).map((item) => item.key);
  const complete = recorded.length === group.items.length;
  return (
    <div className={`vx-group ${complete ? "is-complete" : ""}`} data-testid={`vx-group-${group.id}`}>
      <div className="vx-group-head">
        <span className="parent-world-name">
          <span>{group.name}</span>
          <small className="parent-world-count">{S.unitCount(recorded.length, group.items.length)}</small>
        </span>
        <div className="parent-row-ctrls">
          <button type="button" className="btn btn-compact btn-secondary" disabled={studio.active !== null} onClick={onInARow} data-testid={`vx-inarow-${group.id}`}>{S.inARow}</button>
          <button type="button" className="btn btn-compact btn-secondary" aria-expanded={open} onClick={onToggle} data-testid={`vx-open-${group.id}`}>{toggleLabel(group, open)}</button>
        </div>
      </div>
      {open && (
        <div className="vx-group-body">
          {group.items.map((item) => <ClipRow key={item.key} item={item} lang={lang} studio={studio} />)}
          {recorded.length > 0 && (
            <DeleteButton label={S.deleteUnit} question={S.confirmUnit(recorded.length)} testId={`vx-delgroup-${group.id}`} onDelete={() => void deleteClips(recorded)} />
          )}
        </div>
      )}
    </div>
  );
}

export function ClipStudio({ seed, studio }: { seed: LangCourseSeed; studio: Studio }) {
  useClipsVersion();
  const groups = useMemo(() => studioGroups(seed), [seed]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const stats = clipStats(seed.lang);
  const language = LANG.name[seed.lang];
  const inARow = groups.find((group) => group.id === rowId);

  return (
    <section className="panel parent-block vx-studio" data-testid={`vx-studio-${seed.lang}`}>
      <h2>{S.heading}</h2>
      <p className="vx-total" data-testid="vx-total">{S.total(stats.count, formatBytes(stats.bytes))}</p>
      <p className="dim">{VOICES.onDevice} {S.cap(MAX_CLIP_MS / 1000)}</p>
      {studio.problem && <p className="vx-problem" role="status" data-testid="vx-problem">{problemText(studio.problem)}</p>}
      {inARow ? (
        <InARow group={inARow} lang={seed.lang} studio={studio} onClose={() => setRowId(null)} />
      ) : (
        <>
          {groups.map((group) => (
            <Group
              key={group.id} group={group} lang={seed.lang} studio={studio} open={openId === group.id}
              onToggle={() => setOpenId(openId === group.id ? null : group.id)}
              onInARow={() => setRowId(group.id)}
            />
          ))}
          {stats.count > 0 && (
            <DeleteButton
              label={S.deleteAll(language)} question={S.confirmAll(stats.count, language)} testId={`vx-delall-${seed.lang}`}
              onDelete={() => void deleteClips(clipKeysOf(seed.lang))}
            />
          )}
        </>
      )}
    </section>
  );
}
