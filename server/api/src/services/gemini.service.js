import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.modelName = process.env.GEMINI_MODEL || "gemini-pro";
        this.genAI = null;
        this.model = null;

        if (this.apiKey) {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        }
    }

    isConfigured() {
        return !!this.apiKey;
    }

    /**
     * Call Gemini API with timeout
     */
    async callWithTimeout(apiCall, timeoutMs = 5000) {
        return Promise.race([
            apiCall,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Gemini API timeout')), timeoutMs)
            )
        ]);
    }

    /**
     * Generate sales forecast based on historical data
     */
    async generateSalesForecast(historicalData, options = {}) {
        // Skip Gemini if no data
        if (!historicalData || historicalData.length === 0) {
            return this.generateFallbackForecast(historicalData, options);
        }

        if (!this.isConfigured()) {
            return this.generateFallbackForecast(historicalData, options);
        }

        try {
            const { period = 30, unit = 'days' } = options;

            const prompt = `You are a sales forecasting expert. Based on the following historical sales data, predict the sales for the next ${period} ${unit}.

Historical Data (last ${historicalData.length} periods):
${JSON.stringify(historicalData, null, 2)}

Provide a JSON response with:
1. forecast: Array of {date, predictedAmount, confidence} for next ${period} ${unit}
2. trend: "increasing", "decreasing", or "stable"
3. insights: Array of key insights about the forecast
4. seasonality: Identified seasonal patterns if any

Only return valid JSON, no markdown or extra text.`;

            const result = await this.callWithTimeout(
                this.model.generateContent(prompt),
                5000
            );
            const response = await result.response;
            const text = response.text();

            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // Fallback if parsing fails
            return this.generateFallbackForecast(historicalData, options);
        } catch (error) {
            console.error("Gemini forecast error:", error);
            return this.generateFallbackForecast(historicalData, options);
        }
    }

    /**
     * Analyze customer behavior and generate insights
     */
    async analyzeCustomerBehavior(customerData, salesData) {
        // Skip Gemini if no data
        if (!salesData || salesData.length === 0 || !customerData || customerData.totalCustomers === 0) {
            return this.generateFallbackCustomerInsights(customerData, salesData);
        }

        if (!this.isConfigured()) {
            return this.generateFallbackCustomerInsights(customerData, salesData);
        }

        try {
            const prompt = `You are a customer behavior analyst. Analyze the following customer and sales data to provide actionable insights.

Customer Metrics:
${JSON.stringify(customerData, null, 2)}

Sales Data:
${JSON.stringify(salesData.slice(0, 100), null, 2)}

Provide a JSON response with:
1. segments: Array of identified customer segments with characteristics
2. churnRisk: Percentage of customers at risk of churning and why
3. lifetimeValue: Analysis of customer lifetime value patterns
4. recommendations: Array of actionable recommendations to improve customer retention
5. opportunities: Growth opportunities identified from the data

Only return valid JSON, no markdown or extra text.`;

            const result = await this.callWithTimeout(
                this.model.generateContent(prompt),
                5000
            );
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return this.generateFallbackCustomerInsights(customerData, salesData);
        } catch (error) {
            console.error("Gemini customer analysis error:", error);
            return this.generateFallbackCustomerInsights(customerData, salesData);
        }
    }

    /**
     * Analyze campaign performance and provide optimization suggestions
     */
    async analyzeCampaignPerformance(campaigns) {
        console.log('[Gemini] analyzeCampaignPerformance called with', campaigns?.length || 0, 'campaigns');

        // Skip Gemini if no campaigns
        if (!campaigns || campaigns.length === 0) {
            console.log('[Gemini] No campaigns, using fallback');
            return this.generateFallbackCampaignInsights(campaigns);
        }

        if (!this.isConfigured()) {
            console.log('[Gemini] Not configured, using fallback');
            return this.generateFallbackCampaignInsights(campaigns);
        }

        try {
            console.log('[Gemini] Calling Gemini API for campaign analysis...');
            const prompt = `You are a marketing campaign analyst. Analyze the following campaign performance data and provide optimization recommendations.

Campaign Data:
${JSON.stringify(campaigns, null, 2)}

Provide a JSON response with:
1. topPerformers: Array of best performing campaigns with reasons
2. underperformers: Array of underperforming campaigns with issues identified
3. channelRecommendations: Which channels/platforms to focus on
4. budgetOptimization: Suggestions for budget reallocation
5. actionableInsights: Specific actions to improve campaign ROI

Only return valid JSON, no markdown or extra text.`;

            const result = await this.callWithTimeout(
                this.model.generateContent(prompt),
                5000
            );
            console.log('[Gemini] Got response from Gemini API');
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                console.log('[Gemini] Successfully parsed JSON response');
                return JSON.parse(jsonMatch[0]);
            }

            console.log('[Gemini] Could not parse JSON, using fallback');
            return this.generateFallbackCampaignInsights(campaigns);
        } catch (error) {
            console.error("[Gemini] Campaign analysis error:", error.message);
            return this.generateFallbackCampaignInsights(campaigns);
        }
    }

    /**
     * Generate comprehensive business insights
     */
    async generateBusinessInsights(analyticsData) {
        // Skip Gemini if no meaningful data
        if (!analyticsData || Object.keys(analyticsData).length === 0) {
            return this.generateFallbackBusinessInsights(analyticsData);
        }

        if (!this.isConfigured()) {
            return this.generateFallbackBusinessInsights(analyticsData);
        }

        try {
            const prompt = `You are a business intelligence analyst. Analyze the following comprehensive business data and provide strategic insights.

Analytics Data:
${JSON.stringify(analyticsData, null, 2)}

Provide a JSON response with:
1. keyFindings: Array of the most important findings
2. opportunities: Growth opportunities identified
3. warnings: Potential risks or issues to address
4. trends: Market or business trends observed
5. recommendations: Strategic recommendations prioritized by impact

Only return valid JSON, no markdown or extra text.`;

            const result = await this.callWithTimeout(
                this.model.generateContent(prompt),
                5000
            );
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return this.generateFallbackBusinessInsights(analyticsData);
        } catch (error) {
            console.error("Gemini business insights error:", error);
            return this.generateFallbackBusinessInsights(analyticsData);
        }
    }

    // Fallback methods when Gemini is not configured

    generateFallbackForecast(historicalData, options) {
        const { period = 30 } = options;
        const avgAmount = historicalData.reduce((sum, d) => sum + d.amount, 0) / historicalData.length;
        const trend = this.calculateTrend(historicalData);

        const forecast = [];
        const lastDate = new Date(historicalData[historicalData.length - 1]?.date || new Date());

        for (let i = 1; i <= period; i++) {
            const forecastDate = new Date(lastDate);
            forecastDate.setDate(forecastDate.getDate() + i);

            const trendFactor = trend === 'increasing' ? 1.02 : trend === 'decreasing' ? 0.98 : 1;
            const predictedAmount = avgAmount * Math.pow(trendFactor, i);

            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                predictedAmount: Math.round(predictedAmount * 100) / 100,
                confidence: 0.7 // Moderate confidence for statistical forecast
            });
        }

        return {
            forecast,
            trend,
            insights: [
                `Based on historical data, sales are ${trend}`,
                `Average daily sales: $${avgAmount.toFixed(2)}`,
                `Forecast generated using statistical analysis`
            ],
            seasonality: null
        };
    }

    generateFallbackCustomerInsights(customerData, salesData) {
        return {
            segments: [
                { name: "High Value", count: Math.round(customerData.totalCustomers * 0.2), avgSpend: customerData.avgLifetimeValue * 2 },
                { name: "Regular", count: Math.round(customerData.totalCustomers * 0.5), avgSpend: customerData.avgLifetimeValue },
                { name: "Occasional", count: Math.round(customerData.totalCustomers * 0.3), avgSpend: customerData.avgLifetimeValue * 0.5 }
            ],
            churnRisk: 15,
            lifetimeValue: {
                average: customerData.avgLifetimeValue || 0,
                trend: "stable"
            },
            recommendations: [
                "Implement loyalty program for high-value customers",
                "Send re-engagement campaigns to occasional buyers",
                "Analyze purchasing patterns to predict churn"
            ],
            opportunities: [
                "Cross-sell opportunities with repeat customers",
                "Upsell premium products to high-value segment"
            ]
        };
    }

    generateFallbackCampaignInsights(campaigns) {
        const sortedByROI = [...campaigns].sort((a, b) => {
            const roiA = a.spend > 0 ? ((a.responses || 0) / a.spend) : 0;
            const roiB = b.spend > 0 ? ((b.responses || 0) / b.spend) : 0;
            return roiB - roiA;
        });

        return {
            topPerformers: sortedByROI.slice(0, 3).map(c => ({
                name: c.name,
                reason: "High engagement and low cost per response"
            })),
            underperformers: sortedByROI.slice(-3).map(c => ({
                name: c.name,
                issue: "Low engagement or high cost per response"
            })),
            channelRecommendations: ["Focus on digital channels with best ROI"],
            budgetOptimization: ["Reallocate budget from underperforming to top campaigns"],
            actionableInsights: [
                "A/B test messaging on underperforming campaigns",
                "Scale up budget for top performers",
                "Review targeting criteria for low-engagement campaigns"
            ]
        };
    }

    generateFallbackBusinessInsights(analyticsData) {
        return {
            keyFindings: [
                `Total revenue: $${analyticsData.totalRevenue?.toFixed(2) || 0}`,
                `${analyticsData.totalCustomers || 0} active customers`,
                `${analyticsData.totalCampaigns || 0} campaigns running`
            ],
            opportunities: [
                "Expand to new customer segments",
                "Optimize high-performing channels",
                "Implement automated marketing campaigns"
            ],
            warnings: [
                "Monitor customer churn rates",
                "Review campaign spending efficiency"
            ],
            trends: ["Digital channels showing growth"],
            recommendations: [
                "Invest in customer retention programs",
                "Analyze top customer segments for expansion",
                "Optimize marketing spend based on ROI data"
            ]
        };
    }

    calculateTrend(data) {
        if (data.length < 2) return 'stable';

        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));

        const firstAvg = firstHalf.reduce((sum, d) => sum + d.amount, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.amount, 0) / secondHalf.length;

        const change = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (change > 5) return 'increasing';
        if (change < -5) return 'decreasing';
        return 'stable';
    }
}

export const geminiService = new GeminiService();
