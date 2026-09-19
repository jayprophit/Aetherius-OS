
import React from 'react';
import { AcademicCapIcon, BriefcaseIcon, PaintBrushIcon, HeartIcon, BuildingOfficeIcon } from './Icons';

interface Platform {
  name: string;
  features: string;
  pricing: string;
  idealFor: string;
}

interface Category {
  name: string;
  icon: React.FC<any>;
  platforms: Platform[];
}

const learningPlatformsData: Category[] = [
  {
    name: 'University-Affiliated & Academic',
    icon: AcademicCapIcon,
    platforms: [
      { name: 'Academix', features: 'Offers courses, specializations, and degrees from universities like Stanford and Yale.', pricing: 'Free audits; certificates from $39, degrees from $2,000+.', idealFor: 'Learners seeking accredited credentials and academic rigor.' },
      { name: 'OpenEdu', features: 'Founded by Ivy League institutes, provides MicroMasters, professional certificates, and university-level courses.', pricing: 'Free audits; certificates range from $50–$300.', idealFor: 'Those looking for academically rigorous, university-backed programs.' },
      { name: 'FutureLearn', features: 'Social learning approach with courses from leading institutions. Focuses on collaborative learning.', pricing: 'Free with paid upgrades (£30–£150 for certificates).', idealFor: 'Learners who enjoy peer interaction and structured academic content.' },
    ],
  },
  {
    name: 'Skill-Based & Professional Development',
    icon: BriefcaseIcon,
    platforms: [
      { name: 'SkillForge', features: 'Vast library of 200,000+ courses on programming, marketing, etc. Self-paced learning with lifetime access.', pricing: 'Courses start at $10–$200. Team plans available.', idealFor: 'Beginners and professionals seeking affordable, diverse skill development.' },
      { name: 'ProNetwork Learning', features: 'Integrates with ProNetwork profiles, offers courses in business, tech, and creative fields.', pricing: '$39.99/month or $239.88/year.', idealFor: 'Professionals aiming to enhance career skills and visibility.' },
      { name: 'TechSight', features: 'Focuses on technology skills (IT, coding, cybersecurity) with skill assessments and learning paths.', pricing: '$30–$45/month.', idealFor: 'Tech professionals and developers.' },
      { name: 'NanoDegree Corp', features: 'Specializes in tech "Nanodegrees" with hands-on projects and mentorship.', pricing: '$300–$1,000 per Nanodegree.', idealFor: 'Those seeking intensive, project-based tech training.' },
    ],
  },
  {
    name: 'Creative & Hobby-Based',
    icon: PaintBrushIcon,
    platforms: [
      { name: 'CreateShare', features: 'Project-based classes in design, photography, writing, and more. Community-driven features.', pricing: '$14/month or $168/year.', idealFor: 'Creatives and hobbyists.' },
      { name: 'Artistika', features: 'Focuses on creative courses (e.g., illustration, crafts). Available in multiple languages.', pricing: '$10–$30 per course or subscription.', idealFor: 'Creative professionals and enthusiasts.' },
      { name: 'ExpertClass', features: 'Celebrity-led courses in arts, business, and lifestyle with high-production video content.', pricing: '$10/month (billed annually).', idealFor: 'Those seeking inspiration and insights from experts.' },
    ],
  },
  {
    name: 'Free & Open-Access',
    icon: HeartIcon,
    platforms: [
        { name: 'Omni Academy', features: 'Free K-12 and foundational courses in math, science, and economics. Adaptive learning technology.', pricing: 'Completely free.', idealFor: 'Students and lifelong learners seeking free foundational education.' },
        { name: 'OpenCourseWare', features: 'Free access to university course materials across diverse subjects.', pricing: 'Free.', idealFor: 'Self-learners looking for high-quality academic content without certifications.' },
        { name: 'SkillBuilder', features: 'Free courses in digital marketing, project management, and healthcare.', pricing: 'Free courses; paid certificates available ($30–$50).', idealFor: 'Budget-conscious learners seeking career skills.' },
    ],
  },
  {
    name: 'Corporate & Enterprise',
    icon: BuildingOfficeIcon,
    platforms: [
        { name: 'Cloud Assess', features: 'LMS for corporate training, includes assessments, branding, and workflow automation.', pricing: 'Starts at $99/month for 25 users.', idealFor: 'Businesses needing customized training solutions.' },
        { name: 'Enterprise Learn', features: 'LMS with automated grading, learner tracking, and analytics. Integrates with authoring tools.', pricing: 'Custom pricing.', idealFor: 'Organizations requiring robust training management.' },
    ],
  }
];

const PlatformCard: React.FC<{ platform: Platform }> = ({ platform }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 flex flex-col hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{platform.name}</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-2 flex-grow">
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Features:</span> {platform.features}</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Pricing:</span> {platform.pricing}</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Ideal For:</span> {platform.idealFor}</p>
            </div>
        </div>
    );
};

export const ElearningPlatforms: React.FC = () => {
  return (
    <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Learning Platform Explorer</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">A guide to prominent online learning platforms for academic, professional, and creative growth.</p>
      </header>

      <div className="space-y-8">
        {learningPlatformsData.map(category => (
          <section key={category.name}>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 pb-2 border-b-2 border-primary flex items-center gap-3">
                <category.icon className="w-6 h-6" />
                {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {category.platforms.map(platform => <PlatformCard key={platform.name} platform={platform} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
