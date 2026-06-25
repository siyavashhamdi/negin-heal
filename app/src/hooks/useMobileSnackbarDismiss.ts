import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
}

interface MobileSnackbarDismissResult {
  handlePointerDown: ((event: ReactPointerEvent<HTMLDivElement>) => void) | undefined;
  dragStyle: CSSProperties | undefined;
  resetDrag: () => void;
}

export function useMobileSnackbarDismiss(
  enabled: boolean,
  open: boolean,
  onDismiss: () => void
): MobileSnackbarDismissResult {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<DragState>({
    pointerId: -1,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
  });

  const resetDrag = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    dragStateRef.current = {
      pointerId: -1,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
    };
  }, []);

  const dismiss = useCallback(() => {
    onDismiss();
    resetDrag();
  }, [onDismiss, resetDrag]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || !open) {
        return;
      }

      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: 0,
        y: 0,
      };
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [enabled, open]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!enabled || !isDragging) {
        return;
      }

      const dragState = dragStateRef.current;
      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      dragState.x = deltaX;
      dragState.y = deltaY;
      setDragOffset({ x: deltaX, y: deltaY });
    },
    [enabled, isDragging]
  );

  const handlePointerEnd = useCallback(
    (event?: PointerEvent) => {
      if (!enabled) {
        return;
      }

      const dragState = dragStateRef.current;
      if (event && dragState.pointerId !== event.pointerId) {
        return;
      }

      const horizontalDismissed = Math.abs(dragState.x) > 96;
      const verticalDismissed = dragState.y < -72;
      const tapDismissed = Math.abs(dragState.x) < 8 && Math.abs(dragState.y) < 8;

      if (horizontalDismissed || verticalDismissed || tapDismissed) {
        dismiss();
        return;
      }

      resetDrag();
    },
    [dismiss, enabled, resetDrag]
  );

  const dragTransform = useMemo(() => {
    if (!enabled || !isDragging) {
      return undefined;
    }

    const horizontalPriority = Math.abs(dragOffset.x) >= Math.abs(dragOffset.y);
    if (horizontalPriority) {
      return `translate3d(${dragOffset.x}px, 0, 0)`;
    }

    const upwardOnlyY = Math.min(dragOffset.y, 0);
    return `translate3d(0, ${upwardOnlyY}px, 0)`;
  }, [dragOffset.x, dragOffset.y, enabled, isDragging]);

  const dragOpacity = useMemo(() => {
    if (!enabled || !isDragging) {
      return 1;
    }

    const dragDistance = Math.max(Math.abs(dragOffset.x), Math.abs(Math.min(dragOffset.y, 0)));
    return Math.max(0.45, 1 - dragDistance / 180);
  }, [dragOffset.x, dragOffset.y, enabled, isDragging]);

  useEffect(() => {
    if (!enabled || !isDragging) {
      return;
    }

    const onPointerMove = (event: PointerEvent): void => {
      handlePointerMove(event);
    };
    const onPointerEnd = (event: PointerEvent): void => {
      handlePointerEnd(event);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [enabled, handlePointerEnd, handlePointerMove, isDragging]);

  return {
    handlePointerDown: enabled ? handlePointerDown : undefined,
    dragStyle: enabled ? { transform: dragTransform, opacity: dragOpacity } : undefined,
    resetDrag,
  };
}
