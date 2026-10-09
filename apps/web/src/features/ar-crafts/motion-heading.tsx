import { Fragment } from "react";

/** Preserve editorial newlines and semantic text; never split or mutate letters. */
export function HeadingLines({ text }: { text: string }) {
  return text.split("\n").map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      <span className="motion-line">{line}</span>
    </Fragment>
  ));
}
