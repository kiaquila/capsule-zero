import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { JourneyState, GarderType, CapsuleCategory, CapsulePalette } from "@/types";

interface JourneyStore extends JourneyState {
  setGarderType: (type: GarderType) => void;
  setCategories: (categories: CapsuleCategory[]) => void;
  updateCategoryCount: (categoryId: string, count: number) => void;
  toggleCategory: (categoryId: string) => void;
  setPalette: (palette: Partial<CapsulePalette>) => void;
  addImportUrl: (url: string) => void;
  setImportUrls: (urls: string[]) => void;
  addUploadedPhoto: (file: File) => void;
  setStep: (step: 1 | 2 | 3) => void;
  reset: () => void;
}

const initialState: JourneyState = {
  step: 1,
  garderType: undefined,
  selectedCategories: [],
  palette: undefined,
  importedUrls: [],
  uploadedPhotos: [],
};

export const useJourneyStore = create<JourneyStore>()(
  persist(
    (set) => ({
      ...initialState,

      setGarderType: (type) => set({ garderType: type }),

      setCategories: (categories) => set({ selectedCategories: categories }),

      updateCategoryCount: (categoryId, count) =>
        set((state) => ({
          selectedCategories: state.selectedCategories.map((c) =>
            c.categoryId === categoryId ? { ...c, count } : c
          ),
        })),

      toggleCategory: (categoryId) =>
        set((state) => {
          const exists = state.selectedCategories.find(
            (c) => c.categoryId === categoryId
          );
          if (exists) {
            return {
              selectedCategories: state.selectedCategories.filter(
                (c) => c.categoryId !== categoryId
              ),
            };
          }
          return {
            selectedCategories: [
              ...state.selectedCategories,
              { categoryId, count: 1 },
            ],
          };
        }),

      setPalette: (palette) =>
        set((state) => ({
          palette: { ...state.palette, ...palette },
        })),

      addImportUrl: (url) =>
        set((state) => ({
          importedUrls: [...state.importedUrls, url],
        })),

      setImportUrls: (urls) => set({ importedUrls: urls }),

      addUploadedPhoto: (file) =>
        set((state) => ({
          uploadedPhotos: [...state.uploadedPhotos, file],
        })),

      setStep: (step) => set({ step }),

      reset: () => set(initialState),
    }),
    {
      name: "capsule-zero-journey",
      // Не персистим File объекты (не сериализуемы)
      partialize: (state) => ({
        step: state.step,
        garderType: state.garderType,
        selectedCategories: state.selectedCategories,
        palette: state.palette,
        importedUrls: state.importedUrls,
      }),
    }
  )
);
