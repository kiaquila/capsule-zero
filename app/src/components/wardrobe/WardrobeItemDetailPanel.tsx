"use client";

import type { ChangeEvent, ReactNode, RefObject } from "react";
import { WardrobeItemFallbackIcon } from "./WardrobeItemCard";

export interface WardrobeItemDetailDraft {
  brand: string;
  categoryId: string;
  colorHexes: string[];
  imageUrl?: string;
  material: string;
  name: string;
  price: string;
}

export type WardrobeItemDetailErrors = Partial<
  Record<"name" | "categoryId" | "colorHexes" | "photo", string>
>;

export interface WardrobeItemDetailLabels {
  addColor: string;
  brand: string;
  category: string;
  changePhoto: string;
  close: string;
  color: (count: number) => string;
  colors: string;
  dialogLabel: string;
  material: string;
  name: string;
  photoFallback: string;
  price: string;
  removeColor: string;
  save: string;
  title: string;
}

interface WardrobeItemDetailPanelProps<TDraft extends WardrobeItemDetailDraft> {
  actionSlot?: ReactNode;
  categoryOptions: Array<{ id: string; label: string }>;
  deleteAction?: {
    className?: string;
    label: string;
    onClick: () => void;
  };
  draft: TDraft;
  errors: WardrobeItemDetailErrors;
  extraFields?: ReactNode;
  labels: WardrobeItemDetailLabels;
  onAddColor: () => void;
  onChange: (input: Partial<TDraft>) => void;
  onClose: () => void;
  onColorChange: (index: number, value: string) => void;
  onPhotoUpload?: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveColor: (index: number) => void;
  onSave: () => void;
  photoInputRef?: RefObject<HTMLInputElement | null>;
  renderIcon: (name: "check" | "close" | "plus" | "trash") => ReactNode;
}

const DEFAULT_COLOR = "#8C8C8C";

export function WardrobeItemDetailPanel<TDraft extends WardrobeItemDetailDraft>({
  actionSlot,
  categoryOptions,
  deleteAction,
  draft,
  errors,
  extraFields,
  labels,
  onAddColor,
  onChange,
  onClose,
  onColorChange,
  onPhotoUpload,
  onRemoveColor,
  onSave,
  photoInputRef,
  renderIcon,
}: WardrobeItemDetailPanelProps<TDraft>) {
  return (
    <div className="my-items-detail-wrap" role="dialog" aria-modal="true" aria-label={labels.dialogLabel}>
      <button
        aria-label={labels.close}
        className="my-items-detail-backdrop"
        onClick={onClose}
        type="button"
      />
      <aside className="my-items-detail-panel">
        <header className="my-items-detail-head">
          <h2>{labels.title}</h2>
          <button aria-label={labels.close} className="my-items-icon-button" onClick={onClose} type="button">
            {renderIcon("close")}
          </button>
        </header>

        <div className="my-items-detail-body">
          <div className="my-items-detail-photo">
            {draft.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={draft.imageUrl} />
            ) : (
              <>
                <WardrobeItemFallbackIcon colorHex={draft.colorHexes[0] ?? DEFAULT_COLOR} />
                <span>{labels.photoFallback}</span>
              </>
            )}
            <button onClick={() => photoInputRef?.current?.click()} type="button">
              {labels.changePhoto}
            </button>
            {onPhotoUpload ? (
              <input
                accept="image/jpeg,image/png,image/webp"
                className="my-items-photo-input"
                onChange={onPhotoUpload}
                ref={photoInputRef}
                type="file"
              />
            ) : null}
            {errors.photo ? <small className="my-items-photo-error">{errors.photo}</small> : null}
          </div>

          <label className="my-items-field">
            <span>{labels.name}</span>
            <input
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => onChange({ name: event.target.value } as Partial<TDraft>)}
              value={draft.name}
            />
            {errors.name ? <small>{errors.name}</small> : null}
          </label>

          <label className="my-items-field">
            <span>{labels.category}</span>
            <select
              aria-invalid={Boolean(errors.categoryId)}
              onChange={(event) => onChange({ categoryId: event.target.value } as Partial<TDraft>)}
              value={draft.categoryId}
            >
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.categoryId ? <small>{errors.categoryId}</small> : null}
          </label>

          <div className="my-items-field">
            <span>{labels.colors}</span>
            <div className="my-items-edit-colors">
              {draft.colorHexes.map((hex, index) => (
                <div className="my-items-edit-color" key={`${hex}-${index}`}>
                  <span className="my-items-edit-color-swatch" style={{ backgroundColor: hex }} />
                  <input
                    aria-label={labels.color(index + 1)}
                    onChange={(event) => onColorChange(index, event.target.value)}
                    type="color"
                    value={hex}
                  />
                  {draft.colorHexes.length > 1 ? (
                    <button aria-label={labels.removeColor} onClick={() => onRemoveColor(index)} type="button">
                      {renderIcon("close")}
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                aria-label={labels.addColor}
                className="my-items-add-color"
                disabled={draft.colorHexes.length >= 3}
                onClick={onAddColor}
                type="button"
              >
                {renderIcon("plus")}
              </button>
            </div>
            {errors.colorHexes ? <small>{errors.colorHexes}</small> : null}
          </div>

          <label className="my-items-field">
            <span>{labels.brand}</span>
            <input onChange={(event) => onChange({ brand: event.target.value } as Partial<TDraft>)} value={draft.brand} />
          </label>

          <label className="my-items-field">
            <span>{labels.material}</span>
            <input onChange={(event) => onChange({ material: event.target.value } as Partial<TDraft>)} value={draft.material} />
          </label>

          <label className="my-items-field">
            <span>{labels.price}</span>
            <input
              inputMode="decimal"
              onChange={(event) => onChange({ price: event.target.value } as Partial<TDraft>)}
              placeholder="0"
              value={draft.price}
            />
          </label>

          {extraFields}
        </div>

        <footer className="my-items-detail-actions">
          <button className="my-items-save-button" onClick={onSave} type="button">
            {renderIcon("check")}
            <span>{labels.save}</span>
          </button>
          {actionSlot}
          {deleteAction ? (
            <button
              className={deleteAction.className ?? "my-items-secondary-button"}
              onClick={deleteAction.onClick}
              type="button"
            >
              {renderIcon("trash")}
              <span>{deleteAction.label}</span>
            </button>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}

export function WardrobeDetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="uncapsulated-detail-field">
      <p>{label}</p>
      <span>{value}</span>
    </div>
  );
}
