export interface SpotifyPlaybackState {
    context: {
      uri: string;
      metadata: any;
    };
    disallows: {
      resuming: boolean;
      skipping_prev: boolean;
      skipping_next: boolean;
      seeking: boolean;
      pausing: boolean;
    };
    paused: boolean;
    position: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: {
        album: {
          images: { url: string }[];
        };
        name: string;
        artists: { name: string }[];
      };
      next_tracks: any[];
      previous_tracks: any[];
    };
  }
  