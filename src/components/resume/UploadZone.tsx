"use client";

import { useState, useRef, DragEvent } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onAnalyze: (file: File, jobDescription: string) => void;
  loading: boolean;
}

export function UploadZone({ onAnalyze, loading }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") setFile(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected?.type === "application/pdf") setFile(selected);
  }

  function handleSubmit() {
    if (file) onAnalyze(file, jobDescription);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Drop zone */}
      <div
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--teal)" : file ? "rgba(45,212,191,0.4)" : "var(--border)"}`,
          borderRadius: "1rem",
          padding: "3rem 2rem",
          textAlign: "center",
          cursor: file ? "default" : "pointer",
          backgroundColor: dragging
            ? "var(--teal-glow)"
            : file
            ? "rgba(45,212,191,0.05)"
            : "var(--bg-secondary)",
          transition: "all 0.2s ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {file ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.875rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileText size={22} color="#fff" />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{file.name}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              style={{
                marginLeft: "0.5rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <Upload size={24} color="var(--teal)" />
            </div>
            <p style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.375rem" }}>
              Drop your resume here
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              or click to browse — PDF only, max 5MB
            </p>
          </>
        )}
      </div>

      {/* Optional job description */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
            marginBottom: "0.5rem",
          }}
        >
          Job Description{" "}
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional — improves accuracy)</span>
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to get keyword-matched feedback..."
          rows={4}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "0.625rem",
            color: "var(--text-primary)",
            fontSize: "0.9rem",
            resize: "vertical",
            outline: "none",
            fontFamily: "DM Sans, sans-serif",
            lineHeight: 1.6,
          }}
        />
      </div>

      {/* Analyze button */}
      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        style={{
          padding: "0.875rem",
          borderRadius: "0.75rem",
          border: "none",
          fontSize: "0.9375rem",
          fontWeight: 600,
          fontFamily: "Sora, sans-serif",
          cursor: !file || loading ? "not-allowed" : "pointer",
          opacity: !file || loading ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
          color: "#0d1117",
          transition: "all 0.2s",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            Analyzing with AI...
          </>
        ) : (
          "Analyze Resume"
        )}
      </button>
    </div>
  );
}