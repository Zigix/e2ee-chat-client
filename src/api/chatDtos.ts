export type UploadRoomKeysApiRequest = {
  version: number;
  wrappedByUserId: number;
  keyItems: {
    userId: number;
    wrappedRoomKeyB64: string;
    ivB64: string;
    aadB64: string;
  }[];
};

