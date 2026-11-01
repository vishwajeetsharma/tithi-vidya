import { FinderForm } from "@/components/find/FinderForm";
import { LockIcon } from "@/components/Icons";

import s from "./home.module.css";

export function TryIt() {
  return (
    <section className={s.tryIt} aria-labelledby="try-title" data-tryit>
      <div className="wrap">
        <div className={s.tryPanel} data-tryit-panel>
          <div className={s.tryCopy}>
            <h2 id="try-title" className={`display ${s.tryTitle}`}>
              Find your moon birthday
            </h2>
            <p>It takes less than a minute. It is free, and you do not need to sign up.</p>
            <p className={s.tryPrivate}>
              <LockIcon />
              Your details stay on your device.
            </p>
          </div>
          <div className={s.tryForm}>
            <FinderForm compact />
          </div>
        </div>
      </div>
    </section>
  );
}
