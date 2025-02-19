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
    id: number;
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