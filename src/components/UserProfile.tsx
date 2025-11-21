import React from 'react';

interface User {
  name: string;
  username: string;
  bio: string;
  avatarUrl?: string;
}

interface UserProfileProps {
  user: User;
  onEdit: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onEdit }) => {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6 border border-gray-200">
      <div className="flex items-center space-x-4">
        {/* Avatar Placeholder */}
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <img 
              className="h-16 w-16 rounded-full object-cover" 
              src={user.avatarUrl} 
              alt={`${user.name}'s profile`} 
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Name and Username */}
        <div>
          <div className="text-xl font-medium text-black">{user.name}</div>
          <p className="text-gray-500">@{user.username}</p>
        </div>
      </div>

      {/* Bio Section */}
      <div className="mt-4">
        <p className="text-gray-600">{user.bio || "No bio provided."}</p>
      </div>

      {/* Action Button */}
      <div className="mt-6">
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default UserProfile;