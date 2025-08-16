import React, { useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const PasswordInput = ({ value, onChange, placeholder, className = "", id }) => {

    const [isShowPassword, setIsShowPassword] = useState(false);

    const toggleShowPassword = () => {
        setIsShowPassword(!isShowPassword);
    };

  return (
    <div className={`flex items-center bg-transparent border border-gray-300 px-4 rounded-xl ${className}`}> 
      <input
        id={id}
        value={value}
        onChange={onChange}
        type={isShowPassword ? "text" : "password"}
        placeholder={placeholder || "Password"}
        className='w-full text-sm bg-transparent py-3 mr-3 rounded-xl outline-none'
      />

      {isShowPassword ? (
        <FaRegEye 
          size={20}
          className="text-gray-400 hover:text-primary cursor-pointer transition-colors duration-200"
          onClick={toggleShowPassword}
        />
      ) : (
        <FaRegEyeSlash 
          size={20}
          className='text-gray-400 hover:text-primary cursor-pointer transition-colors duration-200'
          onClick={toggleShowPassword}
        />
      )}
    </div>
  )
}

export default PasswordInput
