import api from './client';

export const getCategories = async () => {
  const res = await api.get('/category');
  return res.data;
};
