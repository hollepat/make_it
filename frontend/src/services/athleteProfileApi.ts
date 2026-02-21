import api from './api';

export interface AthleteProfile {
  id: string;
  userId: string;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  fitnessLevel: string | null;
  primarySport: string | null;
  trainingAgeYears: number | null;
  maxHeartRate: number | null;
  restingHeartRate: number | null;
  injuryNotes: string | null;
  weeklyAvailabilityHours: number | null;
  goals: string | null;
  updatedAt: string;
}

export interface UpdateAthleteProfileRequest {
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  fitnessLevel?: string | null;
  primarySport?: string | null;
  trainingAgeYears?: number | null;
  maxHeartRate?: number | null;
  restingHeartRate?: number | null;
  injuryNotes?: string | null;
  weeklyAvailabilityHours?: number | null;
  goals?: string | null;
}

export const athleteProfileApi = {
  getProfile: async (): Promise<AthleteProfile> => {
    const response = await api.get<AthleteProfile>('/athlete-profile');
    return response.data;
  },

  updateProfile: async (request: UpdateAthleteProfileRequest): Promise<AthleteProfile> => {
    const response = await api.put<AthleteProfile>('/athlete-profile', request);
    return response.data;
  },
};
