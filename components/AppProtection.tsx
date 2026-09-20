"use client";

import { useEffect } from "react";

export function AppProtection() {
  useEffect(() => {
    const preventDefaultIfNotEditable = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const editable = !!target && target.closest(
        "input, textarea, select, [contenteditable='true'], [contenteditable='']"
      );

      if (editable) return;
      event.preventDefault();
    };

    const preventKeyboardShortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editable = !!target && target.closest(
        "input, textarea, select, [contenteditable='true'], [contenteditable='']"
      );

      if (editable) return;

      const isDevtoolsShortcut =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && (event.key === "I" || event.key === "i" || event.key === "J" || event.key === "j" || event.key === "C" || event.key === "c"));

      if (isDevtoolsShortcut) return;

      const isModifier = event.ctrlKey || event.metaKey;
      const blockKeys = ["c", "C", "x", "X", "v", "V", "a", "A", "p", "P", "s", "S"];

      if (isModifier && blockKeys.includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === "PrintScreen") {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", preventDefaultIfNotEditable, { passive: false });
    document.addEventListener("copy", preventDefaultIfNotEditable, { passive: false });
    document.addEventListener("cut", preventDefaultIfNotEditable, { passive: false });
    document.addEventListener("paste", preventDefaultIfNotEditable, { passive: false });
    document.addEventListener("dragstart", preventDefaultIfNotEditable, { passive: false });
    document.addEventListener("selectstart", preventDefaultIfNotEditable, { passive: false });
    document.addEventListener("keydown", preventKeyboardShortcuts);

    return () => {
      document.removeEventListener("contextmenu", preventDefaultIfNotEditable);
      document.removeEventListener("copy", preventDefaultIfNotEditable);
      document.removeEventListener("cut", preventDefaultIfNotEditable);
      document.removeEventListener("paste", preventDefaultIfNotEditable);
      document.removeEventListener("dragstart", preventDefaultIfNotEditable);
      document.removeEventListener("selectstart", preventDefaultIfNotEditable);
      document.removeEventListener("keydown", preventKeyboardShortcuts);
    };
  }, []);

  return null;
}
