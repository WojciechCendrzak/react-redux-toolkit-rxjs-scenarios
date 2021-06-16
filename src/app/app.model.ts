export interface Entity {
  id: string;
}

export interface User extends Entity {
  firstName?: string;
  lastName?: string;
}

export interface Product extends Entity {
  name?: string;
}
