import branches from "./botanical-data.json";
export function Botanical({
  index,
  hero = false,
}: {
  index: number;
  hero?: boolean;
}) {
  return (
    <div
      className={`botanical-divider ${hero ? "botanical-hero" : ""}`}
      aria-hidden="true"
    >
      {([320, 390, 768, 1440] as const).map((width) => {
        const branch = branches[width][index];
        return (
          <svg
            key={width}
            data-branch={index}
            data-layout={width}
            className={`branch branch-${width}`}
            width={branch.width}
            height={branch.height}
            viewBox={branch.viewBox}
            style={{
              transform: `translateY(${(branch.offset / branch.height) * 100}%)`,
            }}
            fill="none"
            dangerouslySetInnerHTML={{ __html: branch.markup }}
          />
        );
      })}
    </div>
  );
}
