import api from './client';

export const getFeedFollowing = async (page = 1, limit = 10, categoryId?: string) => {
  const params: any = { page, limit };
  if (categoryId) params.categoryId = categoryId;
  const res = await api.get('/feed/following', { params });
  return res.data;
};

export const getFeedForYou = async (page = 1, limit = 10, categoryId?: string) => {
  const params: any = { page, limit };
  if (categoryId) params.categoryId = categoryId;
  const res = await api.get('/feed/foryou', { params });
  return res.data;
}; 
