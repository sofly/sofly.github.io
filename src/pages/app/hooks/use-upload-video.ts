import { useState } from 'react';
import axios from 'axios';

import { useRequestState } from '../../../hooks/use-request-state';

export const useUploadVideo = () => {
  const [link, setLink] = useState<Nullable<string>>(null);
  const [state, actions, helpers] = useRequestState();

  const uploadVideo = async (blob: Blob) => {
    try {
      actions.setToFetching();

      const body = new FormData();

      body.append('file', blob);
      body.append('upload_preset', 'selfie');
      body.append('tags[]', 'video');
      body.append('public_id', `${Date.now()}`);

      const data = await axios.post<{ secure_url: string }>(
        'https://api.cloudinary.com/v1_1/hl7aznolk/video/upload',
        body,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      setLink(data.data.secure_url);

      actions.setToFetched();
    } catch (e) {
      actions.setToFailed(e);
    }
  };

  return [{ ...state, link }, { uploadVideo }, helpers] as const;
};
