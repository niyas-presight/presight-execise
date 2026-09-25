export interface ActorSeedRecord {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  total_films: number;
  total_awards: number;
  hobbies: string[];
}

export interface UserRecord {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  total_films: number;
  total_awards: number;
}

export interface SeedSummary {
  usersInserted: number;
  hobbiesInserted: number;
  relationshipsInserted: number;
}
