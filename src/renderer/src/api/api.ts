import axios from 'axios';

// URL base do BFF do Tia Bete
const BASE_URL = 'https://api-bff.tiabeteoficial.com/api/v1/tia-bete/';

export const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor para injetar o token e id do usuário em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wOs_accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const savedUser = localStorage.getItem('wOs_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.id) {
          config.headers['x-user-id'] = user.id;
          config.headers['x-user-email'] = user.email || '';
        }
      } catch (e) {
        console.error('Erro ao ler usuário no interceptor de API:', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para lidar com expiração de token (401) e Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('wOs_refreshToken');

      if (refreshToken) {
        try {
          // Tenta renovar o token
          const res = await axios.post(`${BASE_URL}user/refresh-token`, { refreshToken });

          if (res.status === 200) {
            const { accessToken } = res.data;
            localStorage.setItem('wOs_accessToken', accessToken);

            // Atualiza o header da requisição original e re-executa
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Se falhar o refresh, limpa tudo e desloga
          localStorage.removeItem('wOs_accessToken');
          localStorage.removeItem('wOs_refreshToken');
          window.location.reload();
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Funções de Autenticação
export const authService = {
  login: (payload: any) => api.post('/login', payload),
  validateToken: () => api.get('/profile'), // Tentando um endpoint genérico de perfil para validar o token
};
