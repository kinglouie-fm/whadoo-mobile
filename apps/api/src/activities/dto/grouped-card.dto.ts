export interface GroupedCardDto {
  catalogGroupId: string;
  businessId: string;
  businessName: string;
  typeId: string;
  typeLabel: string;
  city: string;
  locationSummary: string;
  thumbnailUrl?: string;
  images?: string[]; // All activity image URLs
  priceFrom: number;
  tags: string[];
  activityCount: number;
  sampleDurations: number[];
  updatedAt: Date;
  representativeActivityId: string;
}

export interface GroupedCardsResponseDto {
  groups: GroupedCardDto[];
  nextCursor: string | null;
}
