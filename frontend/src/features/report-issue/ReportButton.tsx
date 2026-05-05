"use client";

import ReportDialog from "./components/ReportDialog";
import ReportTrigger from "./components/ReportTrigger";
import { FORMSPREE_ID, type ReportType } from "./constants/report";
import { useReportForm } from "./hooks/useReportForm";

interface Props {
  type: ReportType;
  reference: string;
  parallelRef?: string;
  parallelText?: string;
  className?: string;
}

export default function ReportButton({
  type,
  reference,
  parallelRef,
  parallelText,
  className,
}: Props) {
  const form = useReportForm({
    type,
    reference,
    parallelRef,
    parallelText,
  });

  if (!FORMSPREE_ID) return null;

  const label = type === "verse" ? "стихе" : "параллели";

  return (
    <>
      <ReportTrigger
        label={label}
        className={className}
        onOpen={form.dialog.open}
      />

      {form.dialog.isOpen && (
        <ReportDialog
          type={type}
          reference={reference}
          parallelRef={parallelRef}
          reportForm={form.form}
          onClose={form.dialog.close}
        />
      )}
    </>
  );
}
