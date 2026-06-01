// Pure reconciler used by EditListingDetailsPanel to keep the user's manual
// image ordering across re-renders while reflecting Redux-side changes
// (new uploads, removals, id resolution after upload completes).
const idOf = img => img?.id?.uuid || img?.id;

export const reconcileOrderedImages = (prev, next) => {
  const nextMap = new Map(next.map(img => [idOf(img), img]));
  const preserved = prev.filter(img => nextMap.has(idOf(img))).map(img => nextMap.get(idOf(img)));
  const preservedIds = new Set(preserved.map(idOf));
  const added = next.filter(img => !preservedIds.has(idOf(img)));
  return [...preserved, ...added];
};
