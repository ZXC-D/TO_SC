export interface TreeConfig {
  height: number;
  layers: number;
  bottomRadius: number;
  color: string;
}

export interface OrnamentData {
  id: number;
  position: [number, number, number];
  color: string;
  size: number;
  type: 'sphere' | 'diamond';
}

export interface AIState {
  loading: boolean;
  message: string | null;
  error: string | null;
}
