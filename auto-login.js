// Test auto-login with superadmin
// Run this in browser console
const autoLogin = async () => {
  try {
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'superadmin',
        password: '@Dm1n123!!'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      localStorage.setItem('token', result.data.token);
      console.log('Auto-login successful! Token saved to localStorage');
      console.log('Refresh page to apply token');
      return result.data.token;
    } else {
      console.error('Login failed:', result);
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};

// Execute auto-login
autoLogin();
