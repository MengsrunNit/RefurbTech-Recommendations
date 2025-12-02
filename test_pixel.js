
import { senseCurrentValue as sensePixel } from './server/models/pixelPricingModel.js';

const testPixel = () => {
    const releaseDate = new Date('2023-10-12'); // Pixel 8
    const launchPrice = 699;
    
    try {
        const sense = sensePixel({
            releaseDate,
            launchPrice,
            storageGb: 128,
            condition: 'Good',
            band: 0.1
        });
        
        console.log('Pixel Sense Result:', JSON.stringify(sense, null, 2));
    } catch (e) {
        console.error(e);
    }
}

testPixel();
