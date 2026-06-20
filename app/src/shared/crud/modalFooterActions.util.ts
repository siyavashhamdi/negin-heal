export const MODAL_CLOSE_LABEL = "بستن";

export type ModalSaveBehaviorOptions = {
  readonly onClose: () => void;
  readonly onSaved?: () => void;
  /** When false, the popup stays open after a successful save. Defaults to true. */
  readonly closeOnSave?: boolean;
};

export function createModalSaveSuccessHandler({
  onClose,
  onSaved,
  closeOnSave = true,
}: ModalSaveBehaviorOptions): () => void {
  return () => {
    onSaved?.();
    if (closeOnSave) {
      onClose();
    }
  };
}
