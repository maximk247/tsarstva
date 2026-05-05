"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  FORMSPREE_ID,
  type ReportStatus,
  type ReportType,
} from "../constants/report";
import { buildReportPayload } from "../utils/reportPayload";

interface Params {
  type: ReportType;
  reference: string;
  parallelRef?: string;
  parallelText?: string;
}

export function useReportForm({
  type,
  reference,
  parallelRef,
  parallelText,
}: Params) {
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<ReportStatus>("idle");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setStatus("idle");
    setProblem("");
    setSelected([]);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const openDialog = useCallback(() => setOpen(true), []);

  const toggleCategory = useCallback((cat: string) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setStatus("sending");
      try {
        const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(
            buildReportPayload({
              type,
              reference,
              parallelRef,
              parallelText,
              selected,
              problem,
            }),
          ),
        });
        if (res.ok) {
          setStatus("sent");
          closeTimerRef.current = setTimeout(handleClose, 2000);
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    },
    [
      type,
      reference,
      parallelRef,
      parallelText,
      selected,
      problem,
      handleClose,
    ],
  );

  const dialog = useMemo(
    () => ({
      isOpen: open,
      open: openDialog,
      close: handleClose,
    }),
    [handleClose, open, openDialog],
  );
  const form = useMemo(
    () => ({
      problem,
      selected,
      status,
      setProblem,
      toggleCategory,
      submit: handleSubmit,
    }),
    [handleSubmit, problem, selected, status, toggleCategory],
  );

  return {
    dialog,
    form,
  };
}
