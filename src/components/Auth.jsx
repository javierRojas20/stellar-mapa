import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-wrapper">
      {isLogin ? (
        <Login onToggleMode={toggleMode} />
      ) : (
        <Signup onToggleMode={toggleMode} />
      )}
    </div>
  );
};

export default Auth;
