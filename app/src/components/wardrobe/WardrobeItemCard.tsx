"use client";

import type { ReactNode } from "react";
import type { MyItemsEntry } from "@/components/my-items/my-items-data";
import { cn } from "@/lib/utils";

export interface WardrobeItemCardAction {
  icon: ReactNode;
  label?: string;
  onClick: () => void;
  text: string;
}

interface WardrobeItemCardProps {
  actionClassName?: string;
  actionGroupLabel?: string;
  actions?: WardrobeItemCardAction[];
  badges: string[];
  className?: string;
  favoriteActive?: boolean;
  favoriteLabel: string;
  item: MyItemsEntry;
  itemColorsLabel: string;
  mainClassName?: string;
  meta: string;
  onFavorite: () => void;
  onOpen: () => void;
  renderHeartIcon: () => ReactNode;
}

const DEFAULT_COLOR = "#8C8C8C";

export function WardrobeItemCard({
  actionClassName,
  actionGroupLabel,
  actions = [],
  badges,
  className,
  favoriteActive,
  favoriteLabel,
  item,
  itemColorsLabel,
  mainClassName,
  meta,
  onFavorite,
  onOpen,
  renderHeartIcon,
}: WardrobeItemCardProps) {
  const mainColor = item.colorPoints[0]?.hex ?? DEFAULT_COLOR;
  const isFavorite = favoriteActive ?? item.favorite;

  return (
    <article className={cn("my-items-card", className)}>
      <button
        aria-label={favoriteLabel}
        aria-pressed={isFavorite}
        className={cn("my-items-fav", isFavorite && "my-items-fav-active")}
        onClick={onFavorite}
        type="button"
      >
        {renderHeartIcon()}
      </button>
      <button className={cn("my-items-card-main", mainClassName)} onClick={onOpen} type="button">
        <span className="my-items-thumb">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={item.imageUrl} />
          ) : (
            <WardrobeItemFallbackIcon colorHex={mainColor} />
          )}
        </span>
        <span className="my-items-card-body">
          <span className="my-items-card-name">{item.name}</span>
          <span className="my-items-card-row">
            <span>{item.categoryLabel}</span>
            <span className="my-items-card-colors" aria-label={itemColorsLabel}>
              {item.colorPoints.map((color) => (
                <span
                  key={`${item.id}-${color.hex}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </span>
          </span>
          <span className="my-items-card-meta">{meta}</span>
          <span className="my-items-card-badges">
            {badges.map((badge) => (
              <small key={`${item.id}-${badge}`}>{badge}</small>
            ))}
          </span>
        </span>
      </button>
      {actions.length > 0 ? (
        <div className={actionClassName} aria-label={actionGroupLabel}>
          {actions.map((action) => (
            <button
              aria-label={action.label}
              key={`${item.id}-${action.text}`}
              onClick={action.onClick}
              type="button"
            >
              {action.icon}
              <span>{action.text}</span>
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function WardrobeItemFallbackIcon({ colorHex }: { colorHex: string }) {
  const stroke = isColorDark(colorHex) ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.28)";

  return (
    <svg aria-hidden fill="none" height="44" viewBox="0 0 44 44" width="44">
      <path
        d="M22 8s-6.8 4.2-6.8 10.3L7 22.8V36h30V22.8l-8.2-4.5C28.8 12.2 22 8 22 8Z"
        fill={`${colorHex}22`}
        stroke={stroke}
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M15.2 18.3h13.6" stroke={stroke} strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function isColorDark(hex: string): boolean {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}
