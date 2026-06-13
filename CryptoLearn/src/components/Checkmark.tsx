// Green checkmark shown next to completed sections / lessons / questions.
// Renders an empty circle when not yet complete.
export function Checkmark({ complete }: { complete: boolean }) {
  return (
    <span className={complete ? 'check check--done' : 'check'} aria-hidden>
      {complete ? '✓' : '○'}
    </span>
  );
}
