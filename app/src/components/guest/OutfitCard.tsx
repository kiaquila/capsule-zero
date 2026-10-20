import type { Outfit } from "@/features/guest/outfits";
import { imageOf } from "@/features/guest/catalog";

// Образ собирается из вырезок как редакционная раскладка: верх над низом, обувь внизу, сумка сбоку.
export function OutfitCard({
  outfit,
  label,
}: {
  outfit: Outfit;
  label?: string;
}) {
  return (
    <figure className="guest-outfit" aria-label={label}>
      {outfit.dress ? (
        <img
          className="guest-outfit-dress"
          src={imageOf(outfit.dress.id)}
          alt=""
        />
      ) : (
        <>
          <img
            className="guest-outfit-bottom"
            src={imageOf(outfit.bottom!.id)}
            alt=""
          />
          <img
            className="guest-outfit-top"
            src={imageOf(outfit.top!.id)}
            alt=""
          />
        </>
      )}
      <img
        className="guest-outfit-shoes"
        src={imageOf(outfit.shoes.id)}
        alt=""
      />
      {outfit.bag ? (
        <img className="guest-outfit-bag" src={imageOf(outfit.bag.id)} alt="" />
      ) : null}
    </figure>
  );
}
