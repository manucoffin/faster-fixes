import { useCallback } from "react";

// Writes the element's distance from the top of the document to
// `--document-top`, so a class can cap it at the viewport height left below
// whatever precedes it.
export function useDocumentTopVariable<T extends HTMLElement>() {
  return useCallback((element: T | null) => {
    if (!element) return;
    const node = element;

    function update() {
      const top = node.getBoundingClientRect().top + window.scrollY;
      node.style.setProperty("--document-top", `${top}px`);
    }

    update();
    // A header above can wrap or grow after mount, which moves the element.
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
}
