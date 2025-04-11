'use client';
import axios from 'axios';

async function LoadUser({...props}){
      const {
         setUser, setAccessToken, setRefreshToken, setSuccess, setIsLoading, refreshAccessToken
      } = props
      const storedAccessToken = localStorage.getItem('access_token');
      const storedRefreshToken = localStorage.getItem('refresh_token');
      const storedUsername = localStorage.getItem('username');
      console.log('AuthContext - Stored access token:', storedAccessToken);
      console.log('AuthContext - Stored refresh token:', storedRefreshToken);
      console.log('AuthContext - Stored username:', storedUsername);
      console.log(props);

      if (storedAccessToken && storedUsername) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        // Fetch full user profile
        try {
          const response = await axios.get('http://localhost:8000/api/user/', {
            headers: { Authorization: `Bearer ${storedAccessToken}` },
          });
          setUser(response.data); // Now includes id, username, is_staff, is_superuser
          console.log('Loaded user profile:', response.data);
        } catch (err) {
          //console.error('Failed to fetch user profile:', err.response?.data || err.message);
          // Fallback to username-only if profile fetch fails
          setUser({ username: storedUsername });
          if (err.response?.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              const retryResponse = await axios.get('http://localhost:8000/api/user/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setUser(retryResponse.data);
            } else {
              logout();
            }
          }
        }
      }
      setIsLoading(false);
    };

export default LoadUser