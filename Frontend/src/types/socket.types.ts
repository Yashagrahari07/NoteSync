export interface SocketOperation {
  type: 'insert' | 'delete';
  position: number;
  content: string;
  userId: string;
  timestamp: number;
}

