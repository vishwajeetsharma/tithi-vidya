import s from "./home.module.css";

const TEXT =
  "In the Hindu calendar, your birthday is not a date. It is a moon day, called a *tithi*. Your tithi comes back every year, but on a new date. This site finds those dates for you.";

export function Statement() {
  return (
    <section className={s.statement} aria-labelledby="statement-title" data-statement>
      <div className={s.statementStick}>
        <div className="wrap">
          <h2 id="statement-title" className="eyebrow">
            What is this site?
          </h2>
          <p className={`display ${s.statementText}`}>
            {TEXT.split(" ").map((word, i) => {
              const accent = word.startsWith("*");
              const plain = word.replaceAll("*", "");
              return (
                <span key={i}>
                  <span data-word className={accent ? `gradientText ${s.statementAccent}` : undefined}>
                    {plain}
                  </span>{" "}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
