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
  url_name: string;
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
  url_name: string;
  type: WikiPageType;
};

export type WikiPageFormData = {
  title: string;
  content: string;
  id: string;
  userId: string;
  url_name: string;
  type: WikiPageType;
};

export type Feature = {
  title: string;
  content: string;
  id: string;
};
