
export type SavedNote = {
  id: string;
  subjectCode: string;
  subjectName: string;
  unitTitle: string;
  topic: string;
  language: "English" | "Hinglish";
  notes: string;
  savedAt: string;
};

const STORAGE_KEY = "studysprint-saved-notes";

export function getSavedNotes(): SavedNote[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveNote(note: SavedNote): boolean {
  try {
    const existing = getSavedNotes();

    const alreadySaved = existing.some(
      (item) => item.id === note.id
    );

    if (alreadySaved) return false;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([note, ...existing])
    );

    return true;
  } catch {
    return false;
  }
}

export function deleteSavedNote(id: string): boolean {
  try {
    const updated = getSavedNotes().filter(
      (note) => note.id !== id
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}
