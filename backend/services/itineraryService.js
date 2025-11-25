/**
 * Itinerary Service - Multi-Step Task Planning
 * Handles complex trip planning, itinerary creation, and budget management
 */

import geminiResponse from '../gemini.js';
import User from '../models/user.model.js';

class ItineraryService {
    /**
     * Create detailed travel itinerary
     */
    async createItinerary({ location, days, budget, userId, preferences = {} }) {
        try {
            console.info('[ITINERARY-SERVICE]', `Creating ${days}-day itinerary for ${location} with budget ₹${budget}`);

            const prompt = `Create a detailed ${days}-day travel itinerary for ${location} with a total budget of ₹${budget}.

Requirements:
- Include day-by-day breakdown
- Estimate costs for: accommodation, food, transport, activities, miscellaneous
- Suggest specific places to visit, restaurants, and activities
- Keep total cost within budget
- Include morning, afternoon, and evening activities for each day
- Add practical tips and recommendations

${preferences.interests ? `User interests: ${preferences.interests}` : ''}
${preferences.travelStyle ? `Travel style: ${preferences.travelStyle}` : ''}

Return ONLY a JSON object in this exact format:
{
  "location": "${location}",
  "days": ${days},
  "totalBudget": ${budget},
  "estimatedCost": <number>,
  "itinerary": [
    {
      "day": 1,
      "title": "Day title",
      "activities": {
        "morning": "Activity description",
        "afternoon": "Activity description",
        "evening": "Activity description"
      },
      "meals": {
        "breakfast": "Restaurant/place",
        "lunch": "Restaurant/place",
        "dinner": "Restaurant/place"
      },
      "estimatedDailyCost": <number>
    }
  ],
  "accommodation": {
    "type": "Hotel/Hostel/etc",
    "suggestion": "Specific recommendation",
    "costPerNight": <number>
  },
  "transportation": {
    "toDestination": "Mode and cost",
    "local": "Local transport suggestions"
  },
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

            // Get AI response
            const aiResponse = await geminiResponse(prompt, 'Travel Planner', 'User');

            // Parse JSON response
            let itinerary;
            try {
                const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                    aiResponse.match(/\{[\s\S]*\}/);
                const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
                itinerary = JSON.parse(jsonString);
            } catch (parseError) {
                console.error('[ITINERARY-PARSE-ERROR]:', parseError);
                // Fallback to basic structure
                itinerary = this.createFallbackItinerary(location, days, budget);
            }

            // Save to user's itineraries
            if (userId) {
                await this.saveItinerary(userId, itinerary);
            }

            // Generate voice response
            const voiceResponse = `I've created a ${days}-day itinerary for ${location} within your budget of ${budget} rupees. The estimated total cost is ${itinerary.estimatedCost} rupees. Check your screen for the complete day-by-day plan.`;

            return {
                success: true,
                itinerary,
                voiceResponse,
                summary: {
                    location: itinerary.location,
                    days: itinerary.days,
                    budget: itinerary.totalBudget,
                    estimatedCost: itinerary.estimatedCost,
                    savings: budget - itinerary.estimatedCost
                }
            };
        } catch (error) {
            console.error('[ITINERARY-ERROR]:', error.message);
            throw new Error(`Failed to create itinerary: ${error.message}`);
        }
    }

    /**
     * Create fallback itinerary if AI fails
     */
    createFallbackItinerary(location, days, budget) {
        const dailyBudget = Math.floor(budget / days);
        const itinerary = {
            location,
            days,
            totalBudget: budget,
            estimatedCost: budget * 0.9, // Estimate 90% of budget
            itinerary: [],
            accommodation: {
                type: 'Budget Hotel',
                suggestion: 'Book via booking.com or similar',
                costPerNight: Math.floor(dailyBudget * 0.4)
            },
            transportation: {
                toDestination: 'Check flights/trains',
                local: 'Use local transport or rent vehicle'
            },
            tips: [
                'Book accommodation in advance',
                'Try local street food',
                'Use public transport to save money',
                'Visit free attractions'
            ]
        };

        // Create basic day structure
        for (let day = 1; day <= days; day++) {
            itinerary.itinerary.push({
                day,
                title: `Day ${day} - Explore ${location}`,
                activities: {
                    morning: 'Visit local attractions',
                    afternoon: 'Explore markets and culture',
                    evening: 'Enjoy local cuisine'
                },
                meals: {
                    breakfast: 'Hotel/Local cafe',
                    lunch: 'Local restaurant',
                    dinner: 'Street food/Restaurant'
                },
                estimatedDailyCost: dailyBudget
            });
        }

        return itinerary;
    }

    /**
     * Save itinerary to user's profile
     */
    async saveItinerary(userId, itinerary) {
        try {
            await User.findByIdAndUpdate(
                userId,
                {
                    $push: {
                        itineraries: {
                            $each: [{
                                ...itinerary,
                                createdAt: new Date()
                            }],
                            $slice: -10 // Keep last 10 itineraries
                        }
                    }
                },
                { new: true }
            );
            console.info('[ITINERARY-SERVICE]', 'Itinerary saved to user profile');
        } catch (error) {
            console.error('[ITINERARY-SAVE-ERROR]:', error);
            // Don't throw - saving is optional
        }
    }

    /**
     * Get user's saved itineraries
     */
    async getUserItineraries(userId) {
        try {
            const user = await User.findById(userId).select('itineraries');
            return user?.itineraries || [];
        } catch (error) {
            console.error('[ITINERARY-GET-ERROR]:', error);
            return [];
        }
    }

    /**
     * Create shopping list or task list
     */
    async createTaskList({ taskType, items, budget, userId }) {
        try {
            const prompt = `Create a detailed ${taskType} list with the following items: ${items.join(', ')}.
      ${budget ? `Budget: ₹${budget}` : ''}
      
      Return a JSON object with:
      - Categorized items
      - Estimated costs
      - Priority levels
      - Recommendations`;

            const aiResponse = await geminiResponse(prompt, 'Task Planner', 'User');

            let taskList;
            try {
                const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                    aiResponse.match(/\{[\s\S]*\}/);
                const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
                taskList = JSON.parse(jsonString);
            } catch (parseError) {
                taskList = { items, type: taskType, budget };
            }

            return {
                success: true,
                taskList,
                voiceResponse: `I've created your ${taskType} list with ${items.length} items.`
            };
        } catch (error) {
            console.error('[TASK-LIST-ERROR]:', error);
            throw new Error(`Failed to create task list: ${error.message}`);
        }
    }
}

// Export singleton instance
const itineraryService = new ItineraryService();
export default itineraryService;
