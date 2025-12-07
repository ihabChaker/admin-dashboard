// Type definitions matching backend entities

export interface Parcours {
  id: number;
  name: string;
  description: string;
  difficultyLevel: "easy" | "medium" | "hard";
  distanceKm: number;
  estimatedDuration: number;
  isPmrAccessible: boolean;
  historicalTheme: string;
  startingPointLat: number;
  startingPointLon: number;
  endPointLat?: number;
  endPointLon?: number;
  gpxFileUrl?: string;
  geoJsonPath?: string;
  imageUrl?: string;
  isActive: boolean;
  creationDate: string;
  updatedAt: string;
  pointsOfInterest?: PointOfInterest[];
  podcasts?: Podcast[];
}

export interface PointOfInterest {
  id: number;
  parcoursId: number;
  name: string;
  description: string;
  poiType: string;
  latitude: number;
  longitude: number;
  historicalPeriod?: string;
  orderInParcours: number;
  qrCode?: string;
  imageUrl?: string;
  audioUrl?: string;
  quizId?: number;
  podcastId?: number;
  quiz?: Quiz;
  podcast?: Podcast;
  creationDate?: string;
  updatedAt?: string;
}

export interface Podcast {
  id: number;
  title: string;
  description: string;
  durationSeconds: number;
  audioFileUrl: string;
  narrator: string;
  language: string;
  thumbnailUrl?: string;
  creationDate: string;
  updatedAt: string;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  questions?: QuizQuestion[];
  creationDate: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  question: string;
  answers: QuizAnswer[];
  creationDate: string;
}

export interface QuizAnswer {
  id: number;
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  creationDate: string;
}

export interface TreasureHunt {
  id: number;
  parcoursId: number;
  name: string;
  description?: string;
  targetObject: string;
  latitude: number;
  longitude: number;
  scanRadiusMeters: number;
  pointsReward: number;
  qrCode?: string;
  isActive: boolean;
  items?: TreasureItem[];
  createdAt: string;
}

export interface TreasureItem {
  id: number;
  treasureHuntId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  points: number;
  quizId?: number;
  podcastId?: number;
  quiz?: Quiz;
  podcast?: Podcast;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface UploadResponse {
  filename: string;
  imageUrl?: string;
  audioFileUrl?: string;
  gpxFileUrl?: string;
  startPoint?: { lat: number; lon: number };
  endPoint?: { lat: number; lon: number };
  totalDistance?: number;
  elevationGain?: number;
  waypointsCount?: number;
  geoJson?: string;
  size?: number;
  duration?: number | null;
}
