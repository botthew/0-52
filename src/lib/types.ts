export type WeeklyPost = {
  id: string;
  handle: string;
  year: number;
  week: number;
  imageUrl?: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
  userProgress?: number;
};

export function getImageSrc(post: WeeklyPost): string | undefined {
  return post.imageUrl;
}
