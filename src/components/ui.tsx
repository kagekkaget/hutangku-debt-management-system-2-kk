"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, X, AlertTriangle, Inbox } from "lucide-react";

/* ------------------------------------------------------------------ tombol */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "quiet" | "danger" | "cream";
  size?: "sm" | "md";
  loading?: boolean;
};

export function Btn({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[3px] font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[1px]";
  const sizes =
    size === "sm" ? "px-3 py-1.5 text-[0.78rem]" : "px-4 py-2.5 text-[0.86rem]";
  const variants: Record<string, string> = {
    primary:
      "bg-daun text-kertas hover:bg-daun-tua shadow-[0_1px_0_rgba(10,46,32,0.35)]",
    cream: "bg-kertas text-daun hover:bg-white border border-garis-2",
    ghost:
      "border border-garis-2 text-tinta bg-transparent hover:bg-kertas-2/70",
    quiet: "text-abu hover:text-tinta hover:bg-kertas-2/70",
    danger: "bg-merah text-white hover:bg-[#9b3527]",
  };
  return (
    <button
      className={`${base} ${sizes} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ form */
export function Label({ children }: { children: ReactNode }) {
  return <span className="smallcaps mb-1.5 block text-abu">{children}</span>;
}

const fieldCls =
  "w-full rounded-[3px] border border-garis-2 bg-kartu px-3 py-2.5 text-[0.9rem] text-tinta placeholder:text-abu-2 focus:border-daun focus:outline-none focus:ring-2 focus:ring-daun/15 transition-colors";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCls} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldCls} ${props.className ?? ""}`} />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`${fieldCls} ${props.className ?? ""}`} />
  );
}

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <Label>{label}</Label>
      {children}
      {hint ? <span className="mt-1 block text-xs text-abu">{hint}</span> : null}
    </label>
  );
}

/* --------------------------------------------------------------- modal/drawer */
function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
}) {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
          <motion.div
            className="fixed inset-0 bg-tinta/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${width} rounded-[4px] border border-garis-2 bg-kartu shadow-[0_24px_60px_-24px_rgba(22,34,28,0.45)]`}
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-garis px-6 py-5">
              <div>
                <h2 className="display text-[1.35rem] leading-tight font-bold">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-0.5 text-sm text-abu">{subtitle}</p>
                ) : null}
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="-mr-1 rounded-full p-1.5 text-abu transition-colors hover:bg-kertas-2 hover:text-tinta"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}) {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-tinta/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className="absolute top-0 right-0 flex h-full w-full max-w-[27rem] flex-col border-l border-garis-2 bg-kertas shadow-[-24px_0_60px_-30px_rgba(22,34,28,0.5)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <header className="flex items-center justify-between border-b border-garis px-6 py-5">
              <h2 className="display text-[1.3rem] font-bold">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="rounded-full p-1.5 text-abu hover:bg-kertas-2 hover:text-tinta"
              >
                <X size={18} />
              </button>
            </header>
            <div className="scroll-slim flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------------------------------------- status/feedback */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    lunas: {
      label: "Lunas",
      cls: "bg-daun-muda text-daun border-daun/25",
    },
    sebagian: {
      label: "Dibayar sebagian",
      cls: "bg-kuning-muda text-[#8a5f11] border-kuning/30",
    },
    belum_lunas: {
      label: "Belum lunas",
      cls: "bg-merah-muda text-merah border-merah/25",
    },
  };
  const item = map[status] ?? map.belum_lunas;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold ${item.cls}`}
    >
      {item.label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-garis-2 bg-kertas-2/60 text-abu">
        {icon ?? <Inbox size={26} strokeWidth={1.6} />}
      </div>
      <h3 className="display text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-abu">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-garis">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-2/5 rounded-sm" />
            <div className="skeleton h-2.5 w-1/4 rounded-sm" />
          </div>
          <div className="skeleton h-3 w-24 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

export function NoticeIcon({ tone }: { tone: "ok" | "bad" }) {
  return tone === "ok" ? (
    <Check size={15} className="text-daun" />
  ) : (
    <AlertTriangle size={15} className="text-merah" />
  );
}

export function useNotice() {
  const [notice, setNotice] = useState<{
    text: string;
    tone: "ok" | "bad";
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((text: string, tone: "ok" | "bad" = "ok") => {
    setNotice({ text, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 4200);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const node = (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-[4px] border border-garis-2 bg-kartu px-4 py-3 text-sm font-medium shadow-[0_18px_40px_-18px_rgba(22,34,28,0.55)]"
        >
          <NoticeIcon tone={notice.tone} />
          {notice.text}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { notify, node, notice };
}

/* ------------------------------------------------------------------ angka */
export function CountUp({
  value,
  duration = 750,
  format = (n: number) => String(Math.round(n)),
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    const initial = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(initial + (value - initial) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduce]);

  if (reduce) return <>{format(value)}</>;
  return <>{format(shown)}</>;
}

/* --------------------------------------------------------------- kartu section */
export function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[4px] border border-garis bg-kartu ${className}`}
    >
      <header className="flex items-center justify-between gap-4 border-b border-garis px-5 py-4">
        <h2 className="smallcaps text-abu">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
