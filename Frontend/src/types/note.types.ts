export interface Note {
  _id: string;
  title: string;
  content: string;
  userId: string;
  tags?: string[];
  isPinned?: boolean;
  updatedOn: string;
  owner: {
    userId: string;
    fullname: string;
  };
  collaborators?: Array<{
    userId: string;
    email: string;
    fullname: string;
  }>;
}

