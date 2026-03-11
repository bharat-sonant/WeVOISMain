import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TinyUrlService {

    private characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    private base = this.characters.length;

    private urlMap = new Map<number, string>();
    private idCounter = 1;

    // Generate short URL
    generateShortUrl(longUrl: string): string {

        const id = this.idCounter++;
        const shortCode = this.encodeBase62(id);

        this.urlMap.set(id, longUrl);

        return `${window.location.origin}/${shortCode}`;
    }

    // Get original URL
    getOriginalUrl(shortCode: string): string | null {
        const id = this.decodeBase62(shortCode);
        return this.urlMap.get(id) || null;
    }

    // Encode number to Base62
    private encodeBase62(num: number): string {
        let shortCode = '';

        while (num > 0) {
            const remainder = num % this.base;
            shortCode = this.characters[remainder] + shortCode;
            num = Math.floor(num / this.base);
        }

        return shortCode;
    }

    // Decode Base62 to number
    private decodeBase62(shortCode: string): number {
        let num = 0;

        for (let i = 0; i < shortCode.length; i++) {
            num = num * this.base + this.characters.indexOf(shortCode[i]);
        }

        return num;
    }
}