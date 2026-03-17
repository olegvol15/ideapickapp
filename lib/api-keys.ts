export const generationKeys = {
  all: (userId?: string) => ['generations', userId] as const,
};

export const savedIdeaKeys = {
  all: (userId?: string) => ['saved-ideas', userId] as const,
};

export const roadmapKeys = {
  all: (userId?: string) => ['roadmaps', userId] as const,
  bySlug: (userId: string, slug: string) => ['roadmaps', userId, slug] as const,
};

export const validationKeys = {
  all: (userId?: string) => ['validations', userId] as const,
};
