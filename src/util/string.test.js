import { extractYouTubeID } from './string';

describe('util/string.js', () => {
  describe('extract Youtube ID from valid Youtube URLs', () => {
    it('extracts video ID from regular format', () => {
      const youtubeURL = 'https://www.youtube.com/watch?v=_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from regular format without www', () => {
      const youtubeURL = 'https://youtube.com/watch?v=_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from a mixed-case URL', () => {
      const youtubeURL = 'https://www.Youtube.com/Watch?v=_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from URL with a trailing slash', () => {
      const youtubeURL = 'https://www.youtube.com/watch?v=_oFwerO44JE/';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from URL with encoded characters in query parameters', () => {
      const youtubeURL = 'https://www.youtube.com/watch?v=_oFwerO44JE&feature%3Dchannel';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from mobile format', () => {
      const youtubeURL = 'http://m.youtube.com/watch?v=_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from format with fragment timestamp', () => {
      const youtubeURL = 'https://www.youtube.com/watch?v=_oFwerO44JE#t=0m10s';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from URL with extra parameters before video ID', () => {
      const youtubeURL = 'https://www.youtube.com/watch?time_continue=10&v=_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from format with additional parameters', () => {
      const youtubeURL = 'http://www.youtube.com/watch?v=_oFwerO44JE&feature=channel';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from embed format', () => {
      const youtubeURL = 'https://www.youtube.com/embed/_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from shortened format', () => {
      const youtubeURL = 'https://youtu.be/_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from shortened URL with extra parameters', () => {
      const youtubeURL = 'https://youtu.be/_oFwerO44JE?feature=share';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from shortened format with timestamp', () => {
      const youtubeURL = 'https://youtu.be/_oFwerO44JE?t=1s';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from "v" path format', () => {
      const youtubeURL = 'https://www.youtube.com/v/_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from "shorts" format', () => {
      const youtubeURL = 'https://www.youtube.com/shorts/_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });

    it('extracts video ID from "live" format', () => {
      const youtubeURL = 'https://www.youtube.com/live/_oFwerO44JE';
      expect(extractYouTubeID(youtubeURL)).toBe('_oFwerO44JE');
    });
  });

  describe('extractYouTubeID function with invalid URLs', () => {
    it('returns null for a non-YouTube URL', () => {
      const url = 'https://www.example.com/watch?v=_oFwerO44JE';
      expect(extractYouTubeID(url)).toBe(null);
    });

    it('returns null for a YouTube URL without a video ID', () => {
      const url = 'https://www.youtube.com/watch?v=';
      expect(extractYouTubeID(url)).toBe(null);
    });

    it('returns null for a YouTube playlist URL', () => {
      const url = 'https://www.youtube.com/playlist?list=PL9tY0BWXOZFuzCX81AwB1xmXt4RWuIjAT';
      expect(extractYouTubeID(url)).toBe(null);
    });

    it('returns null for a YouTube channel URL', () => {
      const url = 'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw';
      expect(extractYouTubeID(url)).toBe(null);
    });
    it('returns null for a URL with a video ID that is not 11 characters', () => {
      const youtubeURL = 'https://www.youtube.com/watch?v=_oFwerO44J';
      expect(extractYouTubeID(youtubeURL)).toBe(null);
    });

    it('returns null for a URL with a different path structure', () => {
      const youtubeURL = 'https://www.youtube.com/guide?param=value';
      expect(extractYouTubeID(youtubeURL)).toBe(null);
    });
  });

  describe('extractYouTubeID function with malicious code injection', () => {
    it('returns null for a URL with embedded JavaScript injection', () => {
      const url = "https://www.youtube.com/watch?v=_oFwerO44JE&onerror=alert('XSS')";
      expect(extractYouTubeID(url)).toBe('_oFwerO44JE');
    });

    it('returns null for a URL with a data URI scheme attempting injection', () => {
      const url = "data:text/html,<script>alert('XSS')</script>";
      expect(extractYouTubeID(url)).toBe(null);
    });
  });
});
