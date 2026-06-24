import { JsonContentSource } from "./content-source.js";
import { KnowledgeGraph } from "./graph.js";
import { flattenObjectives, hasLessonMapping, hasObjectiveMapping, unique } from "./resolver.js";
import { searchObjects } from "./search.js";

export class KnowledgeEngine {
  constructor({ contentSource = new JsonContentSource() } = {}) {
    this.source = contentSource;
    this.certifications = new Map();
    this.objectives = new Map();
    this.lessons = new Map();
    this.objects = new Map();
    this.graphStore = new KnowledgeGraph();
  }

  async loadCertification(certId) {
    const certification = await this.source.json(`content/certifications/${certId}.json`);
    this.certifications.set(certification.id, certification);

    if (certification.objectiveManifest) {
      const objectiveManifest = await this.source.json(certification.objectiveManifest);
      for (const objective of flattenObjectives(objectiveManifest.objectives || [])) {
        this.objectives.set(objective.id, { ...objective, certification: certification.id });
      }
    }

    if (certification.lessonManifest) {
      const lessonManifest = await this.source.json(certification.lessonManifest);
      for (const lesson of lessonManifest.lessons || []) {
        const id = lesson.id || `${certification.id}.lesson-${String(lesson.lessonId || lesson.order).padStart(2, "0")}`;
        this.lessons.set(id, { ...lesson, id, certification: certification.id });
      }
    }

    if (certification.knowledgeIndex) {
      await this.loadKnowledgeIndex(certification.knowledgeIndex);
    }

    if (certification.relationshipGraph) {
      const relationshipGraph = await this.source.json(certification.relationshipGraph);
      this.graphStore.setRelationships(relationshipGraph.relationships || []);
    }

    this.graphStore.setObjects(this.all());
    return certification;
  }

  async loadKnowledgeIndex(path = "content/indexes/knowledge-index.json") {
    const index = await this.source.json(path);
    const objects = await Promise.all((index.objects || []).map(objectPath => this.source.json(objectPath)));
    for (const object of objects) this.objects.set(object.id, object);
    this.graphStore.setObjects(this.all());
    return objects;
  }

  get(id) {
    return this.objects.get(id) || null;
  }

  all(filters = {}) {
    let objects = [...this.objects.values()];
    if (filters.certification) {
      objects = objects.filter(object => (object.certificationMappings || []).some(mapping => mapping.certification === filters.certification));
    }
    if (filters.domain) objects = objects.filter(object => (object.domains || []).includes(filters.domain));
    if (filters.type) objects = objects.filter(object => object.type === filters.type);
    if (filters.status) objects = objects.filter(object => object.status === filters.status);
    return objects;
  }

  search(query, options = {}) {
    return searchObjects(this.all(), query, options);
  }

  related(id, filters = {}) {
    return this.graphStore.related(id, filters);
  }

  parents(id) {
    return this.related(id).filter(edge => edge.type === "belongs_to" || edge.type === "parent_of" || edge.directionFromSource === "inbound");
  }

  children(id) {
    return this.related(id).filter(edge => edge.type === "child_of" || edge.type === "contains" || edge.directionFromSource === "outbound");
  }

  objective(objectiveId) {
    const objective = this.objectives.get(objectiveId) || null;
    const explicitIds = objective?.knowledgeIds || [];
    const explicit = explicitIds.map(id => this.get(id)).filter(Boolean);
    const mapped = this.all().filter(object => hasObjectiveMapping(object, objectiveId));
    return { objective, knowledge: unique([...explicit, ...mapped].map(object => object.id)).map(id => this.get(id)).filter(Boolean) };
  }

  lesson(lessonId) {
    const lesson = this.lessons.get(lessonId) || [...this.lessons.values()].find(item => String(item.lessonId || item.order) === String(lessonId)) || null;
    const key = lesson?.lessonId || lessonId;
    return { lesson, knowledge: this.all().filter(object => hasLessonMapping(object, key)) };
  }

  certification(certId) {
    return {
      certification: this.certifications.get(certId) || null,
      objectives: [...this.objectives.values()].filter(objective => objective.certification === certId),
      lessons: [...this.lessons.values()].filter(lesson => lesson.certification === certId),
      knowledge: this.all({ certification: certId })
    };
  }

  random({ certification, domain, type, difficulty } = {}) {
    let pool = this.all({ certification, domain, type });
    if (difficulty) pool = pool.filter(object => object.difficulty === difficulty);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  commands(filters = {}) {
    return this.all(filters).flatMap(object =>
      (object.learning?.commands || []).map(command => ({ ...command, knowledgeId: object.id, title: object.title }))
    );
  }

  scenarios(filters = {}) {
    return this.all(filters).flatMap(object =>
      (object.assessmentSeeds?.scenarios || []).map(scenario => ({ ...scenario, knowledgeId: object.id, title: object.title }))
    );
  }

  examTips(filters = {}) {
    return this.all(filters).flatMap(object =>
      (object.assessmentSeeds?.examTips || []).map(tip => ({ ...tip, knowledgeId: object.id, title: object.title }))
    );
  }

  pbqIdeas(filters = {}) {
    return this.all(filters).flatMap(object =>
      (object.assessmentSeeds?.pbqIdeas || []).map(pbq => ({ ...pbq, knowledgeId: object.id, title: object.title }))
    );
  }

  statistics() {
    const objects = this.all();
    return {
      certifications: this.certifications.size,
      objectives: this.objectives.size,
      lessons: this.lessons.size,
      knowledgeObjects: objects.length,
      relationships: this.graphStore.all().length,
      commands: this.commands().length,
      scenarios: this.scenarios().length,
      pbqIdeas: this.pbqIdeas().length,
      domains: unique(objects.flatMap(object => object.domains || [])).sort(),
      missingRelationshipTargets: this.graphStore.missingTargets()
    };
  }

  graph() {
    return {
      nodes: this.all().map(object => ({
        id: object.id,
        title: object.title,
        type: object.type,
        status: object.status,
        domains: object.domains || []
      })),
      edges: this.graphStore.all()
    };
  }
}
