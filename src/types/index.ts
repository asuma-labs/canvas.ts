export interface CanvasMetadata {
  id: string;
  template: string;
  filename: string;
  storage_path: string;
  created_at: string;
  expires_at: string;
}

export interface CanvasResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    filename: string;
    url: string;
  };
}

export interface GenerateParams {
  [key: string]: string | number | undefined;
}
