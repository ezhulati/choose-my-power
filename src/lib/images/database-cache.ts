/**
 * Database Cache for OG Images
 * Saves all generated image metadata to database for persistence and analytics
 */

import type { 
  GeneratedImage, 
  ImageGenerationContext,
  CachedImage 
} from '../../types/images';

interface ImageRecord {
  id: string;
  cacheKey: string;
  url: string;
  localPath: string;
  prompt: string;
  context: ImageGenerationContext;
  generatedAt: string;
  expiresAt: string;
  apiCost: number;
  fileSize: number;
  status: 'generated' | 'cached' | 'failed';
  usageCount: number;
  lastUsed: string;
}

class DatabaseCache {
  private db: any; // Will use Netlify database connection
  
  constructor() {
    // Initialize database connection
    this.initializeDatabase();
  }

  /**
   * Initialize database connection and tables
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Import database connection from existing setup
      const { db } = await import('../../config/database.js');
      this.db = db;
      
      // Create images table if it doesn't exist
      await this.createImagesTable();
      
      console.log('✅ Database cache initialized');
    } catch (error) {
      console.warn('⚠️ Database cache not available:', error.message);
    }
  }

  /**
   * Create images table for caching
   */
  private async createImagesTable(): Promise<void> {
    if (!this.db) return;
    
    try {
      // Create table first
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS og_images (
          id VARCHAR(255) PRIMARY KEY,
          cache_key VARCHAR(255) UNIQUE NOT NULL,
          url TEXT NOT NULL,
          local_path TEXT,
          prompt TEXT NOT NULL,
          context JSONB NOT NULL,
          generated_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP,
          api_cost DECIMAL(8,4) DEFAULT 0.10,
          file_size INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'generated',
          usage_count INTEGER DEFAULT 1,
          last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes separately to avoid Neon DB multi-statement issues
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_og_images_cache_key ON og_images(cache_key)`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_og_images_context ON og_images USING GIN(context)`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_og_images_generated_at ON og_images(generated_at)`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_og_images_status ON og_images(status)`);
      
      console.log('✅ OG images database table ready');
    } catch (error) {
      console.error('❌ Failed to create images table:', error);
    }
  }

  /**
   * Save generated image to database
   */
  async saveImage(image: GeneratedImage, localPath?: string): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const imageRecord: Partial<ImageRecord> = {
        id: this.generateImageId(),
        cacheKey: image.cacheKey,
        url: image.url,
        localPath: localPath || '',
        prompt: image.prompt,
        context: image.context,
        generatedAt: image.generatedAt,
        expiresAt: this.calculateExpiryDate(),
        apiCost: 0.10, // Ideogram pricing
        status: 'generated',
        usageCount: 1,
        lastUsed: new Date().toISOString()
      };
      
      await this.db.query(
        `INSERT INTO og_images (
          id, cache_key, url, local_path, prompt, context, 
          generated_at, expires_at, api_cost, status, usage_count, last_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (cache_key) 
        DO UPDATE SET 
          url = $3,
          usage_count = og_images.usage_count + 1,
          last_used = $12,
          updated_at = CURRENT_TIMESTAMP`,
        [
          imageRecord.id,
          imageRecord.cacheKey,
          imageRecord.url,
          imageRecord.localPath,
          imageRecord.prompt,
          JSON.stringify(imageRecord.context),
          imageRecord.generatedAt,
          imageRecord.expiresAt,
          imageRecord.apiCost,
          imageRecord.status,
          imageRecord.usageCount,
          imageRecord.lastUsed
        ]
      );
      
      console.log(`💾 Saved image to database: ${image.cacheKey}`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to save image to database:', error);
      return false;
    }
  }

  /**
   * Get image from database cache
   */
  async getImage(cacheKey: string): Promise<CachedImage | null> {
    if (!this.db) return null;
    
    try {
      const result = await this.db.query(
        'SELECT * FROM og_images WHERE cache_key = $1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
        [cacheKey]
      );
      
      if (!result || !result.rows || result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      
      // Update usage tracking
      await this.db.query(
        'UPDATE og_images SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE cache_key = $1',
        [cacheKey]
      );
      
      return {
        cacheKey: row.cache_key,
        url: row.url,
        localPath: row.local_path,
        generatedAt: row.generated_at,
        context: row.context,
        expiresAt: row.expires_at
      };
      
    } catch (error) {
      console.error('❌ Failed to get image from database:', error);
      return null;
    }
  }

  /**
   * Get image generation analytics
   */
  async getAnalytics(): Promise<{
    totalImages: number;
    totalCost: number;
    topContexts: any[];
    usageStats: any;
    costSavings: any;
  }> {
    if (!this.db) {
      return {
        totalImages: 0,
        totalCost: 0,
        topContexts: [],
        usageStats: {},
        costSavings: {}
      };
    }
    
    try {
      // Total images and cost
      const totals = await this.db.query(`
        SELECT 
          COUNT(*) as total_images,
          SUM(api_cost) as total_cost,
          SUM(usage_count) as total_usage,
          AVG(usage_count) as avg_usage_per_image
        FROM og_images 
        WHERE status = 'generated'
      `);
      
      // Top contexts by usage
      const topContexts = await this.db.query(`
        SELECT 
          context->>'city' as city,
          context->>'pageType' as page_type,
          jsonb_array_length(COALESCE(context->'filters', '[]'::jsonb)) as filter_count,
          COUNT(*) as image_count,
          SUM(usage_count) as total_usage,
          AVG(api_cost) as avg_cost
        FROM og_images 
        WHERE status = 'generated'
        GROUP BY context->>'city', context->>'pageType', jsonb_array_length(COALESCE(context->'filters', '[]'::jsonb))
        ORDER BY total_usage DESC
        LIMIT 10
      `);
      
      // Usage distribution by page type
      const usageStats = await this.db.query(`
        SELECT 
          context->>'pageType' as page_type,
          COUNT(*) as unique_images,
          SUM(usage_count) as total_reuses,
          ROUND(AVG(usage_count::numeric), 2) as avg_reuses_per_image
        FROM og_images
        WHERE status = 'generated'
        GROUP BY context->>'pageType'
        ORDER BY total_reuses DESC
      `);
      
      const totalData = totals.rows[0];
      const potentialImages = parseInt(totalData.total_usage) || 1;
      const actualImages = parseInt(totalData.total_images) || 1;
      const savingsPercent = Math.round((1 - actualImages / potentialImages) * 100);
      
      return {
        totalImages: actualImages,
        totalCost: parseFloat(totalData.total_cost) || 0,
        topContexts: topContexts.rows,
        usageStats: usageStats.rows.reduce((acc, row) => {
          acc[row.page_type] = {
            uniqueImages: parseInt(row.unique_images),
            totalReuses: parseInt(row.total_reuses),
            avgReusesPerImage: parseFloat(row.avg_reuses_per_image)
          };
          return acc;
        }, {}),
        costSavings: {
          actualCost: parseFloat(totalData.total_cost) || 0,
          potentialCost: potentialImages * 0.10,
          savings: (potentialImages * 0.10) - (parseFloat(totalData.total_cost) || 0),
          savingsPercent
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      return {
        totalImages: 0,
        totalCost: 0,
        topContexts: [],
        usageStats: {},
        costSavings: {}
      };
    }
  }

  /**
   * Clean up expired images
   */
  async cleanupExpired(): Promise<number> {
    if (!this.db) return 0;
    
    try {
      const result = await this.db.query(`
        DELETE FROM og_images 
        WHERE expires_at < CURRENT_TIMESTAMP
        RETURNING id
      `);
      
      const cleanedCount = result.rows.length;
      console.log(`🧹 Cleaned ${cleanedCount} expired images from database`);
      return cleanedCount;
      
    } catch (error) {
      console.error('❌ Failed to cleanup expired images:', error);
      return 0;
    }
  }

  /**
   * Get most reused images (for optimization insights)
   */
  async getMostReusedImages(limit: number = 20): Promise<any[]> {
    if (!this.db) return [];
    
    try {
      const result = await this.db.query(`
        SELECT 
          cache_key,
          url,
          prompt,
          context,
          usage_count,
          api_cost,
          (usage_count * 0.10 - api_cost) as cost_savings,
          generated_at
        FROM og_images
        WHERE status = 'generated'
        ORDER BY usage_count DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows.map(row => ({
        ...row,
        context: row.context,
        costSavings: parseFloat(row.cost_savings) || 0
      }));
      
    } catch (error) {
      console.error('❌ Failed to get most reused images:', error);
      return [];
    }
  }

  /**
   * Search images by context
   */
  async searchByContext(searchParams: Partial<ImageGenerationContext>): Promise<any[]> {
    if (!this.db) return [];
    
    try {
      let whereClause = '1=1';
      const params: any[] = [];
      let paramIndex = 1;
      
      if (searchParams.city) {
        whereClause += ` AND context->>'city' = $${paramIndex}`;
        params.push(searchParams.city);
        paramIndex++;
      }
      
      if (searchParams.pageType) {
        whereClause += ` AND context->>'pageType' = $${paramIndex}`;
        params.push(searchParams.pageType);
        paramIndex++;
      }
      
      if (searchParams.cityTier) {
        whereClause += ` AND (context->>'cityTier')::int = $${paramIndex}`;
        params.push(searchParams.cityTier);
        paramIndex++;
      }
      
      const result = await this.db.query(`
        SELECT * FROM og_images 
        WHERE ${whereClause} 
        AND status = 'generated'
        ORDER BY usage_count DESC, generated_at DESC
      `, params);
      
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to search images:', error);
      return [];
    }
  }

  /**
   * Generate unique image ID
   */
  private generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate expiry date (30 days from now)
   */
  private calculateExpiryDate(): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    return expiry.toISOString();
  }
}

// Export singleton instance
export const databaseCache = new DatabaseCache();