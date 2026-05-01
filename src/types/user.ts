import type { Company } from "./company";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithCompany extends User {
  company: Company | null;
}