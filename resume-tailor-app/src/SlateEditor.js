import React, { useMemo, useState, useCallback } from "react";
import { Slate, Editable, withReact } from "slate-react";
import { createEditor } from "slate";

const initialValue = [
  {
    type: "paragraph",
    children: [{ text: "Edit your resume here..." }],
  },
];

export default function SlateEditor({ value, onChange }) {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [internalValue, setInternalValue] = useState(value || initialValue);

  const handleChange = (newValue) => {
    setInternalValue(newValue);
    if (onChange) onChange(newValue);
  };

  return (
    <Slate editor={editor} value={internalValue} onChange={handleChange}>
      <Editable
        style={{
          minHeight: 300,
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 16,
          fontFamily: "Calibri, Arial, sans-serif",
          fontSize: 16,
        }}
        placeholder="Edit your resume here..."
      />
    </Slate>
  );
}