import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, File as FileIcon } from "lucide-react";
import clsx from "clsx";

interface ResumeUploaderProps {
  mode: "paste" | "upload";
  onModeChange: (m: "paste" | "upload") => void;
  text: string;
  onTextChange: (t: string) => void;
  file: File | null;
  onFileChange: (f: File | null) => void;
}

export function ResumeUploader({
  mode,
  onModeChange,
  text,
  onTextChange,
  file,
  onFileChange,
}: ResumeUploaderProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFileChange(accepted[0]);
    },
    [onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        {(["paste", "upload"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
              mode === m
                ? "bg-[var(--bg-accent)] text-[var(--bg-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            )}
          >
            {m === "paste" ? <FileText size={14} /> : <Upload size={14} />}
            {m === "paste" ? "Paste Text" : "Upload PDF"}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste your resume text here (minimum 50 characters)..."
          className="w-full h-36 sm:h-48 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:border-[var(--border-strong)] transition-colors placeholder:text-[var(--text-muted)]"
        />
      ) : file ? (
        <div className="flex items-center gap-3 px-4 py-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-md)]">
          <FileIcon size={20} className="text-[var(--text-secondary)] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {file.name}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={clsx(
            "flex items-center justify-center h-36 sm:h-48 border-2 border-dashed rounded-[var(--radius-md)] cursor-pointer transition-colors",
            isDragActive
              ? "border-[var(--border-strong)] bg-[var(--bg-secondary)]"
              : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)]"
          )}
        >
          <input {...getInputProps()} />
          <div className="text-center text-[var(--text-muted)]">
            <Upload size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {isDragActive
                ? "Drop your PDF here"
                : "Drag & drop your PDF, or click to browse"}
            </p>
            <p className="text-xs mt-1 opacity-60">PDF only · max 5 MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
