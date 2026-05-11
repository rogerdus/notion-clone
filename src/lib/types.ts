export interface Page {
  id: string;
  title: string;
  icon: string;
  userId: string;
  parentId: string | null;
  groupId: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface PageGroup {
  id: string;
  name: string;
  icon: string;
  userId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Block {
  id: string;
  type: string;
  content: string;
  properties: string;
  pageId: string;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}
