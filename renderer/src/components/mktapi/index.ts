export interface VSCodeExtension {
  extensionId: string;
  extensionName: string;
  displayName: string;
  shortDescription: string;
  description?: string;
  iconUrl?: string;
  publisher: {
    publisherId: string;
    publisherName: string;
    displayName: string;
  };
  versions: Array<{
    version: string;
    lastUpdated: string;
    assetUri: string;
    fallbackAssetUri: string;
    assetSizes?: Array<{
      source: string;
      size: number;
    }>;
  }>;
  statistics: {
    install: number;
    averagerating?: number;
    ratingcount: number;
  };
  tags: string[];
  releaseDate: string;
  publishedDate: string;
  lastUpdated: string;
  categories: string[];
  flags: string;
  repository?: string;
}

export interface MarketplaceResponse {
  results: Array<{
    extensions: VSCodeExtension[];
    pagingToken?: string;
    resultMetadata: Array<{
      metadataType: string;
      metadataItems: Array<{
        name: string;
        count: number;
      }>;
    }>;
  }>;
}

export interface ExtensionSearchOptions {
  searchText?: string;
  pageSize?: number;
  pageNumber?: number;
  sortBy?: 'NoneOrRelevance' | 'LastUpdatedDate' | 'Title' | 'PublisherName' | 'InstallCount' | 'PublishedDate' | 'AverageRating' | 'TrendingDaily' | 'TrendingWeekly' | 'TrendingMonthly';
  sortOrder?: 'Default' | 'Ascending' | 'Descending';
  categories?: string[];
}

class VSCodeMarketplaceAPI {
    private readonly baseUrl = import.meta.env.VITE_VSMKT_API_URL;
  private readonly apiVersion = '7.2-preview.1';

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Accept': 'application/json;api-version=' + this.apiVersion,
      'Content-Type': 'application/json',
      'User-Agent': 'MikoIDE/1.0.0'
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private transformExtension(rawExtension: any): VSCodeExtension {
    const latestVersion = rawExtension.versions?.[0] || {};
    const statistics = rawExtension.statistics || [];
    
    // Extract statistics from the array format
    const installStat = statistics.find((s: any) => s.statisticName === 'install');
    const ratingCountStat = statistics.find((s: any) => s.statisticName === 'ratingcount');
    const averageRatingStat = statistics.find((s: any) => s.statisticName === 'averagerating');
    
    return {
      extensionId: rawExtension.extensionId || '',
      extensionName: rawExtension.extensionName || '',
      displayName: rawExtension.displayName || rawExtension.extensionName || '',
      shortDescription: rawExtension.shortDescription || '',
      description: rawExtension.description,
      iconUrl: this.extractIconUrl(rawExtension),
      publisher: {
        publisherId: rawExtension.publisher?.publisherId || '',
        publisherName: rawExtension.publisher?.publisherName || '',
        displayName: rawExtension.publisher?.displayName || rawExtension.publisher?.publisherName || ''
      },
      versions: rawExtension.versions?.map((v: any) => ({
        version: v.version || '',
        lastUpdated: v.lastUpdated || '',
        assetUri: v.assetUri || '',
        fallbackAssetUri: v.fallbackAssetUri || '',
        assetSizes: v.files?.map((f: any) => ({
          source: f.source || '',
          size: f.size || 0
        })) || []
      })) || [],
      statistics: {
        install: installStat?.value || 0,
        averagerating: averageRatingStat?.value || 0,
        ratingcount: ratingCountStat?.value || 0
      },
      tags: rawExtension.tags || [],
      releaseDate: rawExtension.releaseDate || '',
      publishedDate: rawExtension.publishedDate || '',
      lastUpdated: latestVersion.lastUpdated || rawExtension.lastUpdated || '',
      categories: rawExtension.categories || [],
      flags: rawExtension.flags || '',
      repository: this.extractRepositoryUrl(rawExtension)
    };
  }

  private extractIconUrl(rawExtension: any): string {
    const latestVersion = rawExtension.versions?.[0];
    if (latestVersion?.files) {
      const iconFile = latestVersion.files.find((f: any) => 
        f.assetType === 'Microsoft.VisualStudio.Services.Icons.Default'
      );
      if (iconFile?.source) {
        return iconFile.source;
      }
    }
    return '';
  }

  private extractRepositoryUrl(rawExtension: any): string {
    const latestVersion = rawExtension.versions?.[0];
    if (latestVersion?.properties) {
      const repoProperty = latestVersion.properties.find((p: any) => 
        p.key === 'Microsoft.VisualStudio.Services.Links.Source'
      );
      if (repoProperty?.value) {
        return repoProperty.value;
      }
    }
    return '';
  }

  async searchExtensions(options: ExtensionSearchOptions = {}): Promise<VSCodeExtension[]> {
    const {
      searchText = '',
      pageSize = 50,
      pageNumber = 1,
      sortBy = 'InstallCount',
      sortOrder = 'Descending',
      categories = []
    } = options;

    const filters = [
      {
        criteria: [
          { filterType: 8, value: 'Microsoft.VisualStudio.Code' },
          { filterType: 12, value: '37888' }
        ]
      }
    ];

    if (searchText) {
      filters[0].criteria.push({ filterType: 10, value: searchText });
    }

    if (categories.length > 0) {
      categories.forEach(category => {
        filters[0].criteria.push({ filterType: 5, value: category });
      });
    }

    const requestBody = {
      filters,
      assetTypes: [],
      flags: 914
    };

    try {
      const response: MarketplaceResponse = await this.makeRequest('/extensionquery', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const rawExtensions = response.results[0]?.extensions || [];
      return rawExtensions.map(ext => this.transformExtension(ext));
    } catch (error) {
      console.error('Failed to search extensions:', error);
      return [];
    }
  }

  async getPopularExtensions(count: number = 20): Promise<VSCodeExtension[]> {
    return this.searchExtensions({
      pageSize: count,
      sortBy: 'InstallCount',
      sortOrder: 'Descending'
    });
  }

  async getFeaturedExtensions(count: number = 10): Promise<VSCodeExtension[]> {
    return this.searchExtensions({
      pageSize: count,
      sortBy: 'TrendingWeekly',
      sortOrder: 'Descending'
    });
  }

  async searchByCategory(category: string, count: number = 20): Promise<VSCodeExtension[]> {
    return this.searchExtensions({
      categories: [category],
      pageSize: count,
      sortBy: 'InstallCount',
      sortOrder: 'Descending'
    });
  }

  getExtensionIconUrl(extension: VSCodeExtension): string {
    if (extension.iconUrl) {
      return extension.iconUrl;
    }
    const iconAsset = extension.versions[0]?.assetUri;
    if (iconAsset) {
      return `${iconAsset}/Microsoft.VisualStudio.Services.Icons.Default`;
    }
    return  import.meta.env.VITE_VSMKT_BASE_URL + '/favicon.ico';
  }

  getInstallCount(extension: VSCodeExtension): number {
    return extension.statistics?.install || 0;
  }

  getRatingCount(extension: VSCodeExtension): number {
    return extension.statistics?.ratingcount || 0;
  }
  getRating(extension: VSCodeExtension): number {
    return extension.statistics?.averagerating || 0;
  }

  formatInstallCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }
}

export const marketplaceAPI = new VSCodeMarketplaceAPI();
export default marketplaceAPI;