
import React, { useState, useRef, ChangeEvent } from 'react';
import { loggedInUser } from '../data';
import { User } from '../types';
import { CameraIcon, UserIcon, AtSymbolIcon, DocumentTextIcon, GitHubIcon, GlobeAltIcon, PencilIcon, LinkIcon } from './Icons';

// A new component for editable fields
const EditableField: React.FC<{
    name: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder: string;
    icon: React.FC<any>;
    isEditing: boolean;
    onEditClick: (name: string | null) => void;
    as?: 'textarea';
}> = ({ name, label, value, onChange, placeholder, icon: Icon, isEditing, onEditClick, as }) => {
    if (isEditing) {
        const commonProps = {
            name,
            id: name,
            value,
            onChange,
            placeholder,
            className: "block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 pl-10 py-2 text-sm focus:border-blue-500 focus:ring-blue-500",
            autoFocus: true,
            title: `Editing ${label}`,
            onBlur: () => onEditClick(null), // Close on blur
            onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && as !== 'textarea') {
                    onEditClick(null);
                } else if (e.key === 'Escape') {
                    onEditClick(null);
                }
            }
        };

        const iconElement = (
            <div className={`pointer-events-none absolute left-0 flex items-center pl-3 ${as === 'textarea' ? 'top-2.5' : 'inset-y-0'}`}>
                <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
        );

        return (
            <div>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <div className="relative">
                    {iconElement}
                    {as === 'textarea' ? (
                        <textarea {...commonProps} rows={3} />
                    ) : (
                        <input type="text" {...commonProps} />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <div className="group flex items-center justify-between gap-4 p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <p className="text-gray-900 dark:text-gray-100 text-sm break-all">{value || <span className="italic text-gray-400">{placeholder}</span>}</p>
                </div>
                <button
                    onClick={() => onEditClick(name)}
                    className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    aria-label={`Edit ${label}`}
                    title={`Edit ${label}`}
                >
                    <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
            </div>
        </div>
    );
};

const SocialButton: React.FC<{ platform: string, children: React.ReactNode }> = ({ platform, children }) => {
    // A real implementation would have different logic for each platform
    const connect = () => alert(`Connecting with ${platform}...`);
    return (
        <button onClick={connect} className="w-full flex items-center justify-center gap-3 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" title={`Connect with ${platform}`}>
            {children}
        </button>
    )
}


export const MyProfile: React.FC = () => {
    const [profile, setProfile] = useState<User>(loggedInUser);
    const [profilePic, setProfilePic] = useState<string | null>(profile.avatarUrl);
    const [isDirty, setIsDirty] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('socials.')) {
            const socialPlatform = name.split('.')[1] as keyof User['socials'];
            setProfile(prev => ({
                ...prev,
                socials: {
                    ...prev.socials,
                    [socialPlatform]: value,
                }
            }));
        } else {
            setProfile(prev => ({ ...prev, [name]: value }));
        }
        setIsDirty(true);
    };

    const handlePictureClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        // Here you would typically send the data to a server
        console.log("Saving profile:", { ...profile, avatarUrl: profilePic });
        setIsDirty(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
    };
    
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your personal information and presence.</p>
                </div>
                <button 
                    onClick={handleSaveChanges}
                    disabled={!isDirty}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title="Save Profile Changes"
                >
                    Save Changes
                </button>
            </header>
            
            {showSaved && (
                 <div className="mb-4 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg text-sm" role="alert">
                    <span className="font-bold">Success!</span> Your profile has been updated.
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                        <div className="relative w-32 h-32 mx-auto group">
                            <img
                                src={profilePic || `https://ui-avatars.com/api/?name=${profile.name}&background=random`}
                                alt="Profile"
                                className="rounded-full w-full h-full object-cover shadow-md"
                            />
                            <button
                                onClick={handlePictureClick}
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Upload Profile Picture"
                            >
                                <CameraIcon className="w-8 h-8" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">{profile.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <LinkIcon className="w-6 h-6"/>
                            Linked Accounts
                        </h3>
                         <div className="space-y-3">
                            <SocialButton platform="Google">
                                <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.582-3.344-11.113-7.962l-6.571 4.819C9.656 39.663 16.318 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.574l6.19 5.238C39.901 36.631 44 30.638 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                                Connect with Google
                            </SocialButton>
                            <SocialButton platform="Apple">
                               <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19.3,4.33a4.79,4.79,0,0,0-3.77,2,4.23,4.23,0,0,0-3.46,0A4.86,4.86,0,0,0,8.3,4.4,5.2,5.2,0,0,0,3.18,9.45a5.6,5.6,0,0,0,1.25,4,6.88,6.88,0,0,0,3.34,2.46,1,1,0,0,0,.15,.06,10.23,10.23,0,0,0,3.06,1,1,1,0,0,0,1,0,10.23,10.23,0,0,0,3.06-1,1,1,0,0,0,.15-.06,6.88,6.88,0,0,0,3.34-2.46,5.6,5.6,0,0,0,1.25-4A5,5,0,0,0,19.3,4.33ZM12,2.25a2.4,2.4,0,0,1,1.82,1,2.54,2.54,0,0,1-1.82,3.36A2.54,2.54,0,0,1,10.18,3.29,2.4,2.4,0,0,1,12,2.25Z"/></svg>
                                Connect with Apple
                            </SocialButton>
                         </div>
                     </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                        <PencilIcon className="w-6 h-6"/>
                        Profile Information
                    </h3>
                    <div className="space-y-4">
                        <EditableField
                            name="name"
                            label="Full Name"
                            value={profile.name || ''}
                            onChange={handleInputChange}
                            icon={UserIcon}
                            placeholder="Your full name"
                            isEditing={editingField === 'name'}
                            onEditClick={setEditingField}
                        />
                         <EditableField
                            name="username"
                            label="Username"
                            value={profile.username || ''}
                            onChange={handleInputChange}
                            icon={AtSymbolIcon}
                            placeholder="your_username"
                            isEditing={editingField === 'username'}
                            onEditClick={setEditingField}
                        />
                         <EditableField
                            as="textarea"
                            name="bio"
                            label="Bio"
                            value={profile.bio || ''}
                            onChange={handleInputChange}
                            icon={DocumentTextIcon}
                            placeholder="Tell us a little about yourself..."
                            isEditing={editingField === 'bio'}
                            onEditClick={setEditingField}
                        />
                         <div className="pt-4">
                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Social Links</h4>
                             <div className="space-y-4">
                                <EditableField
                                    name="socials.github"
                                    label="GitHub"
                                    value={profile.socials?.github || ''}
                                    onChange={handleInputChange}
                                    icon={GitHubIcon}
                                    placeholder="https://github.com/..."
                                    isEditing={editingField === 'socials.github'}
                                    onEditClick={setEditingField}
                                />
                                <EditableField
                                    name="socials.linkedin"
                                    label="LinkedIn / Website"
                                    value={profile.socials?.linkedin || ''}
                                    onChange={handleInputChange}
                                    icon={GlobeAltIcon}
                                    placeholder="https://linkedin.com/in/..."
                                    isEditing={editingField === 'socials.linkedin'}
                                    onEditClick={setEditingField}
                                />
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
