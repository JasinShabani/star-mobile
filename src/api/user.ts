import api from './client';

export const getMe = async () => {
    try {
      const response = await api.get('/user/me');
      console.log('getMe:');
      console.log(response.data);
      return response.data.user;
    } catch (err) {
      console.log('getMe error:', err);
      throw err;
    }
};

export const uploadProfileImage = async (image: { uri: string; mime: string; name: string }) => {
  const formData = new FormData();
  formData.append('file', {
    uri: image.uri,
    type: image.mime,
    name: image.name || 'profile.jpg',
  } as any);
  const response = await api.post('/user/upload-profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.user;
};

export const updateProfile = async (data: { firstName: string; lastName: string; city: string; country: string }) => {
  const response = await api.put('/user/update-profile', data);
  return response.data;
};
