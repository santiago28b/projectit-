/**
 * Data-access stubs. Implementations will use createAdminClient()
 * (or the SSR client once Auth lands).
 */

export const projectsRepository = {
  async listPublished() {
    throw new Error("projectsRepository.listPublished not implemented");
  },
  async findById(_id: string) {
    void _id;
    throw new Error("projectsRepository.findById not implemented");
  },
};

export const submissionsRepository = {
  async findByProjectAndCandidate(_projectId: string, _candidateId: string) {
    void _projectId;
    void _candidateId;
    throw new Error(
      "submissionsRepository.findByProjectAndCandidate not implemented",
    );
  },
  async insert(_row: unknown) {
    void _row;
    throw new Error("submissionsRepository.insert not implemented");
  },
};

export const evidenceRepository = {
  async listByCandidate(_candidateId: string) {
    void _candidateId;
    throw new Error("evidenceRepository.listByCandidate not implemented");
  },
};

export const candidatesRepository = {
  async findById(_id: string) {
    void _id;
    throw new Error("candidatesRepository.findById not implemented");
  },
};

export const jobsRepository = {
  async findById(_id: string) {
    void _id;
    throw new Error("jobsRepository.findById not implemented");
  },
};
