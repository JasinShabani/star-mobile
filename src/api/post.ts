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

export const createPost = async (caption: string, categoryId: string) => {
  const res = await api.post('/post', { caption, categoryId });
  return res.data.post;
};

export const uploadPostMedia = async (postId: string, files: { uri: string; type: string; name: string }[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
  });
  const res = await api.post(`/post/${postId}/upload-media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.medias;
};

export const getPostsByUsername = async (username: string, page = 1, pageSize = 20) => {
  const res = await api.get(`/post/user/${username}`, { params: { page, pageSize } });
  return res.data.posts;
};

export const reportPost = async (postId: string, reason: string) => {
  const response = await api.post(`/post/${postId}/report`, { reason });
  return response.data;
};
