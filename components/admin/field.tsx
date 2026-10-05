import { cn } from "@/lib/utils";

export const inputClass =
  "min-h-touch w-full rounded-full border border-line bg-surface px-5 text-base text-ink placeholder:text-muted";

/** Mehrzeiliges Feld: wie inputClass, aber mit Kartenrundung, denn rounded-full schneidet bei mehreren Zeilen den Text ab. */
export const textareaClass =
  "min-h-24 w-full rounded-card-sm border border-line bg-surface px-5 py-3 text-base text-ink placeholder:text-muted";

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
};

/** Beschriftetes Textfeld. */
export function Field({ id, label, hint, className, ...props }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-bold">
        {label}
      </label>
      <input
        id={id}
        name={props.name ?? id}
        aria-describedby={hint ? `${id}-hinweis` : undefined}
        className={cn(inputClass, className)}
        {...props}
      />
      {hint && (
        <p id={`${id}-hinweis`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
