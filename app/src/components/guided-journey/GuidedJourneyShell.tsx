"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  arePaletteColorGroupsCompatible,
  type GarderType,
  type GuidedJourneySnapshot,
  type JourneyCatalogItem,
  type JourneyCategoryOption,
  type JourneyItemSource,
  type JourneyStep,
  type PaletteColorOption,
} from "./guided-journey-data";

interface GuidedJourneyShellProps {
  snapshot: GuidedJourneySnapshot;
}

interface CategoryState {
  count: number;
  custom?: boolean;
  option: JourneyCategoryOption;
  selected: boolean;
}

interface AddedJourneyItem {
  id: string;
  categoryLabel: string;
  colorPoints: PaletteColorOption[];
  imageUrl?: string;
  name: string;
  source: JourneyItemSource;
}

type JourneyTab = "upload" | "links" | "search";

const MAX_TOTAL_COLORS = 15;
const MAX_CHROMATIC_COLORS = 12;
const DECORATIVE_CATEGORY_PATTERN =
  /(party|wedding|costume|sequin|sequins|logo|trend|club|statement|gown|uniform)/i;

export function GuidedJourneyShell({ snapshot }: GuidedJourneyShellProps) {
  const t = useTranslations("journey");
  const router = useRouter();
  const objectUrls = useRef<string[]>([]);
  const [step, setStep] = useState<JourneyStep>(1);
  const [selectedType, setSelectedType] = useState<GarderType | null>(null);
  const [categoryState, setCategoryState] = useState<Record<string, CategoryState>>({});
  const [customCategory, setCustomCategory] = useState("");
  const [customCategoryError, setCustomCategoryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<JourneyTab>("upload");
  const [addedItems, setAddedItems] = useState<AddedJourneyItem[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [paletteNotice, setPaletteNotice] = useState<string | null>(null);
  const [itemNotice, setItemNotice] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    const urls = objectUrls.current;

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.length = 0;
    };
  }, []);

  const categoryValues = useMemo(() => Object.values(categoryState), [categoryState]);
  const selectedCategoryCount = categoryValues.filter((category) => category.selected).length;
  const totalItems = categoryValues.reduce(
    (total, category) => total + (category.selected ? category.count : 0),
    0,
  );
  const selectedColors = selectedColorIds
    .map((id) => snapshot.paletteColors.find((color) => color.id === id))
    .filter((color): color is PaletteColorOption => Boolean(color));
  const selectedChromaticColors = selectedColors.filter((color) => !color.isAchromatic);
  const baseChromaticColor = selectedChromaticColors[0] ?? null;
  const addedItemColors = useMemo(
    () => addedItems.flatMap((item) => item.colorPoints),
    [addedItems],
  );
  const filteredCatalogItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    if (!normalized) {
      return snapshot.catalogItems;
    }

    return snapshot.catalogItems.filter((item) =>
      [item.name, item.brand, item.categoryLabel]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [searchQuery, snapshot.catalogItems]);

  const resetStepThreeState = () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.length = 0;
    setActiveTab("upload");
    setAddedItems([]);
    setLinkInput("");
    setLinkError(null);
    setUploadError(null);
    setSearchQuery("");
    setSelectedColorIds([]);
    setPaletteNotice(null);
    setItemNotice(null);
    setIsCreating(false);
    setCreated(false);
  };

  const selectType = (type: GarderType) => {
    const nextState = Object.fromEntries(
      snapshot.categories[type].map((option) => [
        option.id,
        {
          count: option.defaultCount,
          option,
          selected: false,
        } satisfies CategoryState,
      ]),
    );

    setSelectedType(type);
    setCategoryState(nextState);
    setCustomCategory("");
    setCustomCategoryError(null);
    resetStepThreeState();
    setStep(2);
  };

  const goToStep = (nextStep: JourneyStep) => {
    if (nextStep === 2 && !selectedType) {
      return;
    }

    if (nextStep === 3 && selectedCategoryCount < 8) {
      setCustomCategoryError(t("categories.minWarning", { count: selectedCategoryCount }));
      return;
    }

    setStep(nextStep);
  };

  const toggleCategory = (id: string) => {
    setCategoryState((state) => ({
      ...state,
      [id]: {
        ...state[id],
        selected: !state[id]?.selected,
      },
    }));
    setCustomCategoryError(null);
  };

  const adjustCategoryCount = (id: string, delta: number) => {
    setCategoryState((state) => ({
      ...state,
      [id]: {
        ...state[id],
        count: Math.max(0, state[id].count + delta),
        selected: Math.max(0, state[id].count + delta) > 0,
      },
    }));
  };

  const addCustomCategory = () => {
    const label = customCategory.trim().replace(/\s+/g, " ");

    if (!label) {
      setCustomCategoryError(t("categories.customEmpty"));
      return;
    }

    if (label.length < 3 || DECORATIVE_CATEGORY_PATTERN.test(label)) {
      setCustomCategoryError(t("categories.customRejected"));
      return;
    }

    const id = buildCustomCategoryId(label);

    if (categoryState[id]) {
      setCustomCategoryError(t("categories.customDuplicate"));
      return;
    }

    setCategoryState((state) => ({
      ...state,
      [id]: {
        count: 1,
        custom: true,
        option: {
          id,
          defaultCount: 1,
          label,
          section: "custom",
          sectionLabel: t("categories.customSection"),
        },
        selected: true,
      },
    }));
    setCustomCategory("");
    setCustomCategoryError(null);
  };

  const handleFiles = (files: FileList | null) => {
    setUploadError(null);

    if (!files?.length) {
      return;
    }

    Array.from(files).forEach((file) => {
      if (!snapshot.upload.acceptedMimeTypes.includes(file.type)) {
        setUploadError(t("items.uploadUnsupported"));
        return;
      }

      if (file.size > snapshot.upload.maxBytes) {
        setUploadError(t("items.uploadTooLarge"));
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      objectUrls.current.push(imageUrl);
      addItem({
        id: `photo-${file.name}-${file.lastModified}`,
        name: stripFileExtension(file.name),
        categoryLabel: t("items.photoCategory"),
        colorPoints: [],
        imageUrl,
        source: "photo",
      });
    });
  };

  const addLinks = () => {
    const urls = linkInput
      .split(/\s+/)
      .map((url) => url.trim())
      .filter(Boolean);

    if (!urls.length) {
      setLinkError(t("items.linkRequired"));
      return;
    }

    const existingMarketplaceIds = new Set(
      addedItems
        .filter((item) => item.source === "marketplace")
        .map((item) => item.id),
    );

    for (const url of urls) {
      if (!/^https?:\/\//i.test(url)) {
        setLinkError(t("items.linkInvalid"));
        return;
      }

      if (url.includes("unparseable")) {
        setLinkError(t("items.linkUnparseable"));
        return;
      }

      let host = "";

      try {
        host = new URL(url).host.replace(/^www\./, "");
      } catch {
        setLinkError(t("items.linkInvalid"));
        return;
      }

      const id = `marketplace-${url}`;
      const name = t("items.parsedName", { host });
      const colorPoints = [snapshot.paletteColors.find((color) => color.id === "K9")].filter(
        (color): color is PaletteColorOption => Boolean(color),
      );
      const dominantColor = colorPoints[0] ?? null;

      if (existingMarketplaceIds.has(id)) {
        setLinkError(t("items.linkDuplicate"));
        return;
      }

      if (dominantColor && !isItemColorCompatible(dominantColor)) {
        setLinkError(t("items.incompatible", { color: dominantColor.name }));
        return;
      }

      addItem({
        id,
        name,
        categoryLabel: t("items.marketplaceCategory"),
        colorPoints,
        source: "marketplace",
      });
      existingMarketplaceIds.add(id);
    }

    setLinkInput("");
    setLinkError(null);
    setItemNotice(null);
  };

  const addCatalogItem = (item: JourneyCatalogItem) => {
    const dominantColor = item.colorPoints[0] ?? null;

    if (dominantColor && !isItemColorCompatible(dominantColor)) {
      setItemNotice(t("items.incompatible", { color: dominantColor.name }));
      return;
    }

    addItem({
      id: `catalog-${item.id}`,
      name: item.name,
      categoryLabel: item.categoryLabel,
      colorPoints: item.colorPoints,
      imageUrl: item.imageUrl,
      source: "catalog",
    });
    setItemNotice(null);
  };

  const removeItem = (id: string) => {
    setAddedItems((items) => items.filter((item) => item.id !== id));
  };

  const toggleColor = (color: PaletteColorOption) => {
    if (selectedColorIds.includes(color.id)) {
      setSelectedColorIds((ids) => ids.filter((id) => id !== color.id));
      setPaletteNotice(null);
      return;
    }

    const availability = colorAvailability(color);

    if (!availability.available) {
      setPaletteNotice(availability.reason);
      return;
    }

    setSelectedColorIds((ids) => [...ids, color.id]);
    setPaletteNotice(null);
  };

  const createCapsule = () => {
    setIsCreating(true);
    setCreated(false);

    window.setTimeout(() => {
      setIsCreating(false);
      setCreated(true);
      router.push("/capsule-result");
    }, 700);
  };

  const addItem = (item: AddedJourneyItem) => {
    setAddedItems((items) => {
      if (items.some((existing) => existing.id === item.id)) {
        return items;
      }

      return [...items, item];
    });
  };

  const colorAvailability = (color: PaletteColorOption) => {
    if (selectedColorIds.includes(color.id)) {
      return { available: true, reason: "" };
    }

    if (selectedColors.length >= MAX_TOTAL_COLORS) {
      return { available: false, reason: t("palette.maxTotal") };
    }

    if (!color.isAchromatic && selectedChromaticColors.length >= MAX_CHROMATIC_COLORS) {
      return { available: false, reason: t("palette.maxChromatic") };
    }

    if (!arePaletteColorGroupsCompatible(baseChromaticColor, color)) {
      return { available: false, reason: t("palette.incompatible") };
    }

    const conflictingItemColor = addedItemColors.find(
      (itemColor) => !areColorPairCompatible(itemColor, color),
    );

    if (conflictingItemColor) {
      return {
        available: false,
        reason: t("palette.itemConflict", { color: conflictingItemColor.name }),
      };
    }

    return { available: true, reason: "" };
  };

  const isItemColorCompatible = (color: PaletteColorOption) =>
    !baseChromaticColor || arePaletteColorGroupsCompatible(baseChromaticColor, color);

  const areColorPairCompatible = (
    base: PaletteColorOption,
    target: PaletteColorOption,
  ) => base.isAchromatic || arePaletteColorGroupsCompatible(base, target);

  const categoriesBySection = groupCategoriesBySection(categoryValues);

  return (
    <div className="cz-page journey-page">
      <div className="wallpaper-bg" />
      <div className="wallpaper-overlay" />

      <main className="journey-main">
        <header className="journey-topbar">
          <div className="journey-topbar-copy">
            <Link className="journey-logo" href="/dashboard">
              Capsule Zero
            </Link>
            <h1 dangerouslySetInnerHTML={{ __html: t.raw(`steps.${step}.title`) }} />
            <p>{t("stepCount", { step })}</p>
          </div>

          <div className="journey-topbar-actions">
            <div className="journey-session" aria-label={t("sessionLabel")}>
              <span>{snapshot.profile.initials}</span>
              <strong>{snapshot.profile.displayName}</strong>
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        <Progress step={step} />

        <div className="journey-content">
          {step === 1 ? (
            <section className="journey-step journey-step-visible">
              <div className="journey-type-grid">
                {(["women", "men", "mixed"] as GarderType[]).map((type) => (
                  <button
                    className={cn(
                      "journey-glass journey-type-card",
                      selectedType === type && "journey-type-card-selected",
                    )}
                    key={type}
                    onClick={() => selectType(type)}
                    type="button"
                  >
                    <span className="journey-type-icon">
                      <JourneyIcon name={type} />
                    </span>
                    <span className="journey-type-name">{t(`types.${type}.title`)}</span>
                    <span className="journey-type-desc">{t(`types.${type}.description`)}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="journey-step journey-step-visible">
              <div className="journey-step2-head">
                <div className="journey-size">
                  <strong>{totalItems}</strong>
                  <span>{t("categories.itemsSelected")}</span>
                  <em>{sizeLabel(totalItems, t)}</em>
                </div>
                <p
                  className={cn(
                    "journey-validation",
                    selectedCategoryCount < 8 && "journey-validation-warn",
                  )}
                >
                  {selectedCategoryCount >= 8
                    ? t("categories.selected", { count: selectedCategoryCount })
                    : t("categories.minWarning", { count: selectedCategoryCount })}
                </p>
              </div>

              <div className="journey-glass journey-category-panel">
                {categoriesBySection.map((section) => (
                  <div className="journey-category-group" key={section.label}>
                    <h2>{section.label}</h2>
                    {section.items.map((category) => (
                      <label
                        className={cn(
                          "journey-category-row",
                          category.selected && "journey-category-row-checked",
                        )}
                        key={category.option.id}
                      >
                        <input
                          checked={category.selected}
                          className="journey-category-check"
                          onChange={() => toggleCategory(category.option.id)}
                          type="checkbox"
                        />
                        <span className="journey-category-name">{category.option.label}</span>
                        <span className="journey-qty-stepper">
                          <button
                            aria-label={t("categories.decrease", {
                              category: category.option.label,
                            })}
                            className="journey-qty-button"
                            onClick={(event) => {
                              event.preventDefault();
                              adjustCategoryCount(category.option.id, -1);
                            }}
                            type="button"
                          >
                            -
                          </button>
                          <span>{category.count}</span>
                          <button
                            aria-label={t("categories.increase", {
                              category: category.option.label,
                            })}
                            className="journey-qty-button"
                            onClick={(event) => {
                              event.preventDefault();
                              adjustCategoryCount(category.option.id, 1);
                            }}
                            type="button"
                          >
                            +
                          </button>
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>

              <div className="journey-custom-row">
                <input
                  className="journey-input"
                  onChange={(event) => setCustomCategory(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addCustomCategory();
                    }
                  }}
                  placeholder={t("categories.customPlaceholder")}
                  value={customCategory}
                />
                <button className="journey-ghost-button" onClick={addCustomCategory} type="button">
                  {t("categories.addCustom")}
                </button>
              </div>
              {customCategoryError ? <p className="journey-field-note">{customCategoryError}</p> : null}

              <div className="journey-step-nav">
                <button className="journey-ghost-button" onClick={() => goToStep(1)} type="button">
                  {t("back")}
                </button>
                <button
                  className="journey-primary-button"
                  disabled={selectedCategoryCount < 8}
                  onClick={() => goToStep(3)}
                  type="button"
                >
                  {t("continue")}
                </button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="journey-step journey-step-visible">
              <div className="journey-step3-sections">
                <div className="journey-glass journey-add-section">
                  <SectionTitle title={t("items.title")} />

                  <div className="journey-tab-bar" role="tablist">
                    {(["upload", "links", "search"] as JourneyTab[]).map((tab) => (
                      <button
                        aria-selected={activeTab === tab}
                        className={cn("journey-tab-button", activeTab === tab && "journey-tab-active")}
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        role="tab"
                        type="button"
                      >
                        {t(`items.tabs.${tab}`)}
                      </button>
                    ))}
                  </div>

                  {activeTab === "upload" ? (
                    <div className="journey-tab-panel">
                      <label
                        className="journey-upload-zone"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleFiles(event.dataTransfer.files);
                        }}
                      >
                        <input
                          accept={snapshot.upload.acceptedMimeTypes.join(",")}
                          multiple
                          onChange={(event) => handleFiles(event.target.files)}
                          type="file"
                        />
                        <JourneyIcon name="upload" />
                        <strong>{t("items.uploadTitle")}</strong>
                        <span>{t("items.uploadHint")}</span>
                      </label>
                      <label className="journey-bg-toggle">
                        <input type="checkbox" />
                        <span>{t("items.backgroundRemoval")}</span>
                      </label>
                      {uploadError ? <p className="journey-field-note">{uploadError}</p> : null}
                    </div>
                  ) : null}

                  {activeTab === "links" ? (
                    <div className="journey-tab-panel">
                      <div className="journey-link-row">
                        <textarea
                          className="journey-input journey-textarea"
                          onChange={(event) => setLinkInput(event.target.value)}
                          placeholder={t("items.linkPlaceholder")}
                          value={linkInput}
                        />
                        <button className="journey-ghost-button" onClick={addLinks} type="button">
                          {t("items.addLink")}
                        </button>
                      </div>
                      <p className="journey-muted">{t("items.linkHint")}</p>
                      {linkError ? <p className="journey-field-note">{linkError}</p> : null}
                    </div>
                  ) : null}

                  {activeTab === "search" ? (
                    <div className="journey-tab-panel">
                      <input
                        className="journey-input"
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={t("items.searchPlaceholder")}
                        value={searchQuery}
                      />
                      <div className="journey-search-results">
                        {filteredCatalogItems.map((item) => {
                          const dominantColor = item.colorPoints[0] ?? null;
                          const compatible = dominantColor ? isItemColorCompatible(dominantColor) : true;

                          return (
                            <button
                              className={cn(
                                "journey-search-item",
                                !compatible && "journey-search-item-disabled",
                              )}
                              key={item.id}
                              onClick={() => addCatalogItem(item)}
                              type="button"
                            >
                              <span className="journey-search-thumb">
                                <JourneyIcon name="item" />
                              </span>
                              <span>{item.name}</span>
                              <em>{item.categoryLabel}</em>
                              <ColorDots colors={item.colorPoints} />
                            </button>
                          );
                        })}
                      </div>
                      {itemNotice ? <p className="journey-field-note">{itemNotice}</p> : null}
                    </div>
                  ) : null}

                  {addedItems.length ? (
                    <div className="journey-added-items">
                      <h3>{t("items.added", { count: addedItems.length })}</h3>
                      <div className="journey-added-grid">
                        {addedItems.map((item) => (
                          <div className="journey-added-card" key={item.id}>
                            <div className="journey-added-thumb">
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="" src={item.imageUrl} />
                              ) : (
                                <JourneyIcon name="item" />
                              )}
                            </div>
                            <div>
                              <strong>{item.name}</strong>
                              <span>{item.categoryLabel}</span>
                              <em>{t(`items.sources.${item.source}`)}</em>
                            </div>
                            <ColorDots colors={item.colorPoints} />
                            <button
                              aria-label={t("items.remove", { item: item.name })}
                              onClick={() => removeItem(item.id)}
                              type="button"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="journey-glass journey-color-section">
                  <SectionTitle title={t("palette.title")} />
                  <p className="journey-muted">{t("palette.hint")}</p>
                  <div className="journey-selected-palette" aria-label={t("palette.selected")}>
                    {selectedColors.length ? (
                      selectedColors.map((color) => (
                        <span
                          className="journey-selected-dot"
                          key={color.id}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))
                    ) : (
                      <span>{t("palette.empty")}</span>
                    )}
                  </div>
                  <div className="journey-color-grid">
                      {snapshot.paletteColors.map((color) => {
                        const selected = selectedColorIds.includes(color.id);
                        const availability = colorAvailability(color);
                        const colorBlocked = !availability.available && !selected;

                        return (
                          <button
                            aria-disabled={colorBlocked}
                            aria-pressed={selected}
                            className={cn(
                              "journey-color-item",
                              color.light && "journey-color-item-light",
                              selected && "journey-color-item-selected",
                              colorBlocked && "journey-color-item-disabled",
                            )}
                          key={color.id}
                          onClick={() => toggleColor(color)}
                          title={color.name}
                          type="button"
                        >
                          <span
                            className="journey-color-circle"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {paletteNotice ? (
                    <p className="journey-compatibility-note">{paletteNotice}</p>
                  ) : null}
                </div>
              </div>

              <div className="journey-create-row">
                <button className="journey-ghost-button" onClick={() => goToStep(2)} type="button">
                  {t("back")}
                </button>
                <div className="journey-create-copy">
                  <strong>{t("createSummary", { categories: selectedCategoryCount, items: addedItems.length })}</strong>
                  <span>{created ? t("created") : t("createHint")}</span>
                </div>
                <button
                  className="journey-primary-button"
                  disabled={isCreating}
                  onClick={createCapsule}
                  type="button"
                >
                  {isCreating ? t("creating") : t("createCapsule")}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Progress({ step }: { step: JourneyStep }) {
  const t = useTranslations("journey");

  return (
    <div className="journey-progress-wrap">
      <div className="journey-progress">
        {[1, 2, 3].map((value) => (
          <div className="journey-progress-fragment" key={value}>
            <span
              className={cn(
                "journey-progress-dot",
                value === step && "journey-progress-dot-active",
                value < step && "journey-progress-dot-done",
              )}
            >
              {value < step ? <JourneyIcon name="check" /> : value}
            </span>
            {value < 3 ? (
              <span
                className={cn(
                  "journey-progress-line",
                  value < step && "journey-progress-line-done",
                )}
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="journey-progress-labels">
        {[1, 2, 3].map((value) => (
          <span className={cn(value === step && "journey-progress-label-active")} key={value}>
            {t(`progress.${value}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="journey-section-title">{title}</h2>;
}

function ColorDots({ colors }: { colors: PaletteColorOption[] }) {
  if (!colors.length) {
    return null;
  }

  return (
    <span className="journey-color-dots">
      {colors.slice(0, 3).map((color) => (
        <span
          key={`${color.id}-${color.hex}`}
          style={{ backgroundColor: color.hex }}
          title={color.name}
        />
      ))}
    </span>
  );
}

function groupCategoriesBySection(categories: CategoryState[]) {
  const groups = new Map<string, CategoryState[]>();

  categories.forEach((category) => {
    const label = category.option.sectionLabel;
    groups.set(label, [...(groups.get(label) ?? []), category]);
  });

  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

function sizeLabel(
  totalItems: number,
  t: ReturnType<typeof useTranslations<"journey">>,
) {
  if (totalItems === 0) {
    return t("categories.size.empty");
  }

  if (totalItems <= 15) {
    return t("categories.size.basic");
  }

  if (totalItems <= 25) {
    return t("categories.size.standard");
  }

  if (totalItems <= 35) {
    return t("categories.size.large");
  }

  return t("categories.size.extra");
}

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

function buildCustomCategoryId(label: string) {
  const slug = label
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return `custom-${slug || encodeURIComponent(label)}`;
}

function JourneyIcon({
  name,
}: {
  name: GarderType | "check" | "item" | "upload";
}) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    height: 22,
    viewBox: "0 0 24 24",
    width: 22,
  };

  switch (name) {
    case "women":
      return (
        <svg {...common}>
          <circle cx="12" cy="5.7" r="3.4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 9.6 6.8 21h10.4L12 9.6Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      );
    case "men":
      return (
        <svg {...common}>
          <circle cx="12" cy="5.7" r="3.4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.4 9.6h9.2V21H7.4V9.6Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      );
    case "mixed":
      return (
        <svg {...common}>
          <circle cx="12" cy="5.7" r="3.4" stroke="currentColor" strokeWidth="1.5" />
          <rect height="2.8" stroke="currentColor" strokeWidth="1.5" width="9.2" x="7.4" y="12" />
          <rect height="2.8" stroke="currentColor" strokeWidth="1.5" width="9.2" x="7.4" y="18.2" />
        </svg>
      );
    case "check":
      return (
        <svg aria-hidden fill="none" height="12" viewBox="0 0 14 14" width="12">
          <path d="m2 7 3.4 3.4L12 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="m17 8-5-5-5 5M12 3v12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      );
    case "item":
      return (
        <svg {...common}>
          <path d="M12 4s-4 2.2-4 5.2L4 11.4V20h16v-8.6l-4-2.2C16 6.2 12 4 12 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M8 13h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      );
  }
}
