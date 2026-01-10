export interface Note {
  _id: string;
  title: string;
  content: string;
  description?: string;
  userId: string;
  tags?: string[];
  isPinned?: boolean;
  createdOn?: string;
  updatedOn: string;
  quote?: {
    text: string;
    author: string;
  };
  owner: {
    userId: string;
    fullname: string;
  };
  collaborators?: Array<{
    userId: string;
    email: string;
    fullname: string;
  }>;
  settings?: {
    notifications: {
      joinLeave: boolean;
      collaboratorChanges: boolean;
      liveEdits: boolean;
      cursorMoves: boolean;
    };
    realTime: {
      showCursors: boolean;
      showSelections: boolean;
      showPresence: boolean;
    };
  };
}

