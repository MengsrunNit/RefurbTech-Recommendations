
import axios from 'axios';

const testChat = async () => {
    try {
        const response = await axios.post('http://localhost:3000/api/chat', {
            messages: [
                { role: 'user', content: 'I need a cheap iphone under 300 for my kid' }
            ],
            options: { model: 'gpt-4o-mini' }
        });
        
        console.log('Reply:', response.data.reply);
        if (response.data.recommendations) {
            console.log('Recommendations found:', response.data.recommendations.length);
            console.log(JSON.stringify(response.data.recommendations[0], null, 2));
        } else {
            console.log('No recommendations returned.');
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

testChat();
