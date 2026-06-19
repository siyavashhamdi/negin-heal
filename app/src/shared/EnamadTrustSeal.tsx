import { useLayoutEffect, useRef, type ReactElement } from "react";
import { buildEnamadEmbedHtml } from "./enamad.config";
import styles from "./EnamadTrustSeal.module.scss";

const EnamadTrustSeal = (): ReactElement => {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    root.innerHTML = buildEnamadEmbedHtml();
    root.querySelector("a")?.removeAttribute("rel");
  }, []);

  return <div ref={rootRef} className={styles.root} />;
};

export default EnamadTrustSeal;
