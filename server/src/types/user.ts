export interface ActorSeedRecord {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
}

export interface SeedSummary {
  usersInserted: number;
  hobbiesInserted: number;
  relationshipsInserted: number;
}
