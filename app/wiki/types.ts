export enum WikiPageType {
  REGION = "region",
  WIKI = "wiki",
  FEATURE = "feature",
  RULE = "rule",
  HISTORY = "history",
}

export type WikiPage = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  last_modified_by: string;
  type: WikiPageType;
};

export type WikiPageDTO = {
  title: string;
  content: string;
  created_by?: string;
  last_modified_by?: string;
  type: WikiPageType;
};
