import artwork from "./butterfly-data.json";

export function ButterflyArtwork() {
  return (
    <div className="craft-art butterfly-art">
      <svg
        className="butterfly-svg"
        width="720"
        height="680"
        viewBox="0 0 720 680"
        fill="none"
        role="img"
        aria-label="Mariposa joya con facetas y engastes · ilustración conceptual, no logo oficial"
        dangerouslySetInnerHTML={{ __html: artwork.markup }}
      />
    </div>
  );
}
