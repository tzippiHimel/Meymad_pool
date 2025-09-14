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
      
      // Dynamic URL based on environment
      const getBaseUrl = () => {
        // In production (Netlify), use relative URLs for proxy redirects
        // In development, use the full URL to the Render server
        if (process.env.NODE_ENV === 'production') {
          return ''; // Use relative URLs for Netlify proxy
        }
        return 'https://meymad-pool.onrender.com/';
      };
      
      const baseUrl = getBaseUrl();
      const fullUrl = baseUrl + endPath;
      console.log(`API request to: ${fullUrl}`);
      const response = await fetch(fullUrl, options);
      
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