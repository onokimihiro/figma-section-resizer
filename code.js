// code.js — Figma Plugin Backend
// This runs in the Figma sandbox (no DOM access)

figma.showUI(__html__, {
  width: 300,
  height: 440,
  title: "Section Resizer",
});

let isJa = true;

// ── Notify UI of current selection state ──
function notifySelection() {
  const selection = figma.currentPage.selection.filter(n => n.type !== "CONNECTOR");
  const hasSection = selection.some(n => n.type === "SECTION");
  figma.ui.postMessage({ type: "selection-update", hasSection });
}

figma.on("selectionchange", notifySelection);
notifySelection();

figma.ui.onmessage = (msg) => {
  if (msg.type === "set-locale") {
    isJa = msg.isJa;
  }

  if (msg.type === "resize") {
    const { top, right, bottom, left } = msg;
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.notify(
        isJa ? "オブジェクトが選択されていません。" : "Nothing selected.",
        { error: true }
      );
      return;
    }

    const sections = selection.filter((n) => n.type === "SECTION");

    if (sections.length === 0) {
      figma.notify(
        isJa ? "セクションが選択されていません。" : "No sections selected.",
        { error: true }
      );
      return;
    }

    let resizedCount = 0;

    // ── Resize existing sections ──
    for (const section of sections) {
      const children = section.children;

      if (children.length === 0) {
        section.resizeWithoutConstraints(left + right + 100, top + bottom + 100);
      } else {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const child of children) {
          if (child.type === "CONNECTOR") continue;
          minX = Math.min(minX, child.x);
          minY = Math.min(minY, child.y);
          maxX = Math.max(maxX, child.x + child.width);
          maxY = Math.max(maxY, child.y + child.height);
        }

        const offsetX = left - minX;
        const offsetY = top  - minY;
        for (const child of children) {
          child.x += offsetX;
          child.y += offsetY;
        }

        section.resizeWithoutConstraints(
          left + (maxX - minX) + right,
          top  + (maxY - minY) + bottom
        );
      }

      resizedCount++;
    }

    figma.notify(
      isJa
        ? `${resizedCount}個のセクションをリサイズ`
        : `${resizedCount} section${resizedCount > 1 ? "s" : ""} resized`
    );
  }

  if (msg.type === "create-section") {
    const { top, right, bottom, left } = msg;
    const selection = figma.currentPage.selection.filter(n => n.type !== "CONNECTOR");

    if (selection.length === 0) {
      figma.notify(
        isJa ? "オブジェクトが選択されていません。" : "Nothing selected.",
        { error: true }
      );
      return;
    }

    // ── Calculate bounding box of all selected nodes ──
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const node of selection) {
      const b = node.absoluteBoundingBox;
      if (!b) continue;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }

    // Store absolute positions before reparenting
    const nodePositions = selection.map((node) => {
      const b = node.absoluteBoundingBox;
      return { node, absX: b ? b.x : 0, absY: b ? b.y : 0 };
    });

    // Determine parent to preserve layer structure
    const parent = selection[0].parent;
    const parentBounds = (parent && parent.type === "SECTION")
      ? parent.absoluteBoundingBox
      : null;
    const originX = parentBounds ? parentBounds.x : 0;
    const originY = parentBounds ? parentBounds.y : 0;

    // Create the new section
    const newSection = figma.createSection();
    newSection.name = "Section";
    newSection.fills = [{ type: "SOLID", color: { r: 203/255, g: 213/255, b: 225/255 }, opacity: 0.8 }];
    newSection.resizeWithoutConstraints(
      (maxX - minX) + left + right,
      (maxY - minY) + top  + bottom
    );

    // Insert into the same parent to maintain layer structure
    if (parent && parent.type === "SECTION") {
      parent.appendChild(newSection);
    }

    // Set position relative to parent's coordinate space
    newSection.x = (minX - left) - originX;
    newSection.y = (minY - top)  - originY;

    // Reparent nodes and adjust coordinates relative to the new section
    for (const { node, absX, absY } of nodePositions) {
      newSection.appendChild(node);
      node.x = (absX - minX) + left;
      node.y = (absY - minY) + top;
    }

    figma.notify(
      isJa
        ? `${selection.length}個のオブジェクトをセクションで囲みました`
        : `${selection.length} object${selection.length > 1 ? "s" : ""} wrapped in a section`
    );
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
