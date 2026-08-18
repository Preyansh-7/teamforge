// Deterministic skill-match algorithm.
// Kept as pure functions (no DOM, no Firestore) so it's easy to unit-test and to explain in a viva.

const WEIGHTS = { skills: 0.8, interests: 0.15, experience: 0.05 };

/**
 * @param {object} student - { skills: [skillId,...], interests: [string,...], experience: string }
 * @param {object} project - { requiredSkills: [skillId,...], category: string, technologies: [string,...] }
 * @param {object} skillsById - map of skillId -> { name } used to render human-readable labels
 * @returns {{ percent: number, breakdown: { skillId, label, matched }[] }}
 */
export function computeMatch(student, project, skillsById = {}) {
  const required = project.requiredSkills || [];
  const owned = new Set(student.skills || []);

  const hits = required.filter(id => owned.has(id));
  const skillScore = required.length ? hits.length / required.length : 0;

  const interestPool = new Set(
    [project.category, ...(project.technologies || [])]
      .filter(Boolean)
      .map(s => s.toLowerCase())
  );
  const interests = (student.interests || []).map(s => s.toLowerCase());
  const interestHits = interests.filter(i => interestPool.has(i));
  const interestScore = interestPool.size ? Math.min(interestHits.length / interestPool.size, 1) : 0;

  // MVP treats experience as compatible by default; this is a placeholder hook for a future,
  // more nuanced fit calculation (e.g. beginner vs. an "advanced" project).
  const experienceScore = 1;

  const total =
    WEIGHTS.skills * skillScore +
    WEIGHTS.interests * interestScore +
    WEIGHTS.experience * experienceScore;

  const breakdown = required.map(id => ({
    skillId: id,
    label: (skillsById[id] && skillsById[id].name) || id,
    matched: owned.has(id)
  }));

  return { percent: Math.round(total * 100), breakdown };
}

// Computes match against only the skills a project is still missing, given current members'
// combined skill set. Used for "complementary teammate" suggestions (Phase 3 concept).
export function computeGapMatch(student, project, currentMembersSkills = [], skillsById = {}) {
  const covered = new Set(currentMembersSkills);
  const gapProject = {
    ...project,
    requiredSkills: (project.requiredSkills || []).filter(id => !covered.has(id))
  };
  return computeMatch(student, gapProject, skillsById);
}
