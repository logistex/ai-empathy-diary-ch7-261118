// 2026-11-18 11:55 KST
import { useId } from "react";
import { CRISIS_NOTICE } from "./crisis-contacts";

export default function CrisisNotice({ soft = false }: { soft?: boolean }) {
  const titleId = useId();
  const text = soft ? CRISIS_NOTICE.soft : CRISIS_NOTICE;
  return (
    <aside
      aria-labelledby={titleId}
      className="mt-4 rounded-2xl border border-care-line bg-care p-4"
    >
      <h3 id={titleId} className="font-semibold">
        {text.title}
      </h3>
      <p className="mt-1">{text.intro}</p>
      <ul className="mt-3 space-y-3">
        {CRISIS_NOTICE.contacts.map((c) => (
          <li key={c.phone}>
            <span className="font-medium">{c.name}</span>{" "}
            <a
              href={`tel:${c.phone}`}
              className="font-bold text-accent underline underline-offset-2"
            >
              {c.phone}
            </a>
            <p className="text-muted">{c.description}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
