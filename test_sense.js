
import { senseCurrentValue } from './server/models/iphonePricingModel.js';

const testSense = () => {
    const modelKey = 'samsung_base';
    const releaseDate = new Date('2023-02-17'); // S23 release
    const launchPrice = 799;
    
    try {
        const sense = senseCurrentValue({
            modelKey,
            releaseDate,
            launchPrice,
            storageGb: 128,
            condition: 'Good',
            band: 0.1
        });
        
        console.log('Sense Result:', JSON.stringify(sense, null, 2));
    } catch (e) {
        console.error(e);
    }
}

testSense();
