/**
 * Find the section that should treat its images as above-the-fold candidates.
 * Currently: the first section on the page.
 *
 * @param {Array<{ sectionId: string, sectionType: string }>} sections
 * @returns {string|null} sectionId of the priority section, or null
 */
export const getPrioritySectionId = sections => {
  return sections?.[0]?.sectionId || null;
};
