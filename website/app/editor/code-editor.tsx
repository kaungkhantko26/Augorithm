"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

interface CodeEditorProps {
  value: string;
  title: string;
  fileName: string;
  language: string;
  onChange: (value: string) => void;
  onFormat?: () => void;
  actions?: ReactNode;
}

export function CodeEditor({
  value,
  title,
  fileName,
  language,
  onChange,
  onFormat,
  actions,
}: CodeEditorProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lines = value.split(/\r?\n/);

  return (
    <section className="ide-editor" aria-label={`${title} editor`}>
      <div className="ide-titlebar">
        <div>
          <span className="ide-status-dot" aria-hidden="true" />
          <strong>{title}</strong>
          <small>{fileName}</small>
        </div>
        <div className="ide-actions">
          {onFormat && <button type="button" onClick={onFormat}>Format</button>}
          {actions}
        </div>
      </div>
      <div className="ide-editor-body">
        <div className="ide-gutter" aria-hidden="true">
          <div style={{ transform: `translateY(${-scrollTop}px)` }}>
            {lines.map((_, index) => <span key={index + 1}>{index + 1}</span>)}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            event.preventDefault();
            const target = event.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const next = `${target.value.slice(0, start)}    ${target.value.slice(end)}`;
            onChange(next);
            requestAnimationFrame(() => {
              if (!textareaRef.current) return;
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
            });
          }}
          spellCheck={false}
          aria-label={`${title} code`}
        />
      </div>
      <div className="ide-statusbar">
        <span>{language} · Spaces: 4 · UTF-8</span>
        <span>Ln {lines.length}, Col 1</span>
      </div>
    </section>
  );
}
