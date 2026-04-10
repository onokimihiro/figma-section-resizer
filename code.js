// code.js — Figma Plugin Backend (TypeScript compiled to JS)
// This runs in the Figma sandbox (no DOM access)

figma.showUI(__html__, {
  width: 300,
  height: 640,
  title: "Section Resizer",
});

let isJa = true;

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

    const sections    = selection.filter((n) => n.type === "SECTION");
    const nonSections = selection.filter((n) => n.type !== "SECTION" && n.type !== "CONNECTOR");

    let resizedCount = 0;
    let wrappedCount = 0;

    // ── Resize existing sections ──
    for (const node of sections) {
      const section  = node;
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

    // ── Wrap non-section nodes in a new Section ──
    if (nonSections.length > 0) {
      // Calculate absolute bounding box of all target nodes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      for (const node of nonSections) {
        const b = node.absoluteBoundingBox;
        if (!b) continue;
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
      }

      // Store absolute positions before reparenting
      const nodePositions = nonSections.map((node) => {
        const b = node.absoluteBoundingBox;
        return { node, absX: b ? b.x : 0, absY: b ? b.y : 0 };
      });

      // Determine parent of the selected nodes to preserve layer structure
      const parent = nonSections[0].parent;
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

      // Insert into the same parent (e.g. Section A) to maintain layer structure
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

      wrappedCount++;
    }

    // ── Notify ──
    const parts = [];
    if (resizedCount > 0)
      parts.push(isJa ? `${resizedCount}個のセクションをリサイズ` : `${resizedCount} section${resizedCount > 1 ? "s" : ""} resized`);
    if (wrappedCount > 0)
      parts.push(isJa ? `${nonSections.length}個のオブジェクトをセクションで囲みました` : `${nonSections.length} object${nonSections.length > 1 ? "s" : ""} wrapped in a section`);

    figma.notify(parts.join(" / "));
  }

  if (msg.type === "close") {
    figma.closePlugin();
  }
};
