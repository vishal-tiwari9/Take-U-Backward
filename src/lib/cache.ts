import { prisma } from "./prisma";

// Aggregate readiness score — computed fresh each call.
// Wrapped in try/catch so the dashboard never 500s if a
// DB table hasn't been migrated yet.
export async function getReadinessScore(userId: string) {
  try {
    const [resume, linkedin, projects, interviews] = await Promise.all([
      prisma.resumeAnalysis.findFirst({
        where: { userId }, orderBy: { createdAt: "desc" },
        select: { atsScore: true },
      }),
      prisma.linkedInAnalysis.findFirst({
        where: { userId }, orderBy: { createdAt: "desc" },
        select: { overallScore: true },
      }),
      prisma.projectRewrite.count({ where: { userId } }),
      prisma.mockInterview.count({ where: { userId } }),
    ]);

    // Weighted: resume 35%, linkedin 35%, projects 15%, interviews 15%
    let score = 0, weight = 0;
    if (resume)      { score += resume.atsScore        * 0.35; weight += 0.35; }
    if (linkedin)    { score += linkedin.overallScore  * 0.35; weight += 0.35; }
    if (projects > 0){ score += Math.min(projects * 20, 100) * 0.15; weight += 0.15; }
    if (interviews > 0){ score += Math.min(interviews * 25, 100) * 0.15; weight += 0.15; }

    return {
      overall:        weight > 0 ? Math.round(score / weight) : 0,
      hasResume:      !!resume,
      hasLinkedIn:    !!linkedin,
      projectCount:   projects,
      interviewCount: interviews,
    };
  } catch {
    // Tables may not exist yet — return safe defaults
    return {
      overall: 0, hasResume: false, hasLinkedIn: false,
      projectCount: 0, interviewCount: 0,
    };
  }
}