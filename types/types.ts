export interface Image {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    src: {
      original: string;
      large2x: string;
      large: string;
      medium: string;
      small: string;
      portrait: string;
      landscape: string;
      tiny: string;
    };
  }
  
  export interface NewsItem {
    [x: string]: any;
    title: string;
    link: string;
    description: string;
    image?: { url: string }; // Optional image property
    bio?: string; // Optional bio property
  }
  
  export interface Video {
    id?: number;
    width: number;
    height: number;
    url: string;
    image: string;
    duration: number;
    user: {
      id: number;
      name: string;
      url: string;
    };
    video_files: {
      id: number;
      quality: string;
      file_type: string;
      width: number | null;
      height: number | null;
      link: string;
    }[];
  }



  export interface Trip {
    id: string;
    email?: string;
    name?: string; // User's name at the time of trip creation
    startLocation?: string;
    destination?: string;
    days?: string;
    budget?: string;
    peopleCount?: string;
    tripForFamily?: boolean;
    familyElderlyCount?: string;
    familyLadiesCount?: string;
    familyChildrenCount?: string;
    familyPreferences?: string;
    generatedWithSubscription?: string;
    selectedFeatures?: string[];
    planSummary?: string;
    hasPlan?: boolean;
    feedbackSubmitted?: boolean;
    feedbackData?: any; // Define more strictly if possible
    createdAt: string; // ISO Date string
  }