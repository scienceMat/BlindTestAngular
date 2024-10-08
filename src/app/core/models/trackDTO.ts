export interface TrackDTO {
    title: string;
    image: string;
    artist: string;
    filePath: string;
    duration_ms: number;
  }


  export interface SpotifyPlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: {
        name: string;
        album: {
          images: { url: string }[];
          name: string;
          // Add other necessary album fields
        };
        artists: { name: string }[];
        uri: string;
        duration_ms: number;
        // Add other necessary track fields
      };
    };
  }

  export interface CurrentPlaybackResponse {
    is_playing: boolean;
    progress_ms: number;
    item: {
      name: string;
      album: {
        images: { url: string }[];
      };
      artists: { name: string }[];
      uri: string;
      duration_ms: number;
    };
  }