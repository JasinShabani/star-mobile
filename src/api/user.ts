import api from './client';

export const getMe = async () => {
    try {
      const response = await api.get('/user/me');
      console.log('getMe:', response.data);
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

export const searchUsers = async (q: string, page = 1, limit = 20) => {
  const res = await api.get('/user/search', { params: { q, page, limit } });
  return res.data.users;
};

export const getUserByUsername = async (username: string) => {
  const res = await api.get(`/user/${username}`);
  return res.data.user;
};

export const followUser = async (targetUserIdOrUsername: string) => {
  const res = await api.post(`/user/${targetUserIdOrUsername}/follow`);
  return res.data;
};

export const unfollowUser = async (targetUserIdOrUsername: string) => {
  const res = await api.delete(`/user/${targetUserIdOrUsername}/unfollow`);
  return res.data;
};

// New helpers to fetch current user's followers and following lists
export const getFollowers = async () => {
  const res = await api.get('/user/followers');
  return res.data;
};

export const getFollowing = async () => {
  const res = await api.get('/user/following');
  return res.data;
};

export const deleteAccount = async () => {
  await api.delete('/user/delete-account');
};

// Block / Unblock helpers
export const blockUser = async (targetUserIdOrUsername: string) => {
  const res = await api.post(`/user/${targetUserIdOrUsername}/block`);
  return res.data;
};

export const unblockUser = async (targetUserIdOrUsername: string) => {
  const res = await api.post(`/user/${targetUserIdOrUsername}/unblock`);
  return res.data;
};
