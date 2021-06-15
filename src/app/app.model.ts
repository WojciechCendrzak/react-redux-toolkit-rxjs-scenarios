export interface UserId {
  id: string;
}

export interface User extends UserId {
  firstName?: string;
  lastName?: string;
}
