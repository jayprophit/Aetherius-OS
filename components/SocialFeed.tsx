


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Post, Blog, User, Group, MenuItemData, Course } from '../types';
import { loggedInUser, posts, blogs, following, profileCompletion, latestUpdates, groups, peopleYouMayKnowData, sponsoredDataFB, contactsDataFB, mainMenuItems, creatorMarketplaceItems, enrolledCourses, courses, jobs } from '../data';
import { ICON_BUTTON_CLASSES } from '../constants';
import { 
    XMarkIcon, AcademicCapIcon, ShoppingCartIcon, UsersIcon, HiveMindIcon, BriefcaseIcon, 
    ChartBarIcon, PencilIcon, BeakerIcon, ChevronDownIcon, CameraIcon, VideoIcon, GifIcon, 
    LinkIcon, MapIcon, EllipsisHorizontalIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon, 
    PlayIcon, PlusIcon, SearchIcon, ChevronRightIcon, UserPlusIcon, DocumentTextIcon, 
    ArrowDownTrayIcon, ShareIcon, ClockIcon, UserCircleIcon, BookmarkIcon
} from './Icons';

// --- WIDGET CONTAINER ---
const DashboardWidget: React.FC<{ title: string; children: React.ReactNode; viewAllLink?: string; onSetView?: (view: string) => void }> = ({ title, children, viewAllLink, onSetView }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            {viewAllLink && onSetView && (
                <button onClick={() => onSetView(viewAllLink)} className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-500" title={`View all ${title}`}>
                    VIEW ALL
                </button>
            )}
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
            {children}
        </div>
    </div>
);


// --- NEW DASHBOARD COMPONENTS ---

const Shortcut: React.FC<{ item: MenuItemData; onSetView: (view: string, context?: any) => void; }> = ({ item, onSetView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const Icon = item.icon;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (child: MenuItemData) => {
        if (child.component) {
            onSetView(child.component);
        }
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={`Open ${item.title} Menu`}
            >
                {Icon && <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{item.title}</span>
                {item.children && <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>

            {isOpen && item.children && (
                <div className="absolute top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in-up">
                    {item.children.map(child => (
                        <button
                            key={child.title}
                            onClick={() => handleItemClick(child)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                            disabled={!child.component}
                            title={`Launch ${child.title}`}
                        >
                            {child.icon && <child.icon className="w-4 h-4 text-gray-500" />}
                            <span>{child.title}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const DashboardShortcuts: React.FC<{ onSetView: (view: string, context?: any) => void; }> = ({ onSetView }) => {
    const shortcutItems: MenuItemData[] = [];
    
    // Flatten groups to find items for shortcuts
    mainMenuItems.forEach(group => {
        if (group.children) {
             group.children.forEach(child => {
                 if (['Social Hub', 'Creation Labs', 'E-Commerce Hub', 'Labs', 'Careers Hub', 'E-Learning'].includes(child.title || '')) {
                     shortcutItems.push(child);
                 }
             })
        }
    });

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-start gap-2 flex-wrap">
            {shortcutItems.map(item => item.title && <Shortcut key={item.title} item={item} onSetView={onSetView} />)}
        </div>
    );
};

const MiniFeedWidget: React.FC<{ onSetView: (view: string, context?: any) => void; }> = ({ onSetView }) => {
    return (
        <DashboardWidget title="Your Feed" viewAllLink="feedBiome" onSetView={onSetView}>
            {posts.length > 0 ? (
                 <div className="-m-4">
                     <PostCard post={posts[0]} />
                 </div>
            ) : (
                <p className="text-sm text-gray-500">No new posts in your feed.</p>
            )}
        </DashboardWidget>
    );
};

const RecommendedProductsWidget: React.FC<{ onSetView: (view: string, context?: any) => void; }> = ({ onSetView }) => {
    const products = creatorMarketplaceItems.slice(0, 3);
    return (
        <DashboardWidget title="Recommended For You" viewAllLink="creatorMarketplace" onSetView={onSetView}>
            <div className="space-y-3">
                {products.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer" title={`View ${item.name}`}>
                        <img src={item.iconUrl} alt={item.name} className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.creator.name}</p>
                        </div>
                        <span className="text-sm font-bold">{item.price === 'Free' ? 'Free' : `$${item.price}`}</span>
                    </div>
                ))}
            </div>
        </DashboardWidget>
    );
};

const UnfinishedCoursesWidget: React.FC<{ onSetView: (view: string, context?: any) => void; }> = ({ onSetView }) => {
     const userCourses = enrolledCourses.map(enrolled => {
        const courseDetails = courses.find(c => c.id === enrolled.courseId);
        return { ...courseDetails, progress: enrolled.progress };
    }).filter(c => c.id);
    
    return (
        <DashboardWidget title="Continue Learning" viewAllLink="myLearning" onSetView={onSetView}>
            <div className="space-y-4">
                {userCourses.map(course => (
                    <div key={course.id} className="cursor-pointer" onClick={() => onSetView('courseDetail', { courseId: course.id })} title={`Continue ${course.title}`}>
                        <p className="font-semibold text-sm truncate">{course.title}</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                        </div>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.progress}% complete</p>
                    </div>
                ))}
            </div>
        </DashboardWidget>
    );
};

const RecommendedJobsWidget: React.FC<{ onSetView: (view: string, context?: any) => void; }> = ({ onSetView }) => {
    const recommendedJobs = jobs.slice(0, 2);
    return (
        <DashboardWidget title="Job Recommendations" viewAllLink="jobSearch" onSetView={onSetView}>
            <div className="space-y-3">
                {recommendedJobs.map(job => (
                    <div key={job.id} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer" title={`View Job: ${job.title}`}>
                        <p className="font-semibold text-sm">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.company} &bull; {job.location}</p>
                    </div>
                ))}
            </div>
        </DashboardWidget>
    );
};

export const SocialFeed: React.FC<{ onSetView: (view: string, context?: any) => void; }> = ({ onSetView }) => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto space-y-6">
            <DashboardShortcuts onSetView={onSetView} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <MiniFeedWidget onSetView={onSetView} />
                </div>
                <aside className="xl:col-span-1 space-y-6">
                    <RecommendedProductsWidget onSetView={onSetView} />
                    <UnfinishedCoursesWidget onSetView={onSetView} />
                    <RecommendedJobsWidget onSetView={onSetView} />
                </aside>
            </div>
        </div>
    );
};


// --- COMPONENTS FOR MERGED FEED VIEW ('feedBiome') ---

// --- WIDGETS & BANNERS ---

export const WelcomeBanner: React.FC = () => {
    const [isVisible, setIsVisible] = React.useState(true);
    if (!isVisible) return null;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4">
            <div className="flex-1">
                <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">Welcome to the Aetherius Community Hub</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Connect, create, and stay updated. <a href="#" className="text-blue-500 font-bold hover:underline" title="Explore community features">Explore community features!</a></p>
            </div>
            <img src="https://i.imgur.com/uKW0Xub.png" alt="Community illustration" className="h-20 hidden sm:block"/>
            <button onClick={() => setIsVisible(false)} className="self-start text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Dismiss Welcome Banner">
                <XMarkIcon className="w-6 h-6"/>
            </button>
        </div>
    );
};

const Widget: React.FC<{title: string, seeAll?: boolean, children: React.ReactNode, noPadding?: boolean}> = ({title, seeAll=false, children, noPadding=false}) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            {seeAll && <a href="#" className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-orange-500" title={`View all ${title}`}>SEE ALL</a>}
        </div>
        <div className={noPadding ? '' : 'p-4'}>
            {children}
        </div>
    </div>
);


// --- CENTER COLUMN COMPONENTS ---

export const ActivityFeedCreator: React.FC = () => {
    const filters = ['All', 'Announcement', 'Health & Wellness', 'Food & Recipes', 'News', 'Travel & Places', 'Events & Meetups', 'Photography & Art', 'Tech & Gadgets'];

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <textarea
                className="w-full border-none focus:ring-0 resize-none bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400"
                rows={2}
                placeholder={`Share what's on your mind, ${loggedInUser.name}...`}
                title="Compose a new post"
            ></textarea>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex space-x-1">
                    <button className={ICON_BUTTON_CLASSES} title="Add Photo to Post"><CameraIcon className="w-5 h-5" /></button>
                    <button className={ICON_BUTTON_CLASSES} title="Add Video to Post"><VideoIcon className="w-5 h-5" /></button>
                    <button className={ICON_BUTTON_CLASSES} title="Add GIF to Post"><GifIcon className="w-5 h-5" /></button>
                    <button className={ICON_BUTTON_CLASSES} title="Add Link to Post"><LinkIcon className="w-5 h-5" /></button>
                    <button className={ICON_BUTTON_CLASSES} title="Add Location to Post"><MapIcon className="w-5 h-5" /></button>
                </div>
                <button className="px-6 py-2 font-semibold text-sm text-white bg-gray-800 dark:bg-blue-600 rounded-md hover:bg-gray-700 dark:hover:bg-blue-500" title="Publish Post">Post</button>
            </div>
            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                {filters.map(filter => (
                    <button key={filter} className="px-3 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title={`Filter by ${filter}`}>{filter}</button>
                ))}
            </div>
        </div>
    );
};

export const PeopleYouMayKnow: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-3 flex justify-between items-center">
                <h3 className="font-bold text-lg">People you may know</h3>
                <a href="#" className="text-blue-500 text-sm font-semibold hover:underline" title="See all recommendations">See all</a>
            </div>
            <div className="pl-3 pb-3 flex overflow-x-auto gap-2">
                {peopleYouMayKnowData.map(person => (
                    <div key={person.name} className="flex-shrink-0 w-48 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm overflow-hidden">
                        <img src={person.imageUrl} alt={person.name} className="w-full h-48 object-cover"/>
                        <div className="p-2">
                            <p className="font-semibold">{person.name}</p>
                            <button className="w-full mt-2 flex items-center justify-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold p-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900" title={`Add ${person.name} as friend`}>
                                <UserPlusIcon className="w-4 h-4" />
                                Add friend
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PostCard: React.FC<{ post: Post }> = ({ post }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                    <img src={post.author.avatarUrl!} className="w-10 h-10 rounded-full object-cover"/>
                    <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{post.author.name} posted an update</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{post.timestamp}</p>
                    </div>
                </div>
                <button className={`${ICON_BUTTON_CLASSES} p-1`} title="More options">
                    <EllipsisHorizontalIcon className="w-5 h-5"/>
                </button>
            </div>
            {post.content && <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm">{post.content}</p>}
            {post.media && (
                <div className="mt-4 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                    {post.media.type === 'image' && <img src={post.media.url} alt="Post content" className="w-full object-cover"/>}
                    {post.media.type === 'video' && (
                        <div className="relative bg-black">
                            <img src={post.media.thumbnailUrl} alt="Video thumbnail" className="w-full object-cover opacity-70"/>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors" title="Play Video">
                                    <PlayIcon className="w-8 h-8"/>
                                </button>
                            </div>
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">{post.media.duration}</span>
                        </div>
                    )}
                     {post.media.type === 'code' && (
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 text-xs font-mono text-gray-600 dark:text-gray-300">
                           <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                            <span>{post.media.filename}</span>
                           </div>
                           <pre><code>{post.media.content}</code></pre>
                        </div>
                    )}
                    {post.media.type === 'file' && (
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <DocumentTextIcon className="w-8 h-8 text-gray-400"/>
                                <div>
                                    <p className="font-semibold">{post.media.filename}</p>
                                    <p className="text-xs text-gray-500">{post.media.size} - Click to view</p>
                                </div>
                            </div>
                            <button className={ICON_BUTTON_CLASSES} title="Download File"><ArrowDownTrayIcon className="w-5 h-5"/></button>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="px-4 py-2 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div>
                {post.likes.length > 0 && <span>{post.likes.length > 1 ? `${post.likes[0].name} and ${post.likes.length-1} others` : post.likes[0].name}</span>}
            </div>
            <div>
                {post.comments.length > 0 && <span>{post.comments.length} Comment{post.comments.length > 1 && 's'}</span>}
            </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 flex">
            <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors" title="Like Post"><HeartIcon className="w-5 h-5"/> Like</button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border-l border-gray-200 dark:border-gray-700" title="Comment on Post"><ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5"/> Comment</button>
             <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border-l border-gray-200 dark:border-gray-700" title="Share Post"><ShareIcon className="w-5 h-5"/> Share</button>
        </div>

        {post.comments.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                {post.comments.map(comment => (
                    <div key={comment.id} className="flex space-x-3">
                        <img src={comment.author.avatarUrl!} className="w-8 h-8 rounded-full object-cover flex-shrink-0"/>
                        <div>
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{comment.author.name}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1 pl-1">
                                <button className="hover:underline font-semibold" title="Like comment">Like</button>
                                <button className="hover:underline font-semibold" title="Reply to comment">Reply</button>
                                <span>{comment.timestamp}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

         <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3">
             <img src={loggedInUser.avatarUrl!} className="w-8 h-8 rounded-full object-cover flex-shrink-0"/>
             <input type="text" placeholder="Write a comment..." className="w-full bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-full h-8 px-4 text-sm focus:ring-blue-500 focus:border-blue-500" title="Write a comment"/>
         </div>
    </div>
);


// --- LEFT SIDEBAR WIDGETS ---

export const BlogWidget: React.FC = () => (
    <Widget title="Blog" seeAll>
        <div className="space-y-4">
            {blogs.map(blog => (
                <div key={blog.id} className="flex items-center space-x-3">
                    <div style={{backgroundImage: `url(${blog.imageUrl})`}} className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0 bg-cover bg-center"></div>
                    <div>
                        <a href="#" className="font-semibold text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 leading-tight" title={`Read article: ${blog.title}`}>{blog.title}</a>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{blog.date}</p>
                    </div>
                </div>
            ))}
        </div>
    </Widget>
);

export const FollowingWidget: React.FC = () => (
    <Widget title={`I'm Following ${following.length}`} seeAll>
        <div className="grid grid-cols-5 gap-3">
            {following.slice(0, 10).map(user => (
                <div key={user.id} title={user.name}>
                    <img src={user.avatarUrl!} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                </div>
            ))}
        </div>
    </Widget>
);


// --- RIGHT SIDEBAR WIDGETS ---

export const CompleteProfileWidget: React.FC = () => {
    const { percentage, steps } = profileCompletion;
    const circumference = 2 * Math.PI * 30;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <Widget title="Complete Your Profile">
            <div className="flex flex-col items-center text-center">
                 <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 70 70">
                        <circle className="text-gray-200 dark:text-gray-700" strokeWidth="5" stroke="currentColor" fill="transparent" r="30" cx="35" cy="35"/>
                        <circle className="text-green-500" strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r="30" cx="35" cy="35" transform="rotate(-90 35 35)"/>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{percentage}%</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Complete</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
                {steps.map(step => (
                     <li key={step.name} className="flex items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${step.completed ? 'bg-green-500' : 'border-2 border-gray-300 dark:border-gray-500'}`}>
                            {step.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{step.name}</span>
                        <span className="ml-auto text-gray-400 dark:text-gray-500">{step.progress}</span>
                    </li>
                ))}
            </ul>
        </Widget>
    )
}

export const SponsoredWidget: React.FC = () => (
    <div>
        <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-2 px-4">Sponsored</h3>
        {sponsoredDataFB.map(item => (
             <a href="#" key={item.title} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700" title={`Visit ${item.title}`}>
                <img src={item.imageUrl} alt={item.title} className="w-28 h-28 object-cover rounded-lg" />
                <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.url}</p>
                </div>
             </a>
        ))}
    </div>
);

export const LatestUpdatesWidget: React.FC = () => (
    <Widget title="Latest Updates" seeAll noPadding>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {latestUpdates.map(update => (
                 <li key={update.id} className="p-4 flex space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50" title={`${update.author.name}: ${update.content}`}>
                    <img src={update.author.avatarUrl!} className="w-8 h-8 rounded-full object-cover flex-shrink-0"/>
                    <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                           <span className="font-semibold text-gray-800 dark:text-gray-100">{update.author.name}</span> {update.content}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{update.timestamp}</p>
                    </div>
                </li>
            ))}
        </ul>
    </Widget>
);

export const ContactsWidget: React.FC = () => (
    <div>
        <div className="flex justify-between items-center mb-2 px-4">
            <h3 className="font-semibold text-gray-600 dark:text-gray-400">Contacts</h3>
             <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Search contacts"><SearchIcon className="w-4 h-4"/></button>
                <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Contact options"><EllipsisHorizontalIcon className="w-4 h-4"/></button>
             </div>
        </div>
        {contactsDataFB.map(contact => (
            <a href="#" key={contact.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700" title={`Message ${contact.name}`}>
                <img src={contact.avatarUrl!} alt={contact.name} className="w-7 h-7 rounded-full" />
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{contact.name}</span>
            </a>
        ))}
    </div>
);

export const GroupsWidget: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState('POPULAR');
    
    return (
        <Widget title="Groups" seeAll noPadding>
            <div className="px-4 pt-2">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    {['NEWEST', 'ACTIVE', 'POPULAR'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-2 text-xs font-bold uppercase tracking-widest ${activeTab === tab ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                            title={`Sort by ${tab}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
             <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {groups.map(group => (
                    <li key={group.id} className="p-4 flex space-x-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <img src={group.avatarUrl} className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0 bg-cover bg-center" />
                        <div className="flex-1">
                            <a href="#" className="font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-blue-500" title={`View group: ${group.name}`}>{group.name}</a>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{group.members} members</p>
                        </div>
                    </li>
                ))}
             </ul>
        </Widget>
    )
}
