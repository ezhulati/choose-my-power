/**
 * Auto-Update System for Sitemap
 * Automatically refreshes sitemap when site structure changes
 * Handles page additions, removals, and content updates
 */

interface SitemapUpdateEvent {
  type: 'page_added' | 'page_removed' | 'page_updated' | 'bulk_update';
  urls: string[];
  timestamp: string;
  source: 'build' | 'api' | 'cms' | 'manual';
}

interface SitemapCache {
  lastGenerated: string;
  lastStructureChange: string;
  urlCount: number;
  version: number;
}

/**
 * Sitemap Auto-Update Manager
 * Tracks changes and triggers regeneration when needed
 */
export class SitemapAutoUpdater {
  private static instance: SitemapAutoUpdater;
  private cache: SitemapCache;
  private updateQueue: SitemapUpdateEvent[] = [];
  private isUpdating = false;
  
  constructor() {
    this.cache = {
      lastGenerated: new Date().toISOString(),
      lastStructureChange: new Date().toISOString(),
      urlCount: 0,
      version: 1
    };
  }

  static getInstance(): SitemapAutoUpdater {
    if (!SitemapAutoUpdater.instance) {
      SitemapAutoUpdater.instance = new SitemapAutoUpdater();
    }
    return SitemapAutoUpdater.instance;
  }

  /**
   * Check if sitemap needs regeneration
   */
  needsUpdate(): boolean {
    const timeSinceLastUpdate = Date.now() - new Date(this.cache.lastGenerated).getTime();
    const timeSinceStructureChange = Date.now() - new Date(this.cache.lastStructureChange).getTime();
    
    // Force update if:
    // 1. Structure changed and more than 5 minutes passed
    // 2. More than 1 hour since last generation
    // 3. Pending updates in queue
    
    return (
      (timeSinceStructureChange > 300000 && this.updateQueue.length > 0) || // 5 minutes
      timeSinceLastUpdate > 3600000 || // 1 hour
      this.updateQueue.length > 10 // Queue threshold
    );
  }

  /**
   * Record a page addition
   */
  recordPageAdded(urls: string | string[], source: SitemapUpdateEvent['source'] = 'build'): void {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    
    this.updateQueue.push({
      type: 'page_added',
      urls: urlArray,
      timestamp: new Date().toISOString(),
      source
    });
    
    this.cache.lastStructureChange = new Date().toISOString();
    console.warn(`📄 Sitemap: Recorded ${urlArray.length} page(s) added`);
  }

  /**
   * Record a page removal
   */
  recordPageRemoved(urls: string | string[], source: SitemapUpdateEvent['source'] = 'build'): void {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    
    this.updateQueue.push({
      type: 'page_removed',
      urls: urlArray,
      timestamp: new Date().toISOString(),
      source
    });
    
    this.cache.lastStructureChange = new Date().toISOString();
    console.warn(`🗑️ Sitemap: Recorded ${urlArray.length} page(s) removed`);
  }

  /**
   * Record bulk update (like when adding multiple cities)
   */
  recordBulkUpdate(urls: string[], source: SitemapUpdateEvent['source'] = 'build'): void {
    this.updateQueue.push({
      type: 'bulk_update',
      urls,
      timestamp: new Date().toISOString(),
      source
    });
    
    this.cache.lastStructureChange = new Date().toISOString();
    console.warn(`📦 Sitemap: Recorded bulk update with ${urls.length} URLs`);
  }

  /**
   * Record page content update
   */
  recordPageUpdated(urls: string | string[], source: SitemapUpdateEvent['source'] = 'cms'): void {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    
    this.updateQueue.push({
      type: 'page_updated',
      urls: urlArray,
      timestamp: new Date().toISOString(),
      source
    });
    
    // Content updates don't trigger structure change, just regular update
    console.warn(`✏️ Sitemap: Recorded ${urlArray.length} page(s) updated`);
  }

  /**
   * Process update queue and return statistics
   */
  processUpdates(): {
    pagesAdded: number;
    pagesRemoved: number;
    pagesUpdated: number;
    bulkUpdates: number;
    processed: number;
  } {
    const stats = {
      pagesAdded: 0,
      pagesRemoved: 0,
      pagesUpdated: 0,
      bulkUpdates: 0,
      processed: this.updateQueue.length
    };

    for (const update of this.updateQueue) {
      switch (update.type) {
        case 'page_added':
          stats.pagesAdded += update.urls.length;
          break;
        case 'page_removed':
          stats.pagesRemoved += update.urls.length;
          break;
        case 'page_updated':
          stats.pagesUpdated += update.urls.length;
          break;
        case 'bulk_update':
          stats.bulkUpdates += 1;
          stats.pagesAdded += update.urls.length;
          break;
      }
    }

    // Clear the queue
    this.updateQueue = [];
    
    // Update cache
    this.cache.lastGenerated = new Date().toISOString();
    this.cache.version += 1;

    return stats;
  }

  /**
   * Get current cache status
   */
  getCacheStatus(): SitemapCache & {
    queueLength: number;
    needsUpdate: boolean;
    isUpdating: boolean;
  } {
    return {
      ...this.cache,
      queueLength: this.updateQueue.length,
      needsUpdate: this.needsUpdate(),
      isUpdating: this.isUpdating
    };
  }

  /**
   * Force sitemap regeneration
   */
  async forceUpdate(): Promise<void> {
    if (this.isUpdating) {
      console.warn('⏳ Sitemap update already in progress');
      return;
    }

    this.isUpdating = true;
    console.warn('🔄 Force updating sitemap...');

    try {
      // Process any pending updates
      const stats = this.processUpdates();
      
      // Update cache
      this.cache.lastGenerated = new Date().toISOString();
      this.cache.lastStructureChange = new Date().toISOString();
      
      console.warn('✅ Sitemap force update completed:', stats);
    } catch (error) {
      console.error('❌ Sitemap force update failed:', error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Get update statistics for monitoring
   */
  getUpdateStats(timeframe: 'hour' | 'day' | 'week' = 'day'): {
    period: string;
    totalUpdates: number;
    pageAdditions: number;
    pageRemovals: number;
    contentUpdates: number;
    lastUpdate: string;
  } {
    const now = new Date();
    let cutoff: Date;
    
    switch (timeframe) {
      case 'hour':
        cutoff = new Date(now.getTime() - 3600000);
        break;
      case 'day':
        cutoff = new Date(now.getTime() - 86400000);
        break;
      case 'week':
        cutoff = new Date(now.getTime() - 604800000);
        break;
    }
    
    const recentUpdates = this.updateQueue.filter(
      update => new Date(update.timestamp) > cutoff
    );
    
    return {
      period: timeframe,
      totalUpdates: recentUpdates.length,
      pageAdditions: recentUpdates.filter(u => u.type === 'page_added').length,
      pageRemovals: recentUpdates.filter(u => u.type === 'page_removed').length,
      contentUpdates: recentUpdates.filter(u => u.type === 'page_updated').length,
      lastUpdate: this.cache.lastGenerated
    };
  }
}

/**
 * Global sitemap updater instance
 */
export const sitemapUpdater = SitemapAutoUpdater.getInstance();

/**
 * Utility functions for common update scenarios
 */

/**
 * Record when new cities are added
 */
export function recordNewCities(citySlug: string | string[]): void {
  const cities = Array.isArray(citySlug) ? citySlug : [citySlug];
  const urls: string[] = [];
  
  for (const city of cities) {
    urls.push(`/texas/${city}/`);
    urls.push(`/electricity-plans/${city}/`);
  }
  
  sitemapUpdater.recordBulkUpdate(urls, 'build');
}

/**
 * Record when new providers are added
 */
export function recordNewProviders(providerSlug: string | string[]): void {
  const providers = Array.isArray(providerSlug) ? providerSlug : [providerSlug];
  const urls: string[] = [];
  
  for (const provider of providers) {
    urls.push(`/providers/${provider}/`);
    urls.push(`/providers/${provider}/profile/`);
    urls.push(`/providers/${provider}/plans/`);
  }
  
  sitemapUpdater.recordBulkUpdate(urls, 'build');
}

/**
 * Record when new resource pages are added
 */
export function recordNewResourcePages(paths: string | string[]): void {
  const pathArray = Array.isArray(paths) ? paths : [paths];
  sitemapUpdater.recordPageAdded(pathArray, 'cms');
}

/**
 * Record when faceted navigation pages are generated
 */
export function recordFacetedPages(citySlug: string, filterCombinations: string[][]): void {
  const urls: string[] = [];
  
  for (const combo of filterCombinations) {
    const filterPath = combo.join('/');
    urls.push(`/electricity-plans/${citySlug}/${filterPath}/`);
  }
  
  sitemapUpdater.recordBulkUpdate(urls, 'build');
}

/**
 * Webhook endpoint for external systems
 */
export async function handleSitemapWebhook(
  action: 'add' | 'remove' | 'update',
  urls: string[],
  source: SitemapUpdateEvent['source'] = 'api'
): Promise<{
  success: boolean;
  message: string;
  queueLength: number;
}> {
  try {
    switch (action) {
      case 'add':
        sitemapUpdater.recordPageAdded(urls, source);
        break;
      case 'remove':
        sitemapUpdater.recordPageRemoved(urls, source);
        break;
      case 'update':
        sitemapUpdater.recordPageUpdated(urls, source);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    const status = sitemapUpdater.getCacheStatus();
    
    return {
      success: true,
      message: `Recorded ${urls.length} URL(s) for ${action}`,
      queueLength: status.queueLength
    };
  } catch (error) {
    console.error('Sitemap webhook error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      queueLength: 0
    };
  }
}