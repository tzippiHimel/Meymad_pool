class ApiService {
  static async request({ endPath, method = "GET", body = null, headers = {}, credentials = null }) {
    try {
      const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

      const defaultHeaders = isFormData
        ? { ...headers } // אל תקבע Content-Type ידנית עבור FormData
        : { "Content-Type": "application/json", ...headers };
      
      const options = {
        method,
        headers: defaultHeaders,
      };

      if (credentials !== null) {
        options.credentials = credentials;
      }

      if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
      }
      
      console.log('Raw VITE_API_URL:', import.meta.env.VITE_API_URL);
      console.log('Type of VITE_API_URL:', typeof import.meta.env.VITE_API_URL);
      console.log('Length of VITE_API_URL:', import.meta.env.VITE_API_URL?.length);
      console.log('All env vars:', Object.keys(import.meta.env));
      
      const baseUrl = (import.meta.env.VITE_API_URL || 'https://meymad-pool.onrender.com').replace(/\/$/, '') + '/';
      console.log('Final API Base URL:', baseUrl);
      const response = await fetch(`${baseUrl}${endPath}`, options);
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }
      
      if (!response.ok) {
        throw {
          status: response.status,
          data,
          message: data.error || data.message || `Error: ${response.status} ${response.statusText}`,
        };
      }
      
      return data;
    } catch (error) {
      console.error('ApiService Error:', error);
      if (error.status !== undefined) {
        throw error;
      }
      
      throw {
        status: null,
        data: null,
        message: error.message || "שגיאה לא ידועה ב-ApiService",
      };
    }
  }
}

export default ApiService;