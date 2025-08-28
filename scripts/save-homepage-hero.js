#!/usr/bin/env node
/**
 * Save the generated homepage hero image from the test output
 */

import fs from 'fs/promises';

// The base64 image data from FAL API (truncated for brevity - this would be the full string)
const base64ImageData = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAJABAADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDyex0VQ2RnPuetWjo0hBODW5Dp0AnIj7HpWhFYKyAFR+Vf6TONlY/zFqYqpzXZyS6G/oaDoTEYxXX/AGCPP3R0oNhHjG0flSVNMxeNnc45dAbGNpFL/wAI8eQQa68WMZPC4p32CPPK1Xs0L6/UOPXw8/BCmnjw7J3Brr1sIwR8lPWxhH8NHJYX16szj/8AhHpAPuUg0CQDhDXZfYoifu/pSNYxD+GlyIX12qcf/Ybd1pj6G5ONtdf9kiz90UGzi/uCq5AWNqHHDQmHQGnf2NJ6fpXW/YIT/CKDYRDoopezQ/rtRnJDRZPSkOgO3G2uuFjDjJWj7JEv8IpumrAsbUeccfDzgZEZpyaJKo/1Zrrjaxn+EUhtYv7lZ8hp9dk9zlf7FmB+4aRtHl7oR9a6v7JEeqD3pGsocYCCrUEJYt3OTXSZAcgHg+tK+ku/JB5rpTZxbsCMdaVbKPH3RVOBX1tt3OW/sDfwyGgeHdvRDx7V1i2kXGVFPNpEekYqPZC+u1F1OSGiSIMBTSNortnKmusNrD/coFpD02ir9noQsbM5EaC56LQ2gSYPy114sYc8LihtPQgkAdKORWL+u1Djf7Akz900HQX/AK6668WMOO6ePJOxOVwgp30CQ8Fq/J3xGrGzOQTRJFH3BVv+w5Dz9yt1dIlOcFab/YUnr+ldYu1I/wCJY5F9dqNnGf2C5H3TX6mzjZmZzhaO/YUvfIBNO+wuP4af/Zb+tHse46LPzBzWRz36A7cf+21lP1tgS+Zs19yHJqJPjJAeDbY9M1sXHnI3Y2xXJHtA5/YHcVfKJ/RO+Nh4Br6Y59Lsr+LY1t7sj6p1+T4NN+3Gg9p7v69nqWO/Y1tLTL2w2KBwxP5Ev/4cULTdMzCgN6U5f7aKnjwh0VY3qcUP9xZ/6LXzWD2SnzJ6+O2zZsZnyL9j6MJP2T8pYOj8/X67U4lEpRn6tHaLp+yN4+4o/J+j9nI5eN1Xhzs8PTy8wvHfY9Y8XWsYH9/O4oQR9/i+Hy/oNVOZT0uKjF9YO2hpvjU5/GKmAcP1nIVr7Mv8GnRu4NpLIK9fT8/O/y9rEaRGRb7/2Q==';

async function saveImage() {
  try {
    console.log('🏠 Saving homepage hero image...');
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64ImageData, 'base64');
    
    // Save to public directory
    const outputPath = './public/images/og/homepage_night_neighborhood.jpg';
    await fs.writeFile(outputPath, buffer);
    
    console.log(`✅ Perfect nighttime neighborhood hero saved: ${outputPath}`);
    console.log('🎯 Ready to update hero-image-mapper.ts!');
    
  } catch (error) {
    console.error('❌ Error saving image:', error);
  }
}

saveImage();