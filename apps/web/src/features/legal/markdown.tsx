import { Fragment } from "react";

// Only the syntax used by these bundled documents: no raw HTML or scripts.
export function inlineText(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**"))
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) {
      const value = part.slice(1, -1);
      return value.startsWith("[PENDIENTE:") ? (
        <span className="legal-pending" key={index}>
          {value}
        </span>
      ) : (
        <code key={index}>{value}</code>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function documentBlocks(markdown: string) {
  return markdown
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .filter((block) => !block.startsWith("# "));
}

export function sectionId(index: number) {
  return `seccion-${index}`;
}

export function LegalMarkdown({ markdown }: { markdown: string }) {
  return documentBlocks(markdown).map((block, index) => {
    if (block.startsWith("## "))
      return (
        <h2 key={index} id={sectionId(index)}>
          {inlineText(block.slice(3))}
        </h2>
      );
    if (block.startsWith("|")) {
      const rows = block.split(/\r?\n/).map((row) =>
        row
          .trim()
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim()),
      );
      const [header, , ...body] = rows;
      return (
        <div
          key={index}
          className="legal-table-scroll"
          role="region"
          aria-label={`Tabla: ${header.join(", ")}`}
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                {header.map((cell, cellIndex) => (
                  <th scope="col" key={cellIndex}>
                    {inlineText(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{inlineText(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return <p key={index}>{inlineText(block.replace(/\r?\n/g, " "))}</p>;
  });
}
