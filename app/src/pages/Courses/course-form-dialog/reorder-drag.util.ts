import type { DragEvent } from "react";

export function reorderByIdWithInsertion<T extends { id: string }>(
  items: readonly T[],
  draggedId: string,
  targetId: string,
  insertAfter: boolean
): T[] {
  if (draggedId === targetId) {
    return [...items];
  }

  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) {
    return [...items];
  }

  const withoutDragged = items.filter((item) => item.id !== draggedId);
  const adjustedTargetIndex = withoutDragged.findIndex((item) => item.id === targetId);
  if (adjustedTargetIndex < 0) {
    return [...items];
  }

  const insertionIndex = adjustedTargetIndex + (insertAfter ? 1 : 0);
  if (items[insertionIndex]?.id === draggedId) {
    return [...items];
  }

  const dragged = items[draggedIndex];
  if (!dragged) {
    return [...items];
  }

  return [
    ...withoutDragged.slice(0, insertionIndex),
    dragged,
    ...withoutDragged.slice(insertionIndex),
  ];
}

export function shouldInsertAfterHorizontal(
  event: DragEvent<HTMLElement>,
  element: HTMLElement
): boolean {
  const rect = element.getBoundingClientRect();
  const isRtl = getComputedStyle(element).direction === "rtl";
  const midpoint = rect.left + rect.width / 2;

  return isRtl ? event.clientX < midpoint : event.clientX > midpoint;
}

export function shouldInsertAfterVertical(
  event: DragEvent<HTMLElement>,
  element: HTMLElement
): boolean {
  const rect = element.getBoundingClientRect();
  return event.clientY > rect.top + rect.height / 2;
}

export function setDragTransferData(event: DragEvent, id: string): void {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", id);
}
