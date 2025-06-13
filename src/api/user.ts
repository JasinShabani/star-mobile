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
