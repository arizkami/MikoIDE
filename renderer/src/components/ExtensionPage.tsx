import React from 'react';
import { Download, Star, User, Calendar, Globe, Github, ExternalLink } from 'lucide-react';
import type { VSCodeExtension } from './mktapi';

interface ExtensionPageProps {
  extension: VSCodeExtension;
}

const ExtensionPage: React.FC<ExtensionPageProps> = ({ extension }) => {
  const formatInstallCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="h-full bg-[#0d1117] text-[#cccccc] overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Section */}
        <div className="flex items-start gap-6 mb-8">
          <div className="flex-shrink-0">
            <img
              src={extension.iconUrl || '/default-extension-icon.png'}
              alt={`${extension.displayName} icon`}
              className="w-24 h-24 rounded-lg border border-[#3e3e42]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/default-extension-icon.png';
              }}
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{extension.displayName}</h1>
            <p className="text-lg text-[#8b949e] mb-4">{extension.shortDescription}</p>
            
            <div className="flex items-center gap-6 text-sm text-[#8b949e]">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>{extension.publisher.displayName}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Download size={16} />
                <span>{formatInstallCount(extension.statistics.install)} installs</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Star size={16} />
                <span>{extension.statistics.averagerating?.toFixed(1) || 'N/A'} ({extension.statistics.ratingcount} reviews)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Updated {formatDate(extension.lastUpdated)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <button className="bg-[#238636] hover:bg-[#2ea043] text-white px-6 py-2 rounded-md font-medium transition-colors">
              Install
            </button>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-b border-[#3e3e42] mb-6">
          <nav className="flex space-x-8">
            <button className="py-2 px-1 border-b-2 border-[#fd7e14] text-[#fd7e14] font-medium">
              Overview
            </button>
            <button className="py-2 px-1 text-[#8b949e] hover:text-[#cccccc] transition-colors">
              Changelog
            </button>
            <button className="py-2 px-1 text-[#8b949e] hover:text-[#cccccc] transition-colors">
              Dependencies
            </button>
          </nav>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
              <div className="text-[#cccccc] leading-relaxed whitespace-pre-wrap">
                {extension.description || extension.shortDescription}
              </div>
              
              {extension.categories && extension.categories.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {extension.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#21262d] border border-[#3e3e42] rounded-full text-sm text-[#cccccc]"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {extension.tags && extension.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {extension.tags.slice(0, 10).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[#1f2937] border border-[#374151] rounded text-xs text-[#9ca3af]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publisher Info */}
            <div className="bg-[#161b22] border border-[#3e3e42] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Publisher</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#21262d] rounded-full flex items-center justify-center">
                  <User size={20} className="text-[#8b949e]" />
                </div>
                <div>
                  <div className="font-medium text-white">{extension.publisher.displayName}</div>
                  <div className="text-sm text-[#8b949e]">{extension.publisher.publisherName}</div>
                </div>
              </div>
            </div>

            {/* Extension Info */}
            <div className="bg-[#161b22] border border-[#3e3e42] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Version</span>
                  <span className="text-white">{extension.versions[0]?.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Size</span>
                  <span className="text-white">
                    {extension.versions[0]?.assetSizes 
                      ? (extension.versions[0].assetSizes.find(a => a.source === 'Microsoft.VisualStudio.Services.VSIXPackage')?.size ?? 0) / 1024 / 1024 > 0 
                        ? `${((extension.versions[0].assetSizes.find(a => a.source === 'Microsoft.VisualStudio.Services.VSIXPackage')?.size ?? 0) / 1024 / 1024).toFixed(1)}`
                        : 'N/A'
                      : 'N/A'} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Last Updated</span>
                  <span className="text-white">{formatDate(extension.lastUpdated)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Published</span>
                  <span className="text-white">{formatDate(extension.publishedDate)}</span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-[#161b22] border border-[#3e3e42] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Links</h3>
              <div className="space-y-2">
                <a
                  href={`https://marketplace.visualstudio.com/items?itemName=${extension.publisher.publisherName}.${extension.extensionName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
                >
                  <Globe size={16} />
                  <span>Marketplace</span>
                  <ExternalLink size={12} />
                </a>
                
                {extension.repository && (
                  <a
                    href={extension.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
                  >
                    <Github size={16} />
                    <span>Repository</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionPage;