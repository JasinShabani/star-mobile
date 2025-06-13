import api from './client';

export const getMyPosts = async (page = 1, pageSize = 10) => {
  const response = await api.get('/post/my', {
    params: { page, pageSize },
  });
  console.log("came here", response);
  return response.data.posts; // Adjust if your backend returns a different structure
};

export const getPostById = async (id: string) => {
  const response = await api.get(`/post/${id}`);
  return response.data;
};

export const starPost = async (postId: string) => {
  await api.post(`/post/${postId}/star`);
};

export const unstarPost = async (postId: string) => {
  await api.delete(`/post/${postId}/star`);
};
