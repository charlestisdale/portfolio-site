const STORAGE_KEY = "it-learning-platform:mastery:v1";

export function loadMastery() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

export function saveMastery(mastery) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mastery));
}

export function setConceptMastery(conceptId, section, value) {
  const mastery = loadMastery();
  mastery[conceptId] ||= {};
  mastery[conceptId][section] = value;
  saveMastery(mastery);
  return mastery[conceptId];
}
