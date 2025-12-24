import axios from "axios";

const OAUTH_CONFIG = {
  clientId: import.meta.env.REACT_APP_OAUTH_CLIENT_ID || "bmp-admin-credential-id",
  clientSecret: import.meta.env.REACT_APP_OAUTH_CLIENT_SECRET || "bmp-admin-credential-secret",
  grantType: "client_credentials",
  scope: "admin.internal.read admin.internal.create",
  tokenUrl: "/oauth/token" // Use proxy instead of direct URL
};

let cachedToken = null;
let tokenExpiry = null;

export const getOAuthTokenWithCORSHandling = async () => {
  if (cachedToken && tokenExpiry && new Date() < new Date(tokenExpiry)) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("grant_type", OAUTH_CONFIG.grantType);
  params.append("scope", OAUTH_CONFIG.scope);

  // Create Basic Auth header
  const credentials = btoa(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`);

  try {
    const response = await axios.post(OAUTH_CONFIG.tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`
      },
    });
    
    if (response.data && response.data.access_token) {
      cachedToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      tokenExpiry = new Date(Date.now() + (expiresIn * 1000));
      
      return cachedToken;
    } else {
      console.error("No access_token in OAuth response:", response.data);
      throw new Error("No access token received");
    }
  } catch (error) {
    console.error("OAuth token request failed:", error.response?.data || error.message);
    cachedToken = null;
    tokenExpiry = null;
    throw error;
  }
};

export const clearOAuthToken = () => {
  cachedToken = null;
  tokenExpiry = null;
};

export const getCurrentToken = () => {
  return cachedToken;
};
