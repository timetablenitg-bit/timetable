import React, { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

// Renders children into document.body, positioned under `anchorRef`.
// Escapes any overflow:hidden/auto ancestors and per-card stacking contexts.
const DropdownPortal = ({
  anchorRef,
  dropdownRef,
  open,
  children,
  className = "",
}) => {
  const [coords, setCoords] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const r = anchorRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
    };

    update();
    // capture=true so we catch scroll on any ancestor (e.g. the table's overflow-x-auto div)
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  if (!open || !coords) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 9999,
      }}
      className={className}
    >
      {children}
    </div>,
    document.body,
  );
};

export default DropdownPortal;
