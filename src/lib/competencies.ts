import competencies from "../data/competencies.json";

export type CompetencyRole = {
  level: number;
  title: string;
  competencies: { dimension: string; expectations: string[] }[];
};

export function getCompetencyRole(level = 2) {
  return (competencies.roles as CompetencyRole[]).find((role) => role.level === level);
}

export default competencies;
